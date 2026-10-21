const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();

exports.apply = onRequest(
  { cors: true, region: "europe-west1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { name, phone, email, city, age, background, motivation } = req.body;

    if (!name || !phone || !email || !city) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    try {
      const doc = await db.collection("applications").add({
        name,
        phone,
        email,
        city,
        age: age || "",
        background: background || "",
        motivation: motivation || "",
        createdAt: new Date().toISOString(),
        status: "new",
      });

      res.status(200).json({ ok: true, id: doc.id });
    } catch (err) {
      console.error("Failed to save application:", err);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ---------------------------------------------------------------------------
// Admin RBAC HTTP endpoints (region europe-west1).
//
// These are plain onRequest HTTP functions (not onCall) so they are reachable
// through Firebase Hosting rewrites under an org policy that forbids granting
// `allUsers` the Cloud Run invoker role. Each verifies the Firebase ID token
// from the Authorization header itself and enforces the same role rules — the
// role authority is ALWAYS the custom claim on the verified token, never the
// request body. The `admins` collection is the mirror written only here.
//
// Request:  POST JSON body { ... }, header `Authorization: Bearer <idToken>`.
// Response: 200 JSON on success; non-2xx with { error: "<hebrew>" } otherwise.
// ---------------------------------------------------------------------------

const REGION = "europe-west1";
const HTTP_OPTS = { region: REGION, cors: true };

const VALID_ROLES = ["superadmin", "admin", "viewer"];
const VALID_STATUSES = ["new", "contacted", "interview", "accepted", "rejected"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Error type that carries an HTTP status + Hebrew message to the client.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Verify the bearer ID token and return a decoded principal { uid, email, role }.
async function authenticate(req) {
  // Firebase Hosting strips the standard Authorization header when proxying to
  // a function (for cache-key hygiene), so the client sends the ID token in a
  // custom header that Hosting forwards. Fall back to Authorization for direct
  // (non-proxied) invocation, e.g. local dev hitting the function URL.
  const custom = req.get("X-Admin-Token") || req.get("x-admin-token") || "";
  const header = req.get("Authorization") || req.get("authorization") || "";
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  const idToken = custom || (bearer ? bearer[1] : "");
  if (!idToken) {
    throw new ApiError(401, "נדרשת הזדהות");
  }
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(idToken);
  } catch (err) {
    console.error("verifyIdToken failed:", err && err.code ? err.code : err);
    throw new ApiError(401, "ההזדהות פגה, התחברו מחדש");
  }
  return { uid: decoded.uid, email: decoded.email || "", role: decoded.role };
}

function requireSuperadmin(principal) {
  if (principal.role !== "superadmin") {
    throw new ApiError(403, "נדרשות הרשאות מנהל על");
  }
}

function requireEditor(principal) {
  if (principal.role !== "admin" && principal.role !== "superadmin") {
    throw new ApiError(403, "נדרשות הרשאות עריכה");
  }
}

// Wrap an async (principal, body) => result handler into an onRequest function
// that enforces POST, authenticates, maps ApiError → status, and JSON-encodes.
function httpHandler(handler) {
  return onRequest(HTTP_OPTS, async (req, res) => {
    // `cors: true` handles the OPTIONS preflight automatically.
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const principal = await authenticate(req);
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const result = await handler(principal, body);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error("admin handler failed:", err);
      res.status(500).json({ error: "שגיאה פנימית" });
    }
  });
}

exports.setApplicationStatus = httpHandler(async (principal, body) => {
  requireEditor(principal);

  const appId = body.appId;
  const status = body.status;
  if (typeof appId !== "string" || appId.length === 0 || appId.length > 1500) {
    throw new ApiError(400, "מזהה פנייה לא תקין");
  }
  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    throw new ApiError(400, "סטטוס לא תקין");
  }

  const appRef = db.collection("applications").doc(appId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(appRef);
    if (!snap.exists) {
      throw new ApiError(404, "הפנייה לא נמצאה");
    }
    const from = snap.get("status") || null;
    tx.update(appRef, { status });
    const historyRef = appRef.collection("history").doc();
    tx.set(historyRef, {
      actorUid: principal.uid,
      actorEmail: principal.email,
      field: "status",
      from,
      to: status,
      at: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true, status };
});

exports.setApplicationMeeting = httpHandler(async (principal, body) => {
  requireEditor(principal);

  const appId = body.appId;
  const startTime = body.startTime;
  const bookingUid = body.bookingUid;
  if (typeof appId !== "string" || appId.length === 0 || appId.length > 1500) {
    throw new ApiError(400, "מזהה פנייה לא תקין");
  }
  // startTime / bookingUid are optional (the embed may not provide them),
  // but when present they must be reasonable strings.
  if (
    startTime !== null &&
    startTime !== undefined &&
    (typeof startTime !== "string" || startTime.length > 100)
  ) {
    throw new ApiError(400, "זמן פגישה לא תקין");
  }
  if (
    bookingUid !== null &&
    bookingUid !== undefined &&
    (typeof bookingUid !== "string" || bookingUid.length > 200)
  ) {
    throw new ApiError(400, "מזהה הזמנה לא תקין");
  }

  const meeting = {
    startTime: startTime || null,
    bookingUid: bookingUid || null,
    bookedAt: new Date().toISOString(),
    bookedByEmail: principal.email,
  };

  const appRef = db.collection("applications").doc(appId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(appRef);
    if (!snap.exists) {
      throw new ApiError(404, "הפנייה לא נמצאה");
    }
    const from = snap.get("status") || null;
    tx.update(appRef, { meeting, status: "interview" });
    // Record the meeting booking in the audit history.
    const meetingRef = appRef.collection("history").doc();
    tx.set(meetingRef, {
      actorUid: principal.uid,
      actorEmail: principal.email,
      field: "meeting",
      from: from || "",
      to: meeting.startTime || "booked",
      at: FieldValue.serverTimestamp(),
    });
    // If status actually changed, also log the status transition so the
    // history reads consistently with manual status changes.
    if (from !== "interview") {
      const statusRef = appRef.collection("history").doc();
      tx.set(statusRef, {
        actorUid: principal.uid,
        actorEmail: principal.email,
        field: "status",
        from,
        to: "interview",
        at: FieldValue.serverTimestamp(),
      });
    }
  });
  return { ok: true, status: "interview", meeting };
});

// Convert a Firestore Timestamp (or null/undefined) to an ISO string. Plain
// res.json() would emit {_seconds,_nanoseconds}; the client expects ISO.
function tsToIso(value) {
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return null;
}

exports.listAdmins = httpHandler(async (principal) => {
  requireSuperadmin(principal);

  const snap = await db.collection("admins").get();
  const admins = snap.docs
    .map((doc) => doc.data())
    .filter((data) => data.revoked !== true)
    .map((data) => ({
      uid: data.uid,
      email: data.email,
      role: data.role,
      grantedByEmail: data.grantedByEmail || "",
      grantedAt: tsToIso(data.grantedAt),
      updatedAt: tsToIso(data.updatedAt),
    }));
  return { admins };
});

exports.grantRole = httpHandler(async (principal, body) => {
  requireSuperadmin(principal);

  const role = body.role;
  const rawEmail = body.email;
  if (typeof role !== "string" || !VALID_ROLES.includes(role)) {
    throw new ApiError(400, "תפקיד לא תקין");
  }
  if (typeof rawEmail !== "string") {
    throw new ApiError(400, "כתובת אימייל לא תקינה");
  }
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new ApiError(400, "כתובת אימייל לא תקינה");
  }

  let userRecord;
  try {
    userRecord = await getAuth().getUserByEmail(email);
  } catch (lookupErr) {
    if (lookupErr && lookupErr.code === "auth/user-not-found") {
      throw new ApiError(404, "המשתמש לא קיים במערכת ההזדהות");
    }
    throw lookupErr;
  }
  const uid = userRecord.uid;

  // Self-guard: a superadmin cannot change their own role.
  if (uid === principal.uid) {
    throw new ApiError(409, "לא ניתן לשנות את התפקיד של עצמך");
  }

  // Claim first (replaces the whole claims object — role is the only claim).
  await getAuth().setCustomUserClaims(uid, { role });

  // Then mirror into admins/{uid}.
  const adminRef = db.collection("admins").doc(uid);
  const existing = await adminRef.get();
  const mirror = {
    uid,
    email,
    role,
    grantedBy: principal.uid,
    grantedByEmail: principal.email,
    updatedAt: FieldValue.serverTimestamp(),
    revoked: false,
  };
  if (!existing.exists) {
    mirror.grantedAt = FieldValue.serverTimestamp();
  }
  await adminRef.set(mirror, { merge: true });

  return { ok: true, uid, role };
});

exports.revokeAdmin = httpHandler(async (principal, body) => {
  requireSuperadmin(principal);

  const uid = body.uid;
  if (typeof uid !== "string" || uid.length === 0) {
    throw new ApiError(400, "מזהה משתמש לא תקין");
  }

  // Self-guard: cannot revoke self.
  if (uid === principal.uid) {
    throw new ApiError(409, "לא ניתן להסיר את עצמך");
  }

  // Last-superadmin guard.
  const superadmins = await db
    .collection("admins")
    .where("role", "==", "superadmin")
    .where("revoked", "==", false)
    .get();
  const isOnlySuperadmin =
    superadmins.size === 1 && superadmins.docs[0].id === uid;
  if (isOnlySuperadmin) {
    throw new ApiError(409, "לא ניתן להסיר את מנהל העל האחרון");
  }

  await getAuth().setCustomUserClaims(uid, { role: null });
  await db.collection("admins").doc(uid).update({
    revoked: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
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
// Admin RBAC callables (region europe-west1).
// Role authority is ALWAYS request.auth.token.role (custom claim), never
// request.data. The `admins` collection is the mirror written only here.
// ---------------------------------------------------------------------------

const REGION = "europe-west1";
const VALID_ROLES = ["superadmin", "admin", "viewer"];
const VALID_STATUSES = ["new", "contacted", "interview", "accepted", "rejected"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertAuthed(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "נדרשת הזדהות");
  }
}

function assertSuperadmin(request) {
  assertAuthed(request);
  if (request.auth.token.role !== "superadmin") {
    throw new HttpsError("permission-denied", "נדרשות הרשאות מנהל על");
  }
}

function assertEditor(request) {
  assertAuthed(request);
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "superadmin") {
    throw new HttpsError("permission-denied", "נדרשות הרשאות עריכה");
  }
}

function assertAdmin(request) {
  assertAuthed(request);
  const role = request.auth.token.role;
  if (role !== "viewer" && role !== "admin" && role !== "superadmin") {
    throw new HttpsError("permission-denied", "נדרשות הרשאות ניהול");
  }
}

exports.setApplicationStatus = onCall({ region: REGION }, async (request) => {
  assertEditor(request);

  const appId = request.data && request.data.appId;
  const status = request.data && request.data.status;

  if (typeof appId !== "string" || appId.length === 0 || appId.length > 1500) {
    throw new HttpsError("invalid-argument", "מזהה פנייה לא תקין");
  }
  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    throw new HttpsError("invalid-argument", "סטטוס לא תקין");
  }

  try {
    const appRef = db.collection("applications").doc(appId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(appRef);
      if (!snap.exists) {
        throw new HttpsError("not-found", "הפנייה לא נמצאה");
      }
      const from = snap.get("status") || null;
      tx.update(appRef, { status });
      const historyRef = appRef.collection("history").doc();
      tx.set(historyRef, {
        actorUid: request.auth.uid,
        actorEmail: request.auth.token.email || "",
        field: "status",
        from,
        to: status,
        at: FieldValue.serverTimestamp(),
      });
    });
    return { ok: true, status };
  } catch (err) {
    if (err instanceof HttpsError) {
      throw err;
    }
    console.error("setApplicationStatus failed:", err);
    throw new HttpsError("internal", "שגיאה פנימית");
  }
});

exports.listAdmins = onCall({ region: REGION }, async (request) => {
  assertSuperadmin(request);

  try {
    const snap = await db.collection("admins").get();
    const admins = snap.docs
      .map((doc) => doc.data())
      .filter((data) => data.revoked !== true)
      .map((data) => ({
        uid: data.uid,
        email: data.email,
        role: data.role,
        grantedByEmail: data.grantedByEmail || "",
        grantedAt: data.grantedAt || null,
        updatedAt: data.updatedAt || null,
      }));
    return { admins };
  } catch (err) {
    if (err instanceof HttpsError) {
      throw err;
    }
    console.error("listAdmins failed:", err);
    throw new HttpsError("internal", "שגיאה פנימית");
  }
});

exports.grantRole = onCall({ region: REGION }, async (request) => {
  assertSuperadmin(request);

  const role = request.data && request.data.role;
  const rawEmail = request.data && request.data.email;

  if (typeof role !== "string" || !VALID_ROLES.includes(role)) {
    throw new HttpsError("invalid-argument", "תפקיד לא תקין");
  }
  if (typeof rawEmail !== "string") {
    throw new HttpsError("invalid-argument", "כתובת אימייל לא תקינה");
  }
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new HttpsError("invalid-argument", "כתובת אימייל לא תקינה");
  }

  try {
    let userRecord;
    try {
      userRecord = await getAuth().getUserByEmail(email);
    } catch (lookupErr) {
      if (lookupErr && lookupErr.code === "auth/user-not-found") {
        throw new HttpsError("not-found", "המשתמש לא קיים במערכת ההזדהות");
      }
      throw lookupErr;
    }
    const uid = userRecord.uid;

    // Self-guard: a superadmin cannot change their own role.
    if (uid === request.auth.uid) {
      throw new HttpsError("failed-precondition", "לא ניתן לשנות את התפקיד של עצמך");
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
      grantedBy: request.auth.uid,
      grantedByEmail: request.auth.token.email || "",
      updatedAt: FieldValue.serverTimestamp(),
      revoked: false,
    };
    if (!existing.exists) {
      mirror.grantedAt = FieldValue.serverTimestamp();
    }
    await adminRef.set(mirror, { merge: true });

    return { ok: true, uid, role };
  } catch (err) {
    if (err instanceof HttpsError) {
      throw err;
    }
    console.error("grantRole failed:", err);
    throw new HttpsError("internal", "שגיאה פנימית");
  }
});

exports.revokeAdmin = onCall({ region: REGION }, async (request) => {
  assertSuperadmin(request);

  const uid = request.data && request.data.uid;
  if (typeof uid !== "string" || uid.length === 0) {
    throw new HttpsError("invalid-argument", "מזהה משתמש לא תקין");
  }

  // Self-guard: cannot revoke self.
  if (uid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "לא ניתן להסיר את עצמך");
  }

  try {
    // Last-superadmin guard.
    const superadmins = await db
      .collection("admins")
      .where("role", "==", "superadmin")
      .where("revoked", "==", false)
      .get();
    const isOnlySuperadmin =
      superadmins.size === 1 && superadmins.docs[0].id === uid;
    if (isOnlySuperadmin) {
      throw new HttpsError(
        "failed-precondition",
        "לא ניתן להסיר את מנהל העל האחרון"
      );
    }

    await getAuth().setCustomUserClaims(uid, { role: null });
    await db.collection("admins").doc(uid).update({
      revoked: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { ok: true };
  } catch (err) {
    if (err instanceof HttpsError) {
      throw err;
    }
    console.error("revokeAdmin failed:", err);
    throw new HttpsError("internal", "שגיאה פנימית");
  }
});

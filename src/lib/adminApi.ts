// Thin typed wrappers over the admin HTTP endpoints, with Hebrew error
// mapping. DEV + VITE_ADMIN_TEST_MODE override: wrappers mutate/read the
// in-memory fixtures from applications.ts and make NO network call.
//
// The admin functions are plain HTTP endpoints (onRequest) invoked SAME-ORIGIN
// through Firebase Hosting rewrites (/__call/<name>). Hosting proxies to the
// 2nd-gen function, which avoids cross-origin CORS AND the org policy that
// forbids granting allUsers the Cloud Run invoker role. Auth is carried as a
// Firebase ID token in the Authorization header and verified server-side.

import { auth } from "@/lib/firebase";
import type { Role } from "@/lib/roles";
import type { ApplicationMeeting, ApplicationStatus } from "@/lib/applications";
import { FIXTURE_APPLICATIONS } from "@/lib/applications";

// In prod, same-origin via the hosting rewrite. In DEV (vite dev server, no
// hosting proxy) we hit the deployed function URL directly.
const CALL_BASE = import.meta.env.DEV
  ? "https://europe-west1-negevtalent.cloudfunctions.net"
  : "/__call";

// Thrown with an HTTP status so callers can map it to a Hebrew message.
class ApiError extends Error {
  status: number;
  serverMessage?: string;
  constructor(status: number, serverMessage?: string) {
    super(serverMessage || `HTTP ${status}`);
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

async function callApi<Res>(
  name: string,
  body: Record<string, unknown>,
): Promise<Res> {
  const user = auth.currentUser;
  if (!user) {
    throw new ApiError(401);
  }
  const token = await user.getIdToken();
  const res = await fetch(`${CALL_BASE}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Firebase Hosting strips the Authorization header when proxying to a
      // function, so the ID token travels in a custom header it forwards.
      // Authorization is also sent for the DEV direct-URL path.
      "X-Admin-Token": token,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let serverMessage: string | undefined;
    try {
      const data = await res.json();
      serverMessage = typeof data?.error === "string" ? data.error : undefined;
    } catch {
      // non-JSON error body; ignore.
    }
    throw new ApiError(res.status, serverMessage);
  }
  return (await res.json()) as Res;
}

// --- Request/response contracts --------------------------------------------

export interface GrantRoleRequest {
  email: string;
  role: Role;
}
export interface GrantRoleResponse {
  ok: boolean;
  uid: string;
  role: Role;
}

export interface RevokeAdminRequest {
  uid: string;
}
export interface RevokeAdminResponse {
  ok: boolean;
}

export interface AdminRecord {
  uid: string;
  email: string;
  role: Role;
  grantedByEmail: string;
  grantedAt: string | null;
  updatedAt: string | null;
}
export interface ListAdminsResponse {
  admins: AdminRecord[];
}

export interface SetApplicationStatusRequest {
  appId: string;
  status: ApplicationStatus;
}
export interface SetApplicationStatusResponse {
  ok: boolean;
  status: ApplicationStatus;
}

export interface SetApplicationMeetingRequest {
  appId: string;
  startTime: string | null;
  bookingUid: string | null;
}
export interface SetApplicationMeetingResponse {
  ok: boolean;
  status: ApplicationStatus;
  meeting: ApplicationMeeting;
}

// --- Error mapping ----------------------------------------------------------
//
// The server returns a Hebrew message in `{ error }` for every non-2xx. We
// prefer that message (it is the most specific — e.g. guard/validation text).
// If it is missing, fall back to a per-operation default keyed by HTTP status.

type ErrorMap = Partial<Record<number, string>>;

const ADMIN_ERRORS: ErrorMap = {
  401: "ההזדהות פגה, התחברו מחדש",
  403: "רק מנהל על יכול לבצע פעולה זו",
  404: "המשתמש לא קיים במערכת ההזדהות — צרו קודם חשבון",
  400: "קלט לא תקין",
};

const STATUS_ERRORS: ErrorMap = {
  401: "ההזדהות פגה, התחברו מחדש",
  403: "אין לך הרשאה לשנות סטטוס",
  404: "המועמד לא נמצא",
  400: "ערך לא תקין",
};

const MEETING_ERRORS: ErrorMap = {
  401: "ההזדהות פגה, התחברו מחדש",
  403: "אין לך הרשאה לקבוע פגישה",
  404: "המועמד לא נמצא",
  400: "פרטי הפגישה לא תקינים",
};

const GENERIC_SAVE_ERROR = "השמירה נכשלה, נסו שוב";

function mapError(err: unknown, table: ErrorMap): Error {
  if (err instanceof ApiError) {
    // Prefer the server-provided Hebrew message (most specific).
    if (err.serverMessage) {
      return new Error(err.serverMessage);
    }
    const mapped = table[err.status];
    if (mapped) {
      return new Error(mapped);
    }
  }
  return new Error(GENERIC_SAVE_ERROR);
}

function isTestMode(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_ADMIN_TEST_MODE === "1";
}

// --- Wrappers ---------------------------------------------------------------

export async function grantRole(
  email: string,
  role: Role,
): Promise<GrantRoleResponse> {
  if (isTestMode()) {
    return { ok: true, uid: `fixture-${email}`, role };
  }
  try {
    return await callApi<GrantRoleResponse>("grantRole", { email, role });
  } catch (err) {
    throw mapError(err, ADMIN_ERRORS);
  }
}

export async function revokeAdmin(uid: string): Promise<RevokeAdminResponse> {
  if (isTestMode()) {
    return { ok: true };
  }
  try {
    return await callApi<RevokeAdminResponse>("revokeAdmin", { uid });
  } catch (err) {
    throw mapError(err, ADMIN_ERRORS);
  }
}

export async function listAdmins(): Promise<ListAdminsResponse> {
  if (isTestMode()) {
    return {
      admins: [
        {
          uid: "fixture-superadmin",
          email: "asaf@sb0.tech",
          role: "superadmin",
          grantedByEmail: "bootstrap",
          grantedAt: "2026-10-15T00:00:00.000Z",
          updatedAt: "2026-10-15T00:00:00.000Z",
        },
      ],
    };
  }
  try {
    return await callApi<ListAdminsResponse>("listAdmins", {});
  } catch (err) {
    throw mapError(err, ADMIN_ERRORS);
  }
}

export async function setApplicationStatus(
  appId: string,
  status: ApplicationStatus,
): Promise<SetApplicationStatusResponse> {
  if (isTestMode()) {
    const target = FIXTURE_APPLICATIONS.find((a) => a.id === appId);
    if (target) {
      target.status = status;
    }
    return { ok: true, status };
  }
  try {
    return await callApi<SetApplicationStatusResponse>("setApplicationStatus", {
      appId,
      status,
    });
  } catch (err) {
    throw mapError(err, STATUS_ERRORS);
  }
}

// Records a booked Cal.com meeting onto the application. The Cloud Function
// is the sole writer: it verifies the caller is an editor, stamps the
// meeting, flips status to "interview", and appends an audit-history entry.
export async function setApplicationMeeting(
  appId: string,
  startTime: string | null,
  bookingUid: string | null,
): Promise<SetApplicationMeetingResponse> {
  if (isTestMode()) {
    const meeting: ApplicationMeeting = {
      startTime,
      bookingUid,
      bookedAt: new Date().toISOString(),
      bookedByEmail: "asaf@sb0.tech",
    };
    const target = FIXTURE_APPLICATIONS.find((a) => a.id === appId);
    if (target) {
      target.status = "interview";
      target.meeting = meeting;
    }
    return { ok: true, status: "interview", meeting };
  }
  try {
    return await callApi<SetApplicationMeetingResponse>(
      "setApplicationMeeting",
      { appId, startTime, bookingUid },
    );
  } catch (err) {
    throw mapError(err, MEETING_ERRORS);
  }
}

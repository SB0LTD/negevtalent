// Thin typed wrappers over the callable Cloud Functions, with Hebrew error
// mapping. DEV + VITE_ADMIN_TEST_MODE override: wrappers mutate/read the
// in-memory fixtures from applications.ts and invoke NO callable.

import { httpsCallable } from "firebase/functions";
import { FirebaseError } from "firebase/app";
import { functions } from "@/lib/firebase";
import type { Role } from "@/lib/roles";
import type { ApplicationStatus } from "@/lib/applications";
import { FIXTURE_APPLICATIONS } from "@/lib/applications";

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

// --- Error mapping ----------------------------------------------------------

type ErrorMap = Partial<Record<string, string>>;

const ADMIN_ERRORS: ErrorMap = {
  "permission-denied": "רק מנהל על יכול לבצע פעולה זו",
  "not-found": "המשתמש לא קיים במערכת ההזדהות — צרו קודם חשבון",
  "invalid-argument": "קלט לא תקין",
};

const STATUS_ERRORS: ErrorMap = {
  "permission-denied": "אין לך הרשאה לשנות סטטוס",
  "not-found": "המועמד לא נמצא",
  "invalid-argument": "ערך לא תקין",
};

const GENERIC_SAVE_ERROR = "השמירה נכשלה, נסו שוב";

function mapError(err: unknown, table: ErrorMap): Error {
  if (err instanceof FirebaseError) {
    // httpsCallable errors carry codes like "functions/permission-denied".
    const code = err.code.replace(/^functions\//, "");
    if (code === "failed-precondition" && err.message) {
      // The guard message is server-provided; surface it directly.
      return new Error(err.message);
    }
    const mapped = table[code];
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
    const callable = httpsCallable<GrantRoleRequest, GrantRoleResponse>(
      functions,
      "grantRole",
    );
    const result = await callable({ email, role });
    return result.data;
  } catch (err) {
    throw mapError(err, ADMIN_ERRORS);
  }
}

export async function revokeAdmin(uid: string): Promise<RevokeAdminResponse> {
  if (isTestMode()) {
    return { ok: true };
  }
  try {
    const callable = httpsCallable<RevokeAdminRequest, RevokeAdminResponse>(
      functions,
      "revokeAdmin",
    );
    const result = await callable({ uid });
    return result.data;
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
    const callable = httpsCallable<unknown, ListAdminsResponse>(
      functions,
      "listAdmins",
    );
    const result = await callable({});
    return result.data;
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
    const callable = httpsCallable<
      SetApplicationStatusRequest,
      SetApplicationStatusResponse
    >(functions, "setApplicationStatus");
    const result = await callable({ appId, status });
    return result.data;
  } catch (err) {
    throw mapError(err, STATUS_ERRORS);
  }
}

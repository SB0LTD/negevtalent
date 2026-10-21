// /admin/admins — superadmin-only admin management (list / grant / revoke).

import { useCallback, useEffect, useState } from "react";
import {
  grantRole,
  listAdmins,
  revokeAdmin,
} from "@/lib/adminApi";
import type { AdminRecord } from "@/lib/adminApi";
import type { Role } from "@/lib/roles";
import { roleLabelHe } from "@/lib/roles";
import { MISSING, formatDateTimeHe } from "@/lib/format";

const GRANTABLE_ROLES: Role[] = ["superadmin", "admin", "viewer"];

export function AdminsPage() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listAdmins();
      setAdmins(result.admins);
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : "שגיאת טעינה, נסו לרענן");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGrant = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormNotice(null);
    if (!email.trim()) {
      setFormError("יש להזין אימייל");
      return;
    }
    setSubmitting(true);
    try {
      await grantRole(email.trim(), role);
      setFormNotice(`ההרשאה הוענקה ל-${email.trim()}`);
      setEmail("");
      await load();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "הפעולה נכשלה, נסו שוב");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (admin: AdminRecord) => {
    setFormError(null);
    setFormNotice(null);
    setBusyUid(admin.uid);
    try {
      await revokeAdmin(admin.uid);
      setFormNotice(`ההרשאה הוסרה מ-${admin.email}`);
      await load();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "הפעולה נכשלה, נסו שוב");
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div>
      <h1 className="admin-page-title">ניהול מנהלים</h1>

      <form className="adm-form" onSubmit={handleGrant} noValidate>
        <div className="adm-field">
          <label className="adm-label" htmlFor="grant-email">
            אימייל המנהל
          </label>
          <input
            id="grant-email"
            className="adm-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="grant-role">
            הרשאה
          </label>
          <select
            id="grant-role"
            className="adm-select"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {GRANTABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabelHe(r)}
              </option>
            ))}
          </select>
        </div>
        {formError && <p className="adm-error">{formError}</p>}
        {formNotice && <p className="adm-notice">{formNotice}</p>}
        <button
          type="submit"
          className="adm-btn adm-btn--primary"
          disabled={submitting}
        >
          {submitting ? "מעניק…" : "הענקת הרשאה"}
        </button>
      </form>

      <h2 className="adm-history-title" style={{ marginTop: "1.75rem" }}>
        מנהלים פעילים
      </h2>

      {loading ? (
        <div className="admin-loading">
          <div className="adm-spinner" aria-label="טוען" />
        </div>
      ) : loadError ? (
        <p className="adm-error">
          {loadError}{" "}
          <button type="button" className="adm-btn" onClick={() => void load()}>
            נסו שוב
          </button>
        </p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>אימייל</th>
                <th>הרשאה</th>
                <th>הוענק על ידי</th>
                <th>תאריך</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td className="adm-table-empty" colSpan={5}>
                    אין מנהלים
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.uid}>
                    <td>{admin.email || MISSING}</td>
                    <td>
                      <span className="adm-badge">{roleLabelHe(admin.role)}</span>
                    </td>
                    <td>{admin.grantedByEmail || MISSING}</td>
                    <td>
                      {admin.grantedAt
                        ? formatDateTimeHe(admin.grantedAt)
                        : MISSING}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="adm-btn adm-btn--danger"
                        onClick={() => void handleRevoke(admin)}
                        disabled={busyUid === admin.uid}
                      >
                        {busyUid === admin.uid ? "מסיר…" : "הסרה"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

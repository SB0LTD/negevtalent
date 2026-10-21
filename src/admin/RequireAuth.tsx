// Route guard: gates the whole /admin subtree on auth + a known role.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/admin/useAuth";

export function RequireAuth() {
  const { user, role, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="adm-spinner" aria-label="טוען" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/admin/login" state={{ from: location }} replace />
    );
  }

  // Signed in but no recognised role → denied (FR-1.6). UI convenience only;
  // Firestore rules independently deny all admin data reads.
  if (role === null) {
    return (
      <div className="admin-denied">
        <div className="admin-denied-card">
          <h1 className="admin-denied-title">אין לך הרשאת גישה</h1>
          <p className="admin-denied-text">
            החשבון שלך אינו משויך להרשאות ניהול. פנו למנהל על לקבלת הרשאה.
          </p>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={() => void logout()}
          >
            התנתקות
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

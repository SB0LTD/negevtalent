// Admin shell: brand topbar + side nav + routed <Outlet/>. Does NOT use the
// public Header/Footer.

import { NavLink, Outlet } from "react-router-dom";
import { roleLabelHe } from "@/lib/roles";
import { useAuth, useRole } from "@/admin/useAuth";
import "@/admin/admin.css";

export function AdminLayout() {
  const { user, role, logout } = useAuth();
  const { canManageAdmins } = useRole();

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <span className="admin-topbar-logo">Negev Talent · ניהול</span>
        <span className="admin-topbar-spacer" />
        <div className="admin-topbar-user">
          {user?.email && (
            <span className="admin-topbar-email">{user.email}</span>
          )}
          {role && <span className="adm-badge adm-badge--role">{roleLabelHe(role)}</span>}
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            onClick={() => void logout()}
          >
            התנתקות
          </button>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "admin-nav-link is-active" : "admin-nav-link"
            }
          >
            לוח בקרה
          </NavLink>
          <NavLink
            to="/admin/applications"
            className={({ isActive }) =>
              isActive ? "admin-nav-link is-active" : "admin-nav-link"
            }
          >
            מועמדים
          </NavLink>
          {canManageAdmins && (
            <NavLink
              to="/admin/admins"
              className={({ isActive }) =>
                isActive ? "admin-nav-link is-active" : "admin-nav-link"
              }
            >
              ניהול מנהלים
            </NavLink>
          )}
        </nav>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

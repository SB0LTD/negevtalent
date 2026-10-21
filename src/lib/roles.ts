// Role types and pure RBAC helpers.
// Layer-0 purity: no React, no firebase imports — unit-testable.

export type Role = "superadmin" | "admin" | "viewer";

// Ordering for guards/comparisons: viewer < admin < superadmin.
export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  admin: 1,
  superadmin: 2,
};

export function canManageAdmins(role: Role): boolean {
  return role === "superadmin";
}

export function canEditApplications(role: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.admin;
}

export function canExport(role: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.viewer;
}

export function roleLabelHe(role: Role): string {
  switch (role) {
    case "superadmin":
      return "מנהל על";
    case "admin":
      return "מנהל";
    case "viewer":
      return "צופה";
  }
}

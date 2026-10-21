// Non-component module: the AuthContext object + hooks live here (not in the
// .tsx files) so every component file exports ONLY components and stays clean
// under react-refresh/only-export-components.

import { createContext, useContext } from "react";
import type { User } from "firebase/auth";
import type { Role } from "@/lib/roles";
import {
  canEditApplications,
  canExport,
  canManageAdmins,
} from "@/lib/roles";

export interface AuthContextValue {
  user: User | null;
  role: Role | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export interface RolePredicates {
  role: Role | null;
  canManageAdmins: boolean;
  canEditApplications: boolean;
  canExport: boolean;
}

// roles.ts predicates bound to the current role; false when role is null.
export function useRole(): RolePredicates {
  const { role } = useAuth();
  return {
    role,
    canManageAdmins: role ? canManageAdmins(role) : false,
    canEditApplications: role ? canEditApplications(role) : false,
    canExport: role ? canExport(role) : false,
  };
}

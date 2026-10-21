// Declarative role gate, used both for route gating (with `redirect`) and
// inline control gating (renders nothing when disallowed and no redirect).

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@/lib/roles";
import { useAuth } from "@/admin/useAuth";

export function RequireRole({
  allow,
  redirect,
  children,
}: {
  allow: Role[];
  redirect?: string;
  children: ReactNode;
}) {
  const { role } = useAuth();
  const allowed = role !== null && allow.includes(role);

  if (!allowed) {
    if (redirect) {
      return <Navigate to={redirect} replace />;
    }
    return null;
  }

  return <>{children}</>;
}

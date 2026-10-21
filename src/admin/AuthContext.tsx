// Provider component ONLY (hooks + context object live in useAuth.ts so this
// file stays lint-clean under react-refresh/only-export-components).

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Role } from "@/lib/roles";
import { ROLE_RANK } from "@/lib/roles";
import { AuthContext } from "@/admin/useAuth";
import type { AuthContextValue } from "@/admin/useAuth";

// Ambient global used only by the DEV test-mode override. Declared inside src
// so tsc (which walks tsconfig.app.json include:['src']) sees it.
declare global {
  interface Window {
    __ADMIN_TEST_ROLE__?: Role | "none" | null;
  }
}

function isValidRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ROLE_RANK, value)
  );
}

function testModeEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_ADMIN_TEST_MODE === "1";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // --- DEV test-mode override: synchronous fake value, NO firebase calls. ---
  if (testModeEnabled()) {
    return <TestModeProvider>{children}</TestModeProvider>;
  }
  return <LiveProvider>{children}</LiveProvider>;
}

function TestModeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthContextValue>(() => {
    const raw = window.__ADMIN_TEST_ROLE__;
    const signedIn = raw !== undefined && raw !== null && raw !== "none";
    const role = isValidRole(raw) ? raw : null;
    const fakeUser = signedIn
      ? ({ uid: "test-uid", email: "test@example.com" } as unknown as User)
      : null;
    return {
      user: fakeUser,
      role,
      loading: false,
      logout: async () => {
        window.__ADMIN_TEST_ROLE__ = "none";
      },
    };
  }, []);

  return <AuthContext value={value}>{children}</AuthContext>;
}

function LiveProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);
      try {
        // Force one refresh so a freshly-granted claim surfaces promptly, then
        // read claims from the resulting token.
        await nextUser.getIdToken(true);
        const result = await nextUser.getIdTokenResult();
        const claimRole = result.claims.role;
        setRole(isValidRole(claimRole) ? claimRole : null);
      } catch (err) {
        console.error(err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      logout: () => signOut(auth),
    }),
    [user, role, loading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

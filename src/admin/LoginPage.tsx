// /admin/login — Hebrew email/password sign-in.

import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/admin/useAuth";
import "@/admin/admin.css";

interface FromState {
  from?: { pathname?: string };
}

function mapAuthErrorHe(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "אימייל או סיסמה שגויים";
    case "auth/too-many-requests":
      return "יותר מדי ניסיונות, נסו שוב מאוחר יותר";
    case "auth/user-disabled":
      return "החשבון מושבת";
    case "auth/network-request-failed":
      return "בעיית רשת, נסו שוב";
    default:
      return "ההתחברות נכשלה, נסו שוב";
  }
}

export function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated → redirect away from the login screen.
  if (!loading && user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Inline empty-field validation before any network call.
    if (!email.trim() || !password) {
      setError("יש למלא אימייל וסיסמה");
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const dest =
        (location.state as FromState | null)?.from?.pathname ?? "/admin";
      navigate(dest, { replace: true });
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "unknown";
      console.error(code);
      setError(mapAuthErrorHe(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h1 className="admin-login-title">כניסת מנהלים</h1>
        <form className="adm-form" onSubmit={handleSubmit} noValidate>
          <div className="adm-field">
            <label className="adm-label" htmlFor="admin-email">
              אימייל
            </label>
            <input
              id="admin-email"
              className="adm-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="admin-password">
              סיסמה
            </label>
            <input
              id="admin-password"
              className="adm-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="adm-error">{error}</p>}
          <button
            type="submit"
            className="adm-btn adm-btn--primary"
            disabled={submitting}
          >
            {submitting ? "מתחבר…" : "התחברות"}
          </button>
        </form>
      </div>
    </div>
  );
}

// /admin — summary stat cards (total, per-status, last 7 days) via aggregate
// count queries, plus a compact recent-applications preview.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FIXTURE_APPLICATIONS,
  STATUS_LABEL_HE,
  STATUS_ORDER,
  fetchApplicationsPage,
} from "@/lib/applications";
import type { Application, ApplicationStatus } from "@/lib/applications";
import { formatDateHe } from "@/lib/format";

interface Stats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  last7: number;
}

function isTestMode(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_ADMIN_TEST_MODE === "1";
}

function sevenDaysAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function emptyByStatus(): Record<ApplicationStatus, number> {
  return {
    new: 0,
    contacted: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
  };
}

function computeFixtureStats(): Stats {
  const cutoff = sevenDaysAgoIso();
  const byStatus = emptyByStatus();
  let last7 = 0;
  for (const app of FIXTURE_APPLICATIONS) {
    byStatus[app.status] += 1;
    if (app.createdAt >= cutoff) {
      last7 += 1;
    }
  }
  return { total: FIXTURE_APPLICATIONS.length, byStatus, last7 };
}

async function fetchLiveStats(): Promise<Stats> {
  const col = collection(db, "applications");
  const totalSnap = await getCountFromServer(col);

  const byStatus = emptyByStatus();
  await Promise.all(
    STATUS_ORDER.map(async (status) => {
      const snap = await getCountFromServer(
        query(col, where("status", "==", status)),
      );
      byStatus[status] = snap.data().count;
    }),
  );

  const last7Snap = await getCountFromServer(
    query(col, where("createdAt", ">=", sevenDaysAgoIso())),
  );

  return {
    total: totalSnap.data().count,
    byStatus,
    last7: last7Snap.data().count,
  };
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const nextStats = isTestMode()
          ? computeFixtureStats()
          : await fetchLiveStats();
        const page = await fetchApplicationsPage();
        if (cancelled) return;
        setStats(nextStats);
        setRecent(page.applications.slice(0, 5));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("שגיאת טעינה, נסו לרענן");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="adm-spinner" aria-label="טוען" />
      </div>
    );
  }

  if (error) {
    return <p className="adm-error">{error}</p>;
  }

  return (
    <div>
      <h1 className="admin-page-title">לוח בקרה</h1>

      {stats && (
        <div className="adm-cards">
          <div className="adm-card">
            <div className="adm-card-label">סך הכל מועמדים</div>
            <div className="adm-card-value">{stats.total}</div>
          </div>
          <div className="adm-card">
            <div className="adm-card-label">נרשמו ב-7 הימים האחרונים</div>
            <div className="adm-card-value">{stats.last7}</div>
          </div>
          {STATUS_ORDER.map((status) => (
            <div className="adm-card" key={status}>
              <div className="adm-card-label">{STATUS_LABEL_HE[status]}</div>
              <div className="adm-card-value">{stats.byStatus[status]}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="adm-history-title">מועמדים אחרונים</h2>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>עיר</th>
              <th>תאריך</th>
              <th>סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td className="adm-table-empty" colSpan={4}>
                  אין מועמדים עדיין
                </td>
              </tr>
            ) : (
              recent.map((app) => (
                <tr key={app.id}>
                  <td>
                    <Link
                      className="adm-row-link"
                      to={`/admin/applications/${app.id}`}
                    >
                      {app.name}
                    </Link>
                  </td>
                  <td>{app.city}</td>
                  <td>{formatDateHe(app.createdAt)}</td>
                  <td>
                    <span className="adm-badge adm-badge--status">
                      {STATUS_LABEL_HE[app.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="adm-notice" style={{ marginTop: "1rem" }}>
        <Link className="adm-row-link" to="/admin/applications">
          לכל המועמדים ←
        </Link>
      </p>
    </div>
  );
}

// /admin/applications — paginated/filterable/sortable table + CSV export.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import type {
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  STATUS_LABEL_HE,
  STATUS_ORDER,
  fetchApplicationsPage,
  genderLabelHe,
} from "@/lib/applications";
import type { Application, ApplicationStatus } from "@/lib/applications";
import { MISSING, downloadCsv, formatDateHe, toCsv } from "@/lib/format";
import type { CsvColumn } from "@/lib/format";
import { useRole } from "@/admin/useAuth";

type SortKey = "name" | "createdAt" | "status";
type SortDir = "asc" | "desc";

const INDEX_ERROR_LINK =
  "A composite index (status ASC, createdAt DESC) may be missing; deploy firestore.indexes.json. See the Firebase console link in the thrown error above.";

export function ApplicationsPage() {
  const { canExport } = useRole();

  const [rows, setRows] = useState<Application[]>([]);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchApplicationsPage({
        status: statusFilter || undefined,
      });
      setRows(page.applications);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error(err);
      if (
        err instanceof FirebaseError &&
        (err.code === "failed-precondition" || err.code === "unavailable")
      ) {
        console.error(INDEX_ERROR_LINK);
      }
      setError("שגיאת טעינה, נסו לרענן");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const page = await fetchApplicationsPage({
        status: statusFilter || undefined,
        lastDoc,
      });
      setRows((prev) => [...prev, ...page.applications]);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error(err);
      setError("שגיאת טעינה, נסו לרענן");
    } finally {
      setLoadingMore(false);
    }
  };

  // Client-side free-text search over the loaded set.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.phone, r.city]
        .map((v) => (v ?? "").toLowerCase())
        .some((v) => v.includes(term)),
    );
  }, [rows, search]);

  // Client-side column sort.
  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  };

  const handleExport = () => {
    const columns: CsvColumn<Application>[] = [
      { key: "name", header: "שם", value: (r) => r.name || MISSING },
      { key: "email", header: "אימייל", value: (r) => r.email || MISSING },
      { key: "phone", header: "טלפון", value: (r) => r.phone || MISSING },
      { key: "city", header: "עיר", value: (r) => r.city || MISSING },
      { key: "gender", header: "מגדר", value: (r) => genderLabelHe(r.gender) },
      {
        key: "status",
        header: "סטטוס",
        value: (r) => STATUS_LABEL_HE[r.status],
      },
      {
        key: "createdAt",
        header: "תאריך",
        value: (r) => (r.createdAt ? formatDateHe(r.createdAt) : MISSING),
      },
    ];
    downloadCsv("applications.csv", toCsv(sorted, columns));
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="adm-spinner" aria-label="טוען" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="admin-page-title">מועמדים</h1>

      <div className="adm-toolbar">
        <select
          className="adm-select"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ApplicationStatus | "")
          }
          aria-label="סינון לפי סטטוס"
        >
          <option value="">כל הסטטוסים</option>
          {STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL_HE[status]}
            </option>
          ))}
        </select>

        <input
          className="adm-input"
          type="search"
          placeholder="חיפוש שם / אימייל / טלפון / עיר"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="חיפוש"
        />

        {canExport && (
          <button
            type="button"
            className="adm-btn"
            onClick={handleExport}
            disabled={sorted.length === 0}
          >
            ייצוא CSV
          </button>
        )}
      </div>

      {error && (
        <p className="adm-error">
          {error}{" "}
          <button
            type="button"
            className="adm-btn"
            onClick={() => void loadFirstPage()}
          >
            נסו שוב
          </button>
        </p>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th
                className="is-sortable"
                onClick={() => toggleSort("name")}
              >
                שם {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>אימייל</th>
              <th>טלפון</th>
              <th>עיר</th>
              <th
                className="is-sortable"
                onClick={() => toggleSort("createdAt")}
              >
                תאריך{" "}
                {sortKey === "createdAt"
                  ? sortDir === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                className="is-sortable"
                onClick={() => toggleSort("status")}
              >
                סטטוס{" "}
                {sortKey === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td className="adm-table-empty" colSpan={6}>
                  לא נמצאו מועמדים
                </td>
              </tr>
            ) : (
              sorted.map((app) => (
                <tr key={app.id}>
                  <td>
                    <Link
                      className="adm-row-link"
                      to={`/admin/applications/${app.id}`}
                    >
                      {app.name || MISSING}
                    </Link>
                  </td>
                  <td>{app.email || MISSING}</td>
                  <td>{app.phone || MISSING}</td>
                  <td>{app.city || MISSING}</td>
                  <td>{app.createdAt ? formatDateHe(app.createdAt) : MISSING}</td>
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

      {hasMore && (
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="adm-btn"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? "טוען…" : "טען עוד"}
          </button>
        </div>
      )}
    </div>
  );
}

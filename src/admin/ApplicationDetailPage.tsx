// /admin/applications/:id — all fields + status control + audit history.

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import {
  STATUS_LABEL_HE,
  STATUS_ORDER,
  fetchApplication,
  genderLabelHe,
  subscribeApplicationHistory,
} from "@/lib/applications";
import type {
  Application,
  ApplicationStatus,
  HistoryEntry,
} from "@/lib/applications";
import { setApplicationMeeting, setApplicationStatus } from "@/lib/adminApi";
import { MISSING, formatDateTimeHe } from "@/lib/format";
import { useAuth, useRole } from "@/admin/useAuth";
import { ScheduleMeetingModal } from "@/admin/ScheduleMeetingModal";
import { bookingManageUrl } from "@/lib/cal";
import type { MeetingInfo } from "@/lib/cal";

type LoadState = "loading" | "ready" | "not-found" | "denied" | "error";

function field(value?: string): string {
  const v = (value ?? "").trim();
  return v === "" ? MISSING : v;
}

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canEditApplications } = useRole();
  const { logout } = useAuth();

  const [app, setApp] = useState<Application | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoadState("loading");
      try {
        const result = await fetchApplication(id);
        if (cancelled) return;
        if (!result) {
          setLoadState("not-found");
          return;
        }
        setApp(result);
        setLoadState("ready");
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        if (err instanceof FirebaseError && err.code === "permission-denied") {
          setLoadState("denied");
        } else {
          setLoadState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || loadState !== "ready") return;
    const unsubscribe = subscribeApplicationHistory(id, setHistory);
    return unsubscribe;
  }, [id, loadState]);

  const handleStatusChange = async (next: ApplicationStatus) => {
    if (!app) return;
    const previous = app.status;
    setStatusError(null);
    setStatusSaving(true);
    // Optimistic update.
    setApp({ ...app, status: next });
    try {
      await setApplicationStatus(app.id, next);
    } catch (err) {
      console.error(err);
      // Revert on failure.
      setApp((cur) => (cur ? { ...cur, status: previous } : cur));
      setStatusError(err instanceof Error ? err.message : "השמירה נכשלה, נסו שוב");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleBooked = async (meeting: MeetingInfo) => {
    if (!app) return;
    setMeetingError(null);
    try {
      const res = await setApplicationMeeting(
        app.id,
        meeting.startTime,
        meeting.bookingUid,
      );
      // Reflect the persisted meeting + status locally.
      setApp((cur) =>
        cur ? { ...cur, status: res.status, meeting: res.meeting } : cur,
      );
      setScheduleOpen(false);
    } catch (err) {
      console.error(err);
      setMeetingError(
        err instanceof Error ? err.message : "שמירת הפגישה נכשלה, נסו שוב",
      );
    }
  };

  if (loadState === "loading") {
    return (
      <div className="admin-loading">
        <div className="adm-spinner" aria-label="טוען" />
      </div>
    );
  }

  if (loadState === "not-found") {
    return <div className="adm-empty">המועמד לא נמצא</div>;
  }

  if (loadState === "denied") {
    return (
      <div className="adm-empty">
        <p>אין הרשאה</p>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            type="button"
            className="adm-btn"
            onClick={() => window.location.reload()}
          >
            רענון
          </button>
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

  if (loadState === "error" || !app) {
    return <p className="adm-error">שגיאת טעינה, נסו לרענן</p>;
  }

  return (
    <div>
      <p className="adm-notice" style={{ marginBottom: "0.75rem" }}>
        <Link className="adm-row-link" to="/admin/applications">
          → חזרה לרשימה
        </Link>
      </p>
      <h1 className="admin-page-title">{field(app.name)}</h1>

      <div className="adm-detail">
        <div className="adm-detail-grid">
          <span className="adm-detail-label">אימייל</span>
          <span className="adm-detail-value">{field(app.email)}</span>

          <span className="adm-detail-label">טלפון</span>
          <span className="adm-detail-value">{field(app.phone)}</span>

          <span className="adm-detail-label">עיר</span>
          <span className="adm-detail-value">{field(app.city)}</span>

          <span className="adm-detail-label">מגדר</span>
          <span className="adm-detail-value">{genderLabelHe(app.gender)}</span>

          <span className="adm-detail-label">תעודת זהות</span>
          <span className="adm-detail-value">{field(app.idNum)}</span>

          <span className="adm-detail-label">תאריך לידה</span>
          <span className="adm-detail-value">{field(app.birthdate)}</span>

          <span className="adm-detail-label">גיל</span>
          <span className="adm-detail-value">{field(app.age)}</span>

          <span className="adm-detail-label">רקע</span>
          <span className="adm-detail-value">{field(app.background)}</span>

          <span className="adm-detail-label">מוטיבציה</span>
          <span className="adm-detail-value">{field(app.motivation)}</span>

          <span className="adm-detail-label">נרשם בתאריך</span>
          <span className="adm-detail-value">
            {app.createdAt ? formatDateTimeHe(app.createdAt) : MISSING}
          </span>

          <span className="adm-detail-label">סטטוס</span>
          <span className="adm-detail-value">
            {canEditApplications ? (
              <select
                className="adm-select"
                value={app.status}
                disabled={statusSaving}
                onChange={(e) =>
                  void handleStatusChange(e.target.value as ApplicationStatus)
                }
              >
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL_HE[status]}
                  </option>
                ))}
              </select>
            ) : (
              <span className="adm-badge adm-badge--status">
                {STATUS_LABEL_HE[app.status]}
              </span>
            )}
          </span>

          <span className="adm-detail-label">פגישה</span>
          <span className="adm-detail-value">
            {app.meeting ? (
              <span className="adm-meeting-info">
                <span className="adm-badge adm-badge--meeting">נקבעה פגישה</span>{" "}
                {app.meeting.startTime
                  ? formatDateTimeHe(app.meeting.startTime)
                  : ""}
                {app.meeting.bookingUid && (
                  <>
                    {" · "}
                    <a
                      className="adm-row-link"
                      href={bookingManageUrl(app.meeting.bookingUid)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      פרטי ההזמנה
                    </a>
                  </>
                )}
              </span>
            ) : (
              <span className="adm-notice">טרם נקבעה</span>
            )}
          </span>
        </div>

        {canEditApplications && (
          <div className="adm-detail-actions">
            <button
              type="button"
              className="adm-btn adm-btn--primary"
              onClick={() => {
                setMeetingError(null);
                setScheduleOpen(true);
              }}
            >
              {app.meeting ? "קביעת פגישה מחדש" : "קביעת פגישה"}
            </button>
          </div>
        )}

        {statusError && <p className="adm-error">{statusError}</p>}
        {meetingError && <p className="adm-error">{meetingError}</p>}

        <div className="adm-history">
          <h2 className="adm-history-title">היסטוריית שינויים</h2>
          {history.length === 0 ? (
            <p className="adm-notice">אין שינויים</p>
          ) : (
            history.map((entry) => (
              <div className="adm-history-item" key={entry.id}>
                <span>
                  {entry.actorEmail || MISSING}:{" "}
                  {entry.field === "meeting" ? (
                    "נקבעה פגישה"
                  ) : (
                    <>
                      {STATUS_LABEL_HE[entry.from as ApplicationStatus] ??
                        entry.from}{" "}
                      ←{" "}
                      {STATUS_LABEL_HE[entry.to as ApplicationStatus] ??
                        entry.to}
                    </>
                  )}
                </span>{" "}
                <span className="adm-history-meta">
                  {entry.at ? formatDateTimeHe(entry.at) : "שומר…"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <ScheduleMeetingModal
        open={scheduleOpen}
        candidateName={app.name}
        candidateEmail={app.email}
        onClose={() => setScheduleOpen(false)}
        onBooked={(meeting) => void handleBooked(meeting)}
      />
    </div>
  );
}

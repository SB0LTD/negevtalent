// Animated Cal.com booking modal for scheduling a candidate interview.
//
// Always books the same public event type (CAL_LINK = sb0-ltd/interview),
// prefilled with the candidate's name + email. On a successful booking the
// embed emits `bookingSuccessful`; we normalise the payload and hand it to
// onBooked so the detail page can persist it via the audited callable.
//
// DEV + VITE_ADMIN_TEST_MODE: the real embed is replaced by a lightweight
// stand-in with a "confirm booking" button, so routing/RBAC specs run offline
// with no network and no iframe.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_LINK, parseBookingDetail } from "@/lib/cal";
import type { MeetingInfo } from "@/lib/cal";

interface ScheduleMeetingModalProps {
  open: boolean;
  candidateName: string;
  candidateEmail: string;
  onClose: () => void;
  onBooked: (meeting: MeetingInfo) => void;
}

function isTestMode(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_ADMIN_TEST_MODE === "1";
}

export function ScheduleMeetingModal({
  open,
  candidateName,
  candidateEmail,
  onClose,
  onBooked,
}: ScheduleMeetingModalProps) {
  // Keep the latest onBooked in a ref so the embed listener (registered once)
  // always calls the current handler without re-subscribing.
  const onBookedRef = useRef(onBooked);
  useEffect(() => {
    onBookedRef.current = onBooked;
  }, [onBooked]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Register the Cal embed listener while the modal is open (real mode only).
  useEffect(() => {
    if (!open || isTestMode()) return;
    let active = true;
    let api: Awaited<ReturnType<typeof getCalApi>> | null = null;

    const handler = (e: { detail?: { data?: unknown } }) => {
      const meeting = parseBookingDetail(e?.detail?.data);
      onBookedRef.current(meeting);
    };

    (async () => {
      try {
        api = await getCalApi();
        if (!active || !api) return;
        api("ui", { theme: "light", hideEventTypeDetails: false });
        api("on", { action: "bookingSuccessful", callback: handler });
      } catch (err) {
        console.error("Cal embed init failed:", err);
      }
    })();

    return () => {
      active = false;
      if (api) {
        api("off", { action: "bookingSuccessful", callback: handler });
      }
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="adm-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="adm-modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="קביעת פגישה"
          >
            <div className="adm-modal-head">
              <div>
                <h2 className="adm-modal-title">קביעת פגישה</h2>
                <p className="adm-modal-sub">
                  {candidateName} · פגישה עם אסף לפי הזמינות ביומן
                </p>
              </div>
              <button
                type="button"
                className="adm-modal-close"
                onClick={onClose}
                aria-label="סגירה"
              >
                ✕
              </button>
            </div>

            <div className="adm-modal-body">
              {isTestMode() ? (
                <TestModeBooker
                  onConfirm={() =>
                    onBookedRef.current({
                      startTime: "2026-10-25T10:00:00.000Z",
                      bookingUid: "fixture-booking-uid",
                    })
                  }
                />
              ) : (
                <Cal
                  calLink={CAL_LINK}
                  style={{ width: "100%", height: "100%", overflow: "auto" }}
                  config={{
                    name: candidateName,
                    email: candidateEmail,
                    theme: "light",
                    layout: "month_view",
                  }}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Offline stand-in used only in DEV test mode.
function TestModeBooker({ onConfirm }: { onConfirm: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <div className="adm-modal-testbooker" data-testid="cal-test-booker">
      <p className="adm-notice">מצב בדיקה — אין הטמעה חיה של Cal.com</p>
      <button
        type="button"
        className="adm-btn adm-btn--primary"
        disabled={done}
        onClick={() => {
          setDone(true);
          onConfirm();
        }}
      >
        {done ? "נקבע" : "אשר קביעת פגישה"}
      </button>
    </div>
  );
}

// Cal.com scheduling config + typed helpers for the embedded booker.
//
// We always book the same public event type (Asaf's interview slot on
// cal.com/sb0-ltd), so no OAuth client / secret is involved — the embed talks
// to the public booking page over an iframe. The only configurable value is
// the public cal link, overridable via env for staging/testing.

/**
 * Public Cal.com link in "<username>/<event-slug>" form. Candidate interviews
 * are always booked against Asaf's "interview" event type on the sb0-ltd org.
 * Safe to ship to the browser (it is a public booking URL, not a secret).
 */
export const CAL_LINK: string =
  import.meta.env.VITE_CAL_LINK?.trim() || "sb0-ltd/interview";

/**
 * Shape of the payload Cal.com emits on the `bookingSuccessful` embed event.
 * The embed sends an untyped detail object; we read defensively and normalise
 * to the fields we persist. All fields optional — never trust the shape.
 */
export interface CalBookingDetail {
  booking?: {
    uid?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
  };
  // Some embed versions nest the event date under `date`/`eventType`.
  date?: string;
  eventType?: { slug?: string };
}

/** Normalised meeting record persisted onto an application. */
export interface MeetingInfo {
  // ISO-8601 start time of the booked meeting, when the embed provides it.
  startTime: string | null;
  // Cal.com booking UID, used to build the manage/reschedule link.
  bookingUid: string | null;
}

/** Extract the meeting fields we care about from a raw embed event detail. */
export function parseBookingDetail(raw: unknown): MeetingInfo {
  const detail = (raw ?? {}) as CalBookingDetail;
  const booking = detail.booking ?? {};
  const startTime =
    (typeof booking.startTime === "string" && booking.startTime) ||
    (typeof detail.date === "string" && detail.date) ||
    null;
  const bookingUid =
    typeof booking.uid === "string" && booking.uid ? booking.uid : null;
  return { startTime, bookingUid };
}

/** Build the public Cal.com management link for a booking UID. */
export function bookingManageUrl(uid: string): string {
  return `https://cal.com/booking/${encodeURIComponent(uid)}`;
}

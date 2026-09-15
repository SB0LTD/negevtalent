/**
 * Make.com webhook sync for application submissions.
 * The CRM expects a very specific set of keys.
 */

const WEBHOOK_URL = "https://hook.eu1.make.com/6g2ak1dd5jg5kw4h94q7k956hl2iqccm";

// Fixed course ID for the Sig bootcamp in the partner CRM.
const COURSE_ID = "12987820829";

export interface WebhookPayload {
  names: string;
  email: string;
  phone: string; // +972... international format
  city: string;
  gender: string; // CRM numeric code
  datetime: string; // birthdate YYYY-MM-DD
  id_num: string;
  courses1: string;
}

export interface ApplicationInput {
  name: string;
  email: string;
  phone: string; // local format e.g. 0501234567
  city: string;
  gender: string; // CRM numeric code: "7" (male) | "0" (female) | "1" (other)
  birthdate: string; // YYYY-MM-DD
  idNum: string;
}

// Valid CRM gender codes. These are the exact values the form emits and the
// CRM expects — the form is the single source of truth, this set only guards
// against anything unexpected reaching the webhook.
const VALID_GENDER_CODES = new Set(["7", "0", "1"]);

/** Convert a local Israeli phone (0501234567) to international (+972501234567). */
export function toInternationalPhone(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  if (digits.startsWith("972")) return "+" + digits;
  return "+972" + digits;
}

export function buildWebhookPayload(input: ApplicationInput): WebhookPayload {
  const gender = input.gender.trim();
  if (!VALID_GENDER_CODES.has(gender)) {
    throw new Error(`Invalid gender code: "${gender}". Expected one of 7, 0, 1.`);
  }
  return {
    names: input.name.trim(),
    email: input.email.trim(),
    phone: toInternationalPhone(input.phone),
    city: input.city.trim(),
    gender,
    datetime: input.birthdate,
    id_num: input.idNum.trim(),
    courses1: COURSE_ID,
  };
}

/**
 * Fire the webhook. We send the payload as application/x-www-form-urlencoded
 * so Make.com parses each field into its own top-level key (names, email,
 * phone, ...) rather than a single "value" blob (which is what happens when
 * a raw JSON string is sent as text/plain).
 *
 * URLSearchParams produces a form-encoded body and sets the matching
 * Content-Type automatically — a "simple" request that is allowed under
 * no-cors mode, so the request never fails on CORS and never blocks the UX.
 */
export async function sendToWebhook(input: ApplicationInput): Promise<void> {
  const payload = buildWebhookPayload(input);
  const body = new URLSearchParams(
    payload as unknown as Record<string, string>
  );
  await fetch(WEBHOOK_URL, {
    method: "POST",
    body,
    mode: "no-cors",
  });
}

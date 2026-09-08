/**
 * Make.com webhook sync for application submissions.
 * The CRM expects a very specific set of keys.
 */

const WEBHOOK_URL = "https://hook.eu1.make.com/6g2ak1dd5jg5kw4h94q7k956hl2iqccm";

// Fixed course ID for the Sig bootcamp in the partner CRM.
const COURSE_ID = "12592999035";

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
  gender: string; // "male" | "female" | "other"
  birthdate: string; // YYYY-MM-DD
  idNum: string;
}

// CRM gender codes.
const GENDER_CODES: Record<string, string> = {
  male: "6",
  female: "7",
  other: "8",
};

/** Convert a local Israeli phone (0501234567) to international (+972501234567). */
export function toInternationalPhone(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  if (digits.startsWith("972")) return "+" + digits;
  return "+972" + digits;
}

export function buildWebhookPayload(input: ApplicationInput): WebhookPayload {
  return {
    names: input.name.trim(),
    email: input.email.trim(),
    phone: toInternationalPhone(input.phone),
    city: input.city.trim(),
    gender: GENDER_CODES[input.gender] ?? "8",
    datetime: input.birthdate,
    id_num: input.idNum.trim(),
    courses1: COURSE_ID,
  };
}

/**
 * Fire the webhook. Make.com hooks accept a JSON string body with a
 * text/plain content type, which is allowed under no-cors mode
 * (browsers restrict Content-Type to simple values for no-cors requests).
 * no-cors ensures the request never fails on CORS and never blocks the UX.
 */
export async function sendToWebhook(input: ApplicationInput): Promise<void> {
  const payload = buildWebhookPayload(input);
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(payload),
    mode: "no-cors",
  });
}

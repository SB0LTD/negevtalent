import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { sendToWebhook } from "@/lib/webhook";
import "./ApplyWizard.css";

/* ─── Types ─── */
interface FormData {
  name: string;
  phone: string;
  email: string;
  idNum: string;
  birthdate: string;
  gender: string;
  city: string;
  background: string;
  motivation: string;
}

interface FieldError {
  name?: string;
  phone?: string;
  email?: string;
  idNum?: string;
  birthdate?: string;
  gender?: string;
  city?: string;
}

/* ─── Constants ─── */
const STEPS = [
  { id: "personal", label: "פרטים אישיים" },
  { id: "details", label: "פרטים נוספים" },
];

const NEGEV_CITIES = [
  "באר שבע", "אשדוד", "אשקלון", "אופקים", "נתיבות", "שדרות",
  "דימונה", "ערד", "ירוחם", "מצפה רמון", "רהט", "תל שבע",
  "כסיפה", "לקיה", "חורה", "שגב שלום", "ערערה בנגב",
  "עומר", "מיתר", "להבים", "גילת", "משאבי שדה",
  "קריית גת", "אילת", "יבנה",
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

/* ─── Validators ─── */
function validateName(v: string): string | undefined {
  if (!v.trim()) return "שדה חובה";
  if (v.trim().length < 2) return "לפחות 2 תווים";
  return undefined;
}

function validatePhone(v: string): string | undefined {
  if (!v.trim()) return "שדה חובה";
  const cleaned = v.replace(/[\s\-()]/g, "");
  if (!/^0[2-9]\d{7,8}$/.test(cleaned)) return "מספר טלפון לא תקין";
  return undefined;
}

function validateEmail(v: string): string | undefined {
  if (!v.trim()) return "שדה חובה";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "כתובת אימייל לא תקינה";
  return undefined;
}

function validateCity(v: string): string | undefined {
  if (!v.trim()) return "שדה חובה";
  return undefined;
}

function validateIdNum(v: string): string | undefined {
  if (!v.trim()) return "שדה חובה";
  const id = v.trim();
  if (!/^\d{5,9}$/.test(id)) return "מספר תעודת זהות לא תקין";
  const padded = id.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = Number(padded[i]) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  if (sum % 10 !== 0) return "מספר תעודת זהות לא תקין";
  return undefined;
}

function validateBirthdate(v: string): string | undefined {
  if (!v.trim()) return "שדה חובה";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "תאריך לא תקין";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  if (age < 16 || age > 99) return "גיל לא תקין";
  return undefined;
}

function validateGender(v: string): string | undefined {
  if (!v.trim()) return "שדה חובה";
  return undefined;
}

/* ─── Main Component ─── */
export function ApplyWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<FormData>({
    name: "", phone: "", email: "", idNum: "", birthdate: "", gender: "",
    city: "", background: "", motivation: "",
  });

  const set = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const validateStep1 = (): boolean => {
    const e: FieldError = {
      name: validateName(data.name),
      phone: validatePhone(data.phone),
      email: validateEmail(data.email),
    };
    setErrors((prev) => ({ ...prev, ...e }));
    setTouched((prev) => ({ ...prev, name: true, phone: true, email: true }));
    return !e.name && !e.phone && !e.email;
  };

  const validateStep2 = (): boolean => {
    const e: FieldError = {
      idNum: validateIdNum(data.idNum),
      birthdate: validateBirthdate(data.birthdate),
      gender: validateGender(data.gender),
      city: validateCity(data.city),
    };
    setErrors((prev) => ({ ...prev, ...e }));
    setTouched((prev) => ({ ...prev, idNum: true, birthdate: true, gender: true, city: true }));
    return !e.idNum && !e.birthdate && !e.gender && !e.city;
  };

  const next = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setDir(1);
    setStep((s) => s + 1);
  };

  const back = () => { setDir(-1); setStep((s) => s - 1); };

  const submit = async () => {
    if (!validateStep2()) return;
    setSubmitting(true);
    const cleanPhone = data.phone.replace(/[\s\-()]/g, "");

    try {
      const db = getFirestore(app);
      await addDoc(collection(db, "applications"), {
        ...data,
        phone: cleanPhone,
        createdAt: new Date().toISOString(),
        status: "new",
      });
    } catch (err) {
      console.error("Firestore error:", err);
      const pending = JSON.parse(localStorage.getItem("pending_applications") || "[]");
      pending.push({ ...data, createdAt: new Date().toISOString() });
      localStorage.setItem("pending_applications", JSON.stringify(pending));
    }

    try {
      await sendToWebhook({
        name: data.name,
        email: data.email,
        phone: cleanPhone,
        city: data.city,
        gender: data.gender,
        birthdate: data.birthdate,
        idNum: data.idNum,
      });
    } catch (err) {
      console.error("Webhook error:", err);
    }

    setSubmitting(false);
    navigate("/thank-you");
  };

  return (
    <div className="wizard">
      {/* Progress */}
      <div className="wizard__progress">
        {STEPS.map((s, i) => (
          <div key={s.id} className="wizard__step">
            <div className="wizard__bar">
              <motion.div
                className="wizard__bar-fill"
                style={{ backgroundColor: i <= step ? "#214CC9" : "#f3f4f6" }}
                initial={{ width: "0%" }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="wizard__step-label" style={{ color: i <= step ? "#0B0B5D" : "#9ca3af" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="wizard__stage">
        <AnimatePresence mode="wait" custom={dir}>
          {step === 0 && (
            <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="wizard__fields">
              <h3 className="wizard__heading">ספרו לנו קצת על עצמכם</h3>
              <FormInput label="שם מלא" placeholder="ישראל ישראלי" value={data.name}
                onChange={(v) => set("name", v)}
                onBlur={() => { touch("name"); setErrors((e) => ({ ...e, name: validateName(data.name) })); }}
                error={touched.name ? errors.name : undefined} />
              <FormInput label="טלפון" placeholder="050-1234567" value={data.phone}
                onChange={(v) => set("phone", formatPhone(v))}
                onBlur={() => { touch("phone"); setErrors((e) => ({ ...e, phone: validatePhone(data.phone) })); }}
                error={touched.phone ? errors.phone : undefined} type="tel" dir="ltr" />
              <FormInput label="אימייל" placeholder="you@example.com" value={data.email}
                onChange={(v) => set("email", v)}
                onBlur={() => { touch("email"); setErrors((e) => ({ ...e, email: validateEmail(data.email) })); }}
                error={touched.email ? errors.email : undefined} type="email" dir="ltr" />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="wizard__fields">
              <h3 className="wizard__heading">עוד כמה פרטים</h3>
              <div className="wizard__row2">
                <FormInput label="תעודת זהות" placeholder="123456789" value={data.idNum}
                  onChange={(v) => set("idNum", v.replace(/\D/g, "").slice(0, 9))}
                  onBlur={() => { touch("idNum"); setErrors((e) => ({ ...e, idNum: validateIdNum(data.idNum) })); }}
                  error={touched.idNum ? errors.idNum : undefined} type="text" dir="ltr" />
                <FormInput label="תאריך לידה" value={data.birthdate}
                  onChange={(v) => set("birthdate", v)}
                  onBlur={() => { touch("birthdate"); setErrors((e) => ({ ...e, birthdate: validateBirthdate(data.birthdate) })); }}
                  error={touched.birthdate ? errors.birthdate : undefined} type="date" dir="ltr" />
              </div>
              <FormSelect label="מגדר" value={data.gender}
                onChange={(v) => { set("gender", v); setErrors((e) => ({ ...e, gender: undefined })); }}
                options={[{ label: "זכר", value: "7" }, { label: "נקבה", value: "0" }, { label: "אחר", value: "1" }]}
                error={touched.gender ? errors.gender : undefined} />
              <CityAutocomplete value={data.city}
                onChange={(v) => set("city", v)}
                onBlur={() => { touch("city"); setErrors((e) => ({ ...e, city: validateCity(data.city) })); }}
                error={touched.city ? errors.city : undefined} />
              <FormSelect label="ניסיון קודם בתכנות" value={data.background}
                onChange={(v) => set("background", v)}
                options={["אין ניסיון", "למדתי קצת בעצמי", "קורס / לימודים", "ניסיון מקצועי"]} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step < 2 && (
        <div className="wizard__nav">
          {step === 1 && (
            <motion.button type="button" onClick={back} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="wizard__btn wizard__btn--back">
              חזרה
            </motion.button>
          )}
          <motion.button
            type="button"
            onClick={step === 1 ? submit : next}
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="wizard__btn wizard__btn--primary"
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "שולח..." : step === 1 ? "שליחה" : "המשך"}
          </motion.button>
        </div>
      )}
    </div>
  );
}

/* ─── Form Input ─── */
function FormInput({ label, placeholder, value, onChange, onBlur, error, type = "text", dir }: {
  label: string; placeholder?: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void;
  error?: string; type?: string; dir?: string;
}) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <input
        type={type}
        dir={dir}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`field__input${error ? " field__input--error" : ""}`}
      />
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="field__error">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Form Select ─── */
type SelectOption = string | { label: string; value: string };

function FormSelect({ label, value, onChange, options, error }: {
  label: string; value: string; onChange: (v: string) => void; options: SelectOption[]; error?: string;
}) {
  const normalized = options.map((o) => typeof o === "string" ? { label: o, value: o } : o);
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`field__select${error ? " field__select--error" : ""}`}
        style={{ color: value ? "#0B0B5D" : "#9ca3af" }}
      >
        <option value="" disabled>בחרו...</option>
        {normalized.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="field__error">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── City Autocomplete ─── */
function CityAutocomplete({ value, onChange, onBlur, error }: {
  value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filter = useCallback((query: string) => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.trim().toLowerCase();
    const matches = NEGEV_CITIES.filter((c) => c.includes(q)).slice(0, 6);
    setSuggestions(matches);
    setOpen(matches.length > 0);
  }, []);

  useEffect(() => { filter(value); }, [value, filter]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="field field--relative">
      <label className="field__label">עיר מגורים</label>
      <input
        type="text"
        placeholder="התחילו להקליד..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onBlur={() => { setTimeout(() => { setOpen(false); onBlur?.(); }, 150); }}
        className={`field__input${error ? " field__input--error" : ""}`}
      />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="field__suggestions"
          >
            {suggestions.map((city) => (
              <li key={city} className="field__suggestion" onMouseDown={() => { onChange(city); setOpen(false); }}>
                {city}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="field__error">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Helpers ─── */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}${digits.slice(6)}`;
}

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

/* ─── Types ─── */
interface FormData {
  name: string;
  phone: string;
  email: string;
  city: string;
  age: string;
  background: string;
  motivation: string;
}

interface FieldError {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
}

/* ─── Constants ─── */
const STEPS = [
  { id: "personal", label: "פרטים אישיים" },
  { id: "background", label: "רקע" },
  { id: "done", label: "סיום" },
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

/* ─── Main Component ─── */
export function ApplyWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<FormData>({
    name: "", phone: "", email: "",
    city: "", age: "", background: "", motivation: "",
  });

  const set = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
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
    setErrors(e);
    setTouched({ name: true, phone: true, email: true });
    return !e.name && !e.phone && !e.email;
  };

  const validateStep2 = (): boolean => {
    const e: FieldError = { city: validateCity(data.city) };
    setErrors((prev) => ({ ...prev, ...e }));
    setTouched((prev) => ({ ...prev, city: true }));
    return !e.city;
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
    try {
      const db = getFirestore(app);
      await addDoc(collection(db, "applications"), {
        ...data,
        phone: data.phone.replace(/[\s\-()]/g, ""),
        createdAt: new Date().toISOString(),
        status: "new",
      });
    } catch (err) {
      console.error("Submit error:", err);
      const pending = JSON.parse(localStorage.getItem("pending_applications") || "[]");
      pending.push({ ...data, createdAt: new Date().toISOString() });
      localStorage.setItem("pending_applications", JSON.stringify(pending));
    }
    setDir(1);
    setStep(2);
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: i <= step ? "#214CC9" : "#f3f4f6" }}
                initial={{ width: "0%" }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-xs" style={{ color: i <= step ? "#0B0B5D" : "#9ca3af" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="relative overflow-hidden min-h-[360px]">
        <AnimatePresence mode="wait" custom={dir}>
          {step === 0 && (
            <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
              <h3 className="text-xl font-bold mb-6" style={{ color: "#0B0B5D" }}>ספרו לנו קצת על עצמכם</h3>
              <FormInput
                label="שם מלא"
                placeholder="ישראל ישראלי"
                value={data.name}
                onChange={(v) => set("name", v)}
                onBlur={() => { touch("name"); setErrors((e) => ({ ...e, name: validateName(data.name) })); }}
                error={touched.name ? errors.name : undefined}
              />
              <FormInput
                label="טלפון"
                placeholder="050-1234567"
                value={data.phone}
                onChange={(v) => set("phone", formatPhone(v))}
                onBlur={() => { touch("phone"); setErrors((e) => ({ ...e, phone: validatePhone(data.phone) })); }}
                error={touched.phone ? errors.phone : undefined}
                type="tel"
                dir="ltr"
              />
              <FormInput
                label="אימייל"
                placeholder="you@example.com"
                value={data.email}
                onChange={(v) => set("email", v)}
                onBlur={() => { touch("email"); setErrors((e) => ({ ...e, email: validateEmail(data.email) })); }}
                error={touched.email ? errors.email : undefined}
                type="email"
                dir="ltr"
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
              <h3 className="text-xl font-bold mb-6" style={{ color: "#0B0B5D" }}>עוד קצת פרטים</h3>
              <CityAutocomplete
                value={data.city}
                onChange={(v) => set("city", v)}
                onBlur={() => { touch("city"); setErrors((e) => ({ ...e, city: validateCity(data.city) })); }}
                error={touched.city ? errors.city : undefined}
              />
              <FormSelect
                label="טווח גילאים"
                value={data.age}
                onChange={(v) => set("age", v)}
                options={["18-24", "25-30", "31-35", "36-40", "40+"]}
              />
              <FormSelect
                label="ניסיון קודם בתכנות"
                value={data.background}
                onChange={(v) => set("background", v)}
                options={["אין ניסיון", "למדתי קצת בעצמי", "קורס / לימודים", "ניסיון מקצועי"]}
              />
              <FormInput
                label="למה אתם רוצים להצטרף?"
                placeholder="אופציונלי"
                value={data.motivation}
                onChange={(v) => set("motivation", v)}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="flex flex-col items-center justify-center text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "#e8f5e9" }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#2e7d32" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "#0B0B5D" }}>תודה!</h3>
              <p style={{ color: "#6b7280" }}>קיבלנו את הפרטים שלכם. נחזור אליכם בקרוב.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step < 2 && (
        <div className="flex items-center gap-3 mt-8">
          {step === 1 && (
            <motion.button type="button" onClick={back} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ padding: "16px 28px", borderRadius: "14px", fontSize: "15px", fontWeight: 500, border: "1.5px solid #e5e7eb", background: "#fff", color: "#0B0B5D", cursor: "pointer" }}>
              חזרה
            </motion.button>
          )}
          <motion.button
            type="button"
            onClick={step === 1 ? submit : next}
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1, padding: "16px 28px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, border: "none",
              background: "linear-gradient(135deg, #0B0B5D 0%, #214CC9 100%)", color: "#fff", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(11,11,93,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              opacity: submitting ? 0.7 : 1,
            }}>
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
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>{label}</label>
      <input
        type={type}
        dir={dir}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full outline-none transition-all"
        style={{
          padding: "14px 16px", borderRadius: "10px", fontSize: "15px",
          border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
          background: error ? "#fef2f2" : "#fafafa",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#214CC9"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? "rgba(239,68,68,0.08)" : "rgba(33,76,201,0.06)"}`; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#e5e7eb"; e.currentTarget.style.background = error ? "#fef2f2" : "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
      />
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs mt-1.5" style={{ color: "#ef4444" }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Form Select ─── */
function FormSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full outline-none transition-all appearance-none cursor-pointer"
        style={{
          padding: "14px 16px", borderRadius: "10px", fontSize: "15px",
          border: "1.5px solid #e5e7eb", background: "#fafafa",
          color: value ? "#0B0B5D" : "#9ca3af",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#214CC9"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(33,76,201,0.06)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <option value="" disabled>בחרו...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ─── City Autocomplete ─── */
function CityAutocomplete({ value, onChange, onBlur, error }: {
  value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filter = useCallback((query: string) => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.trim().toLowerCase();
    const matches = NEGEV_CITIES.filter((c) => c.includes(q)).slice(0, 6);
    setSuggestions(matches);
    setOpen(matches.length > 0);
  }, []);

  useEffect(() => {
    filter(value);
  }, [value, filter]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>עיר מגורים</label>
      <input
        ref={inputRef}
        type="text"
        placeholder="התחילו להקליד..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onBlur={() => { setTimeout(() => { setOpen(false); onBlur?.(); }, 150); }}
        className="w-full outline-none transition-all"
        style={{
          padding: "14px 16px", borderRadius: "10px", fontSize: "15px",
          border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
          background: error ? "#fef2f2" : "#fafafa",
        }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#214CC9"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? "rgba(239,68,68,0.08)" : "rgba(33,76,201,0.06)"}`; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#e5e7eb"; e.currentTarget.style.background = error ? "#fef2f2" : "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
      />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 w-full z-50 overflow-hidden"
            style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
          >
            {suggestions.map((city) => (
              <li
                key={city}
                className="cursor-pointer transition-colors"
                style={{ padding: "12px 16px", fontSize: "14px" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                onMouseDown={() => { onChange(city); setOpen(false); }}
              >
                <span style={{ color: "#0B0B5D" }}>{city}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs mt-1.5" style={{ color: "#ef4444" }}>
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

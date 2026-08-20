import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

interface FormData {
  name: string;
  phone: string;
  email: string;
  city: string;
  age: string;
  background: string;
  motivation: string;
}

const STEPS = [
  { id: "personal", label: "פרטים אישיים" },
  { id: "background", label: "רקע" },
  { id: "done", label: "סיום" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export function ApplyWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [, setSubmitted] = useState(false);
  const [data, setData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    city: "",
    age: "",
    background: "",
    motivation: "",
  });

  const set = (field: keyof FormData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const next = () => { setDir(1); setStep((s) => s + 1); };
  const back = () => { setDir(-1); setStep((s) => s - 1); };

  const canNext = () => {
    if (step === 0) return data.name.trim() && data.phone.trim() && data.email.trim();
    if (step === 1) return data.city.trim();
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const db = getFirestore(app);
      await addDoc(collection(db, "applications"), {
        ...data,
        createdAt: new Date().toISOString(),
        status: "new",
      });
      setSubmitted(true);
      next();
    } catch (err) {
      console.error("Submit error:", err);
      // Fallback: store in localStorage
      const pending = JSON.parse(localStorage.getItem("pending_applications") || "[]");
      pending.push({ ...data, createdAt: new Date().toISOString() });
      localStorage.setItem("pending_applications", JSON.stringify(pending));
      setSubmitted(true);
      next();
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: i <= step ? "#214CC9" : "#f3f4f6" }}
                initial={{ width: "0%" }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs" style={{ color: i <= step ? "#0B0B5D" : "#9ca3af" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="relative overflow-hidden min-h-[320px]">
        <AnimatePresence mode="wait" custom={dir}>
          {step === 0 && (
            <motion.div
              key="personal"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-5"
            >
              <h3 className="text-xl font-bold mb-6" style={{ color: "#0B0B5D" }}>
                ספרו לנו קצת על עצמכם
              </h3>
              <Input placeholder="שם מלא" value={data.name} onChange={(v) => set("name", v)} />
              <Input placeholder="טלפון" value={data.phone} onChange={(v) => set("phone", v)} type="tel" />
              <Input placeholder="אימייל" value={data.email} onChange={(v) => set("email", v)} type="email" />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="background"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-5"
            >
              <h3 className="text-xl font-bold mb-6" style={{ color: "#0B0B5D" }}>
                עוד קצת פרטים
              </h3>
              <Input placeholder="עיר מגורים" value={data.city} onChange={(v) => set("city", v)} />
              <Select
                placeholder="טווח גילאים"
                value={data.age}
                onChange={(v) => set("age", v)}
                options={["18-24", "25-30", "31-35", "36-40", "40+"]}
              />
              <Select
                placeholder="ניסיון קודם בתכנות"
                value={data.background}
                onChange={(v) => set("background", v)}
                options={["אין ניסיון", "למדתי קצת בעצמי", "קורס / לימודים", "ניסיון מקצועי"]}
              />
              <Input placeholder="למה אתם רוצים להצטרף? (אופציונלי)" value={data.motivation} onChange={(v) => set("motivation", v)} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="done"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col items-center justify-center text-center py-10"
            >
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

      {/* Navigation buttons */}
      {step < 2 && (
        <div className="flex items-center gap-3 mt-8">
          {step === 1 && (
            <motion.button
              type="button"
              onClick={back}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                padding: "16px 28px",
                borderRadius: "14px",
                fontSize: "15px",
                fontWeight: 500,
                border: "1.5px solid #e5e7eb",
                background: "#fff",
                color: "#0B0B5D",
                cursor: "pointer",
              }}
            >
              חזרה
            </motion.button>
          )}
          <motion.button
            type="button"
            onClick={step === 1 ? submit : next}
            disabled={!canNext() || submitting}
            whileHover={canNext() ? { scale: 1.02 } : {}}
            whileTap={canNext() ? { scale: 0.98 } : {}}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              flex: 1,
              padding: "16px 28px",
              borderRadius: "14px",
              fontSize: "16px",
              fontWeight: 600,
              border: "none",
              background: canNext() ? "linear-gradient(135deg, #0B0B5D 0%, #214CC9 100%)" : "#e5e7eb",
              color: canNext() ? "#fff" : "#9ca3af",
              cursor: canNext() ? "pointer" : "not-allowed",
              boxShadow: canNext() ? "0 4px 20px rgba(11, 11, 93, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "שולח..." : step === 1 ? "שליחה" : "המשך"}
          </motion.button>
        </div>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function Input({ placeholder, value, onChange, type = "text" }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full outline-none transition-all"
      style={{
        padding: "16px 20px",
        borderRadius: "12px",
        border: "1.5px solid #e5e7eb",
        fontSize: "15px",
        background: "#fafafa",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#214CC9";
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.boxShadow = "0 0 0 4px rgba(33,76,201,0.06)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.background = "#fafafa";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function Select({ placeholder, value, onChange, options }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full outline-none transition-all appearance-none cursor-pointer"
      style={{
        padding: "16px 20px",
        borderRadius: "12px",
        border: "1.5px solid #e5e7eb",
        fontSize: "15px",
        background: "#fafafa",
        color: value ? "#0B0B5D" : "#9ca3af",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#214CC9";
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.boxShadow = "0 0 0 4px rgba(33,76,201,0.06)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.background = "#fafafa";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

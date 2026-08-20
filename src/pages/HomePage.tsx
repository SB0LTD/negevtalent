import { motion } from "framer-motion";
import { ApplyWizard } from "@/components/ApplyWizard";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "100px" },
  transition: { duration: 0.6 },
};

function CodeBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "50px" }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative mx-auto mt-16 max-w-lg overflow-hidden"
      style={{ borderRadius: "20px", background: "#0B0B5D", padding: "28px", boxShadow: "0 24px 48px rgba(11,11,93,0.2), 0 8px 16px rgba(11,11,93,0.1)" }}
    >
      <div className="flex gap-2 mb-5">
        <span className="w-3 h-3 rounded-full" style={{ background: "#F56345" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#F79534" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#80A0E9" }} />
      </div>
      <pre className="text-sm leading-relaxed overflow-x-auto" dir="ltr" style={{ color: "#80A0E9", fontFamily: "monospace" }}>
        <code>{`// main.sig — you control every byte
const buf: [4096]u8 = undefined;

const result = try sig.fmt.formatInto(
    &buf, "Hello, {s}!", .{name}
);

// No hidden allocations.
// No silent reallocation.
// Memory is not a guess.`}</code>
      </pre>
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl" style={{ background: "rgba(33,76,201,0.3)" }} />
      <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full blur-3xl" style={{ background: "rgba(245,99,69,0.15)" }} />
    </motion.div>
  );
}

export function HomePage() {
  return (
    <>
      {/* ═══ Hero ═══ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, #0B0B5D 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium tracking-widest uppercase mb-6" style={{ color: "#214CC9" }}>
            Bootcamp · 3 Months · Negev
          </p>
          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight" style={{ color: "#0B0B5D" }}>
            למד לפתח
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue to-red">ב-Sig</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-xl mx-auto" style={{ color: "#4b5563" }}>
            Sig הוא הקומפיילר שיודע כמה זיכרון יש לו.
            <br />
            הכשרה אינטנסיבית של 3 חודשים — מאפס ועד תעסוקה.
          </p>

          {/* Buttons */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
            <motion.a href="#apply" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{ background: "linear-gradient(135deg, #0B0B5D 0%, #214CC9 100%)", color: "#fff", padding: "18px 40px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, boxShadow: "0 4px 20px rgba(11,11,93,0.25), inset 0 1px 0 rgba(255,255,255,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", minWidth: "200px" }}>
              הרשמה לתוכנית
            </motion.a>
            <motion.a href="#what" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{ background: "#fff", color: "#0B0B5D", padding: "18px 40px", borderRadius: "14px", fontSize: "16px", fontWeight: 500, border: "1.5px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", minWidth: "200px" }}>
              מה זה Sig?
            </motion.a>
          </div>
        </motion.div>

        {/* Logo carousel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
          className="relative mt-20 w-full max-w-md mx-auto overflow-hidden"
          style={{ maskImage: "linear-gradient(to left, transparent, black 20%, black 80%, transparent)", WebkitMaskImage: "linear-gradient(to left, transparent, black 20%, black 80%, transparent)" }}>
          <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="flex items-center gap-16 w-max">
            {[...Array(2)].map((_, set) => (
              <div key={set} className="flex items-center gap-16 shrink-0">
                <img src="/partners/elevation.png" alt="Elevation" className="h-7 w-auto object-contain opacity-50" />
                <img src="/partners/sb0.png" alt="SB0 LTD" className="h-7 w-auto object-contain opacity-50" />
                <img src="/logo.png" alt="Negev Talent" className="h-6 w-auto object-contain opacity-50" />
                <img src="/partners/eshkol.png" alt="אשכול הנגב" className="h-7 w-auto object-contain opacity-50" />
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ What is Sig ═══ */}
      <section id="what" className="py-32 px-6" style={{ background: "#f9fafb" }}>
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade} className="text-center mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ background: "#EEF2FF", color: "#214CC9" }}>הטכנולוגיה</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#0B0B5D" }}>מה זה Sig?</h2>
          </motion.div>

          <motion.div {...fade} className="text-center mt-8">
            <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#4b5563" }}>
              <strong style={{ color: "#0B0B5D" }}>Sig</strong> הוא קומפיילר — drop-in replacement ל-Zig. אותה שפה, אותו parser, אותם כלים. ההבדל? כשמשנים סיומת קובץ ל-<code style={{ background: "rgba(11,11,93,0.06)", padding: "2px 8px", borderRadius: "4px", color: "#0B0B5D", fontSize: "0.9em" }}>.sig</code> הקומפיילר דורש שליטה מלאה בזיכרון.
            </p>
            <p className="mt-5 text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#4b5563" }}>
              פותח על ידי <strong style={{ color: "#0B0B5D" }}>SB0 LTD</strong> ומסונכרן עם Zig upstream בכל commit. לומדים systems programming מודרני — עם שליטה מוחלטת על המשאבים.
            </p>
          </motion.div>

          <CodeBlock />
        </div>
      </section>

      {/* ═══ Program — Timeline Cards ═══ */}
      <section id="program" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fade} className="text-center mb-20">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ background: "#FEF2F2", color: "#F56345" }}>המסלול</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#0B0B5D" }}>מה תלמדו ב-3 חודשים</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "01", title: "יסודות", color: "#214CC9", items: ["שפת Zig/Sig מאפס", "ניהול זיכרון ידני", "מבני נתונים ואלגוריתמים", "סביבת פיתוח וכלים"] },
              { n: "02", title: "פרקטיקה", color: "#F56345", items: ["פרויקטים מהתעשייה", "עבודת צוות ו-Code Review", "קומפילציה, לינקינג, דיבאגינג", "Strict mode — קבצי .sig"] },
              { n: "03", title: "השמה", color: "#F79534", items: ["אינטגרציה בסביבת עבודה", "הכנה לראיונות טכניים", "ליווי קריירה אישי", "אפשרות העסקה ב-SB0"] },
            ].map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "80px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative overflow-hidden"
                style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "16px", padding: "32px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: phase.color }} />
                <span className="text-4xl font-black" style={{ color: phase.color, opacity: 0.2 }}>{phase.n}</span>
                <h3 className="text-xl font-bold mt-1 mb-5" style={{ color: "#0B0B5D" }}>{phase.title}</h3>
                <ul className="space-y-3">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3" style={{ color: "#4b5563" }}>
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full shrink-0" style={{ background: phase.color, opacity: 0.7 }} />
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Who ═══ */}
      <section id="audience" className="py-32 px-6" style={{ background: "#f9fafb" }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade} className="mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ background: "#FFF7ED", color: "#F79534" }}>קהל יעד</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#0B0B5D" }}>למי מתאים</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "רוצים להיכנס לפיתוח low-level",
              "תושבי הנגב — הכשרה מקומית",
              "אין צורך בניסיון קודם",
              "מוכנים ל-3 חודשים אינטנסיביים",
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "80px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="text-right cursor-default"
                style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#EEF2FF" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#214CC9" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <p className="font-medium" style={{ color: "#0B0B5D" }}>{item}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Partners — Carousel style ═══ */}
      <section id="partners" className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fade} className="mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ background: "#EEF2FF", color: "#214CC9" }}>שותפים</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#0B0B5D" }}>בשיתוף</h2>
            <p className="mt-4" style={{ color: "#6b7280" }}>התוכנית מופעלת בשיתוף גופים מובילים</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Elevation", role: "מפעילי ההכשרה", logo: "/partners/elevation.png" },
              { name: "SB0 LTD", role: "פיתוח ותעסוקה", logo: "/partners/sb0.png" },
              { name: "Negev Talent", role: "יוזמת התוכנית", logo: "/logo.png" },
              { name: "אשכול הנגב", role: "שותף אזורי", logo: "/partners/eshkol.png" },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "80px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="flex flex-col items-center gap-4"
                style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "16px", padding: "28px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
              >
                <div className="h-12 flex items-center justify-center">
                  <img src={p.logo} alt={p.name} className="h-9 max-w-[100px] w-auto object-contain" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm" style={{ color: "#0B0B5D" }}>{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{p.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Apply ═══ */}
      <section id="apply" className="py-32 px-6" style={{ background: "#f9fafb" }}>
        <div className="max-w-lg mx-auto text-center">
          <motion.div {...fade} className="mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ background: "#E8F5E9", color: "#2e7d32" }}>פתוח להרשמה</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#0B0B5D" }}>הרשמה</h2>
            <p className="mt-3" style={{ color: "#6b7280" }}>המחזור הקרוב מתחיל בקרוב — הצטרפו תוך דקה</p>
          </motion.div>
          <ApplyWizard />
        </div>
      </section>
    </>
  );
}

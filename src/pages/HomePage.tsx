import { motion } from "framer-motion";

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
      className="relative mx-auto mt-16 max-w-lg rounded-2xl bg-navy p-6 shadow-2xl shadow-navy/20 overflow-hidden"
    >
      {/* Dot decorations */}
      <div className="flex gap-2 mb-4">
        <span className="w-3 h-3 rounded-full bg-red/80" />
        <span className="w-3 h-3 rounded-full bg-orange/80" />
        <span className="w-3 h-3 rounded-full bg-lightblue/60" />
      </div>
      <pre className="text-sm text-lightblue/90 font-mono leading-relaxed overflow-x-auto" dir="ltr">
        <code>{`// main.sig — you control every byte
const buf: [4096]u8 = undefined;

const result = try sig.fmt.formatInto(
    &buf, "Hello, {s}!", .{name}
);

// No hidden allocations.
// No silent reallocation.
// Memory is not a guess.`}</code>
      </pre>
      {/* Subtle glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue/20 rounded-full blur-3xl" />
    </motion.div>
  );
}

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 relative overflow-hidden">
        {/* Subtle background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #0B0B5D 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <p className="text-sm font-medium text-blue tracking-widest uppercase mb-6">
            Bootcamp · 3 Months · Negev
          </p>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
            למד לפתח
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue to-red">
              ב-Sig
            </span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-text-secondary leading-relaxed max-w-xl mx-auto">
            Sig הוא הקומפיילר שיודע כמה זיכרון יש לו.
            <br />
            הכשרה אינטנסיבית של 3 חודשים — מאפס ועד תעסוקה.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#apply"
              className="w-full sm:w-auto inline-flex justify-center bg-navy text-white font-semibold text-base px-10 py-4 rounded-xl hover:bg-blue transition-colors"
            >
              הרשמה לתוכנית
            </a>
            <a
              href="#what"
              className="w-full sm:w-auto inline-flex justify-center text-navy font-medium text-base px-10 py-4 rounded-xl border border-border hover:border-navy/30 transition-colors"
            >
              מה זה Sig?
            </a>
          </div>
        </motion.div>

        {/* Partner logos — prominent */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative mt-20 flex items-center justify-center gap-8"
        >
          <img src="/partners/elevation.png" alt="Elevation" className="h-8 w-auto object-contain" />
          <div className="h-6 w-px bg-border" />
          <img src="/partners/sb0.png" alt="SB0 LTD" className="h-8 w-auto object-contain" />
        </motion.div>
      </section>

      {/* What is Sig */}
      <section id="what" className="py-32 px-6 bg-surface-soft">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">מה זה Sig?</h2>
          </motion.div>

          <motion.div {...fade} className="text-center">
            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              <strong className="text-navy">Sig</strong> הוא קומפיילר — drop-in replacement ל-Zig. אותה שפה, אותו parser, אותם כלים. ההבדל? כשמשנים סיומת קובץ ל-<code className="bg-navy/5 px-2 py-0.5 rounded text-navy text-sm">.sig</code> הקומפיילר דורש שליטה מלאה בזיכרון. אין הקצאות נסתרות. אין reallocation שקט.
            </p>
            <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Sig פותח על ידי <strong className="text-navy">SB0 LTD</strong> ומסונכרן עם Zig upstream בכל commit. תוכניתנים שלומדים Sig לומדים בעצם systems programming מודרני — עם שליטה מוחלטת על המשאבים.
            </p>
          </motion.div>

          <CodeBlock />
        </div>
      </section>

      {/* Program structure */}
      <section id="program" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold text-center mb-20">
            מה תלמדו ב-3 חודשים
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              {
                n: "01",
                title: "יסודות",
                items: ["שפת Zig/Sig מאפס", "ניהול זיכרון ידני", "מבני נתונים ואלגוריתמים", "סביבת פיתוח וכלים"],
              },
              {
                n: "02",
                title: "פרקטיקה",
                items: ["פרויקטים מהתעשייה", "עבודת צוות ו-Code Review", "קומפילציה, לינקינג, דיבאגינג", "Strict mode — קבצי .sig"],
              },
              {
                n: "03",
                title: "השמה",
                items: ["אינטגרציה בסביבת עבודה", "הכנה לראיונות טכניים", "ליווי קריירה אישי", "אפשרות העסקה ב-SB0"],
              },
            ].map((phase, i) => (
              <motion.div key={i} {...fade} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <span className="text-5xl font-black text-lightblue/30">{phase.n}</span>
                <h3 className="text-xl font-bold mt-2 mb-4">{phase.title}</h3>
                <ul className="space-y-3">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-text-secondary">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-red shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who */}
      <section id="audience" className="py-32 px-6 bg-surface-soft">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold mb-16">
            למי מתאים
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-right">
            {[
              { text: "רוצים להיכנס לפיתוח low-level", icon: "→" },
              { text: "תושבי הנגב — הכשרה מקומית", icon: "→" },
              { text: "אין צורך בניסיון קודם", icon: "→" },
              { text: "מוכנים ל-3 חודשים אינטנסיביים", icon: "→" },
            ].map((item, i) => (
              <motion.div key={i} {...fade} transition={{ duration: 0.4, delay: i * 0.06 }} className="flex items-center gap-3 bg-white rounded-xl p-5 border border-border">
                <span className="text-blue font-bold">{item.icon}</span>
                <p className="text-navy font-medium">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold mb-6">
            בשיתוף
          </motion.h2>
          <motion.p {...fade} className="text-text-secondary mb-16">
            התוכנית מופעלת בשיתוף גופים מובילים
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { name: "Elevation", role: "מפעילי ההכשרה", logo: "/partners/elevation.png" },
              { name: "SB0 LTD", role: "פיתוח ותעסוקה", logo: "/partners/sb0.png" },
              { name: "Negev Talent", role: "יוזמת התוכנית", logo: "/logo.png" },
              { name: "אשכול הנגב", role: "שותף אזורי", logo: "/partners/eshkol.png" },
            ].map((p, i) => (
              <motion.div key={i} {...fade} transition={{ duration: 0.4, delay: i * 0.06 }} className="flex flex-col items-center gap-4">
                <div className="h-14 flex items-center">
                  <img src={p.logo} alt={p.name} className="h-10 max-w-[110px] w-auto object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-navy text-sm">{p.name}</p>
                  <p className="text-text-muted text-xs">{p.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="py-32 px-6 bg-surface-soft">
        <div className="max-w-md mx-auto text-center">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold mb-3">
            הרשמה
          </motion.h2>
          <motion.p {...fade} className="text-text-secondary mb-12">
            המחזור הקרוב מתחיל בקרוב. השאירו פרטים.
          </motion.p>

          <form className="space-y-4 text-right">
            <input
              type="text"
              placeholder="שם מלא"
              className="w-full border border-border rounded-xl px-5 py-4 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/10 transition-all"
            />
            <input
              type="tel"
              placeholder="טלפון"
              className="w-full border border-border rounded-xl px-5 py-4 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/10 transition-all"
            />
            <input
              type="email"
              placeholder="אימייל"
              className="w-full border border-border rounded-xl px-5 py-4 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/10 transition-all"
            />
            <button
              type="submit"
              className="w-full mt-4 bg-navy text-white font-semibold text-lg py-4 rounded-xl hover:bg-blue transition-colors"
            >
              שליחת פרטים
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

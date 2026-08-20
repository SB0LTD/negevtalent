import { motion } from "framer-motion";

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "100px" },
  transition: { duration: 0.5 },
};

export function HomePage() {
  return (
    <>
      {/* Hero — generous whitespace, one clear message */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
            הכשרת מפתחים
            <br />
            <span className="text-red">בשפת SIG</span>
          </h1>

          <p className="mt-8 text-xl text-text-secondary leading-relaxed">
            Bootcamp אינטנסיבי של 3 חודשים.
            <br className="hidden sm:block" />
            מאפס — לתעסוקה בהייטק בנגב.
          </p>

          <motion.a
            href="#apply"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="inline-block mt-12 bg-blue text-white font-semibold text-lg px-10 py-4 rounded-lg hover:bg-navy transition-colors"
          >
            הרשמה לתוכנית
          </motion.a>
        </motion.div>

        {/* Logos — prominent */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-24 flex items-center justify-center gap-10 flex-wrap"
        >
          <img src="/partners/elevation.png" alt="Elevation" className="h-7 w-auto object-contain" />
          <span className="text-border text-xl">|</span>
          <img src="/partners/sb0.png" alt="SB0 LTD" className="h-7 w-auto object-contain" />
        </motion.div>
      </section>

      {/* What — one sentence per card */}
      <section id="program" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold text-center mb-20">
            מה תלמדו
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "שפת SIG", desc: "לימוד מעמיק של השפה מיסודות ועד שליטה מלאה" },
              { title: "פרויקטים", desc: "עבודה בצוותים על פרויקטים מהתעשייה" },
              { title: "תעסוקה", desc: "ליווי קריירה ואפשרות העסקה ב-SB0 LTD" },
            ].map((item, i) => (
              <motion.div key={i} {...fade} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="h-1 w-8 bg-red rounded-full mb-6" />
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline — super clean */}
      <section className="py-32 px-6 bg-surface-soft">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold mb-6">
            3 חודשים
          </motion.h2>
          <motion.p {...fade} className="text-text-secondary text-lg mb-16">
            מסלול מובנה מאפס לכניסה לתעשייה
          </motion.p>

          <div className="flex flex-col md:flex-row items-stretch gap-6">
            {[
              { n: "01", title: "יסודות", desc: "שפת SIG, סביבת פיתוח, מבנים בסיסיים" },
              { n: "02", title: "פרקטיקה", desc: "פרויקטים, עבודת צוות, code review" },
              { n: "03", title: "השמה", desc: "אינטגרציה, הכנה לתעסוקה, ליווי קריירה" },
            ].map((step, i) => (
              <motion.div
                key={i}
                {...fade}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex-1 bg-white rounded-xl p-8 border border-border text-right"
              >
                <span className="text-4xl font-extrabold text-lightblue/40">{step.n}</span>
                <h3 className="text-lg font-bold mt-3">{step.title}</h3>
                <p className="text-text-secondary text-sm mt-2 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who */}
      <section id="audience" className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold mb-16">
            למי מתאים
          </motion.h2>

          <div className="space-y-6 text-right">
            {[
              "אנשים שרוצים להיכנס לעולם הפיתוח",
              "תושבי הנגב שמחפשים מקצוע בהייטק",
              "אין צורך בניסיון קודם",
              "מוכנות ללמוד אינטנסיבית 3 חודשים",
            ].map((item, i) => (
              <motion.div key={i} {...fade} transition={{ duration: 0.4, delay: i * 0.08 }} className="flex items-center gap-4">
                <span className="h-2 w-2 rounded-full bg-orange shrink-0" />
                <p className="text-lg">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners — prominent logos with roles */}
      <section id="partners" className="py-32 px-6 bg-surface-soft">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold mb-16">
            השותפים
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Elevation", role: "מפעילי ההכשרה", logo: "/partners/elevation.png" },
              { name: "SB0 LTD", role: "פיתוח ותעסוקה", logo: "/partners/sb0.png" },
              { name: "Negev Talent", role: "יוזמי התוכנית", logo: "/logo.png" },
              { name: "אשכול הנגב", role: "שותף אזורי", logo: "/partners/eshkol.png" },
            ].map((p, i) => (
              <motion.div key={i} {...fade} transition={{ duration: 0.4, delay: i * 0.08 }} className="flex flex-col items-center gap-3">
                <div className="h-16 flex items-center justify-center">
                  <img src={p.logo} alt={p.name} className="h-10 max-w-[120px] w-auto object-contain" />
                </div>
                <p className="text-xs text-text-muted">{p.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="py-32 px-6">
        <div className="max-w-md mx-auto text-center">
          <motion.h2 {...fade} className="text-3xl md:text-4xl font-bold mb-4">
            הרשמה
          </motion.h2>
          <motion.p {...fade} className="text-text-secondary mb-12">
            השאירו פרטים ונחזור אליכם
          </motion.p>

          <form className="space-y-4 text-right">
            <input
              type="text"
              placeholder="שם מלא"
              className="w-full border border-border rounded-lg px-5 py-4 text-base focus:border-blue focus:outline-none transition-colors"
            />
            <input
              type="tel"
              placeholder="טלפון"
              className="w-full border border-border rounded-lg px-5 py-4 text-base focus:border-blue focus:outline-none transition-colors"
            />
            <input
              type="email"
              placeholder="אימייל"
              className="w-full border border-border rounded-lg px-5 py-4 text-base focus:border-blue focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="w-full mt-4 bg-blue text-white font-semibold text-lg px-8 py-4 rounded-lg hover:bg-navy transition-colors"
            >
              שליחת פרטים
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

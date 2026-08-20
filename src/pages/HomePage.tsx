import { motion } from "framer-motion";
import { Section } from "@/components/Section";

const timeline = [
  { month: "1", title: "יסודות", desc: "היכרות עם שפת SIG, סביבת פיתוח, מבני נתונים בסיסיים" },
  { month: "2", title: "פרקטיקה", desc: "עבודה על פרויקטים אמיתיים, עבודת צוות, code review" },
  { month: "3", title: "התמחות", desc: "אינטגרציה בסביבת עבודה, הכנה לתעסוקה, ליווי קריירה" },
];

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-20 bg-surface-warm">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-brand font-semibold text-sm tracking-wide mb-4">
              BOOTCAMP · 3 חודשים · הכשרה מקצועית
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold text-navy leading-tight">
              הכשרת מפתחים
              <br />
              <span className="text-brand">בשפת SIG</span>
            </h1>
            <p className="mt-6 text-lg text-text-secondary max-w-xl mx-auto">
              תוכנית הכשרה אינטנסיבית של 3 חודשים, ללמוד לפתח בשפת SIG ולהשתלב בתעשיית ההייטק בנגב
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#apply"
                className="w-full sm:w-auto inline-flex justify-center rounded-lg bg-brand px-8 py-4 text-base font-bold text-white hover:bg-brand-dark transition-colors shadow-sm"
              >
                הרשמה לתוכנית
              </a>
              <a
                href="#program"
                className="w-full sm:w-auto inline-flex justify-center rounded-lg border-2 border-navy/10 px-8 py-4 text-base font-medium text-navy hover:border-navy/30 transition-colors"
              >
                על המסלול
              </a>
            </div>
          </motion.div>

          {/* Partner strip */}
          <div className="mt-20 flex items-center justify-center gap-8 opacity-50">
            <img src="/partners/elevation.png" alt="Elevation" className="h-5 max-w-[100px] w-auto object-contain" />
            <img src="/partners/sb0.png" alt="SB0" className="h-5 w-auto object-contain" />
            <img src="/partners/eshkol.png" alt="אשכול" className="h-5 w-auto object-contain" />
          </div>
        </div>
      </section>

      {/* About the program */}
      <Section id="program">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">על התוכנית</h2>
          <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
            Bootcamp מקצועי בן 3 חודשים שמכשיר מפתחים בשפת SIG — מאפס ועד רמת תעסוקה. ההכשרה כוללת לימוד מעשי, פרויקטים, ועבודת צוות בסביבה המדמה חברת הייטק.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "שפת SIG", desc: "לימוד מעמיק של השפה, הכלים, וסביבת הפיתוח — מיסודות ועד שליטה מלאה" },
            { title: "פרויקטים אמיתיים", desc: "עבודה על פרויקטים מהתעשייה עם ליווי של מפתחים בכירים מ-SB0" },
            { title: "השמה בתעסוקה", desc: "בוגרי התוכנית מקבלים ליווי קריירה ואפשרות העסקה ב-SB0 LTD" },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl bg-surface-warm border border-gray-100">
              <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Timeline */}
      <Section id="timeline" className="bg-surface-warm">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">3 חודשים. מקצוע חדש.</h2>
          <p className="mt-4 text-text-secondary">מסלול מובנה שלוקח אותך מאפס לכניסה לתעשייה</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {timeline.map((step, i) => (
            <div key={i} className="relative p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white font-bold text-sm">
                  {step.month}
                </span>
                <h3 className="font-bold text-navy text-lg">{step.title}</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Who is this for */}
      <Section id="audience">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">למי מתאים?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            "אנשים שרוצים להיכנס לעולם הפיתוח",
            "תושבי הנגב שמחפשים מקצוע בהייטק",
            "אין צורך בניסיון קודם בתכנות",
            "מוכנות ללמוד אינטנסיבית 3 חודשים",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-sm font-bold">✓</span>
              <p className="text-text">{item}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Partners */}
      <Section id="partners" className="bg-surface-warm">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">השותפים</h2>
          <p className="mt-4 text-text-secondary">
            התוכנית פועלת בשיתוף פעולה של גופים מובילים בנגב
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {[
            { name: "Elevation", role: "מפעילי ההכשרה", logo: "/partners/elevation.png" },
            { name: "SB0 LTD", role: "פיתוח ותעסוקה", logo: "/partners/sb0.png" },
            { name: "Negev Talent", role: "יוזמי התוכנית", logo: "/logo.png" },
            { name: "אשכול הנגב המערבי", role: "שותף אזורי", logo: "/partners/eshkol.png" },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-4 p-5 rounded-xl bg-white border border-gray-100">
              <img src={p.logo} alt={p.name} className="h-8 max-w-[100px] w-auto object-contain shrink-0" />
              <div>
                <p className="font-semibold text-navy text-sm">{p.name}</p>
                <p className="text-text-light text-xs">{p.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Apply CTA */}
      <Section id="apply">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">מוכנים להתחיל?</h2>
          <p className="mt-4 text-text-secondary">
            השאירו פרטים ונחזור אליכם עם כל המידע על המחזור הקרוב
          </p>

          <form className="mt-10 flex flex-col gap-4 text-right">
            <input
              type="text"
              placeholder="שם מלא"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-text placeholder:text-text-light focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
            <input
              type="email"
              placeholder="אימייל"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-text placeholder:text-text-light focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
            <input
              type="tel"
              placeholder="טלפון"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-text placeholder:text-text-light focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-brand px-8 py-4 font-bold text-white hover:bg-brand-dark transition-colors shadow-sm"
            >
              שליחת פרטים
            </button>
          </form>
        </div>
      </Section>
    </>
  );
}

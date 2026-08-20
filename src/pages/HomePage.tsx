import { motion } from "framer-motion";
import { Section } from "@/components/Section";
import { SectionTitle } from "@/components/SectionTitle";

const tracks = [
  {
    title: "AI-Augmented Data Analyst Foundations",
    description: "היכרות עם תפקיד האנליסט בעידן ה-AI, סוגי נתונים ומקורות דאטה בארגונים, עבודה נכונה עם כלי AI ו-Prompt Engineering לניתוח נתונים.",
    icon: "🤖",
  },
  {
    title: "Data Thinking & Analytical Mindset",
    description: "פיתוח חשיבה אנליטית ועסקית: עבודה עם KPI ומדדים, סטטיסטיקה בסיסית, היפותזות ו-A/B Testing לצורך קבלת החלטות מבוססות נתונים.",
    icon: "📊",
  },
  {
    title: "Data Workflow, Modeling & SQL",
    description: "עבודה עם נתונים מקצה לקצה: איסוף וניקוי דאטה, בדיקות איכות, הבנת מבני נתונים ו-Data Modeling, וניתוח נתונים באמצעות SQL.",
    icon: "🗄️",
  },
  {
    title: "Data Analysis Tools - Spreadsheets & Python",
    description: "שימוש בכלים המרכזיים של אנליסטים: Excel / Google Sheets לניתוח נתונים ו-Python לעבודה עם datasets, חקר נתונים ועיבוד מידע.",
    icon: "🐍",
  },
  {
    title: "Visualization & Power BI",
    description: "בניית Dashboards ודוחות נתונים, עקרונות Visual Storytelling, עבודה עם Power BI וכלי BI מודרניים להצגת תובנות עסקיות.",
    icon: "📈",
  },
  {
    title: "AI-Augmented Analytics Workflows",
    description: "שילוב AI בתהליכי עבודה של אנליסטים: עבודה עם AI Agents ו-Copilots, יצירת תהליכי ניתוח חכמים והיכרות עם סביבות עבודה מודרניות.",
    icon: "⚡",
  },
  {
    title: "Analytics Domains",
    description: "היכרות עם תחומי האנליטיקה המרכזיים בתעשייה: Product Analytics, Marketing Analytics ו-Business Analytics.",
    icon: "🎯",
  },
  {
    title: "Practicum & Final Data Project",
    description: "התנסות מעשית בפרויקט ניתוח נתונים מקצה לקצה – מהגדרת בעיה עסקית ועד הפקת תובנות והצגתן.",
    icon: "🚀",
  },
];

const partners = [
  { name: "Elevation", logo: "/partners/elevation.png" },
  { name: "אשכול", logo: "/partners/eshkol.png" },
  { name: "ג׳וינט", logo: "/partners/joint.png" },
  { name: "נתגב", logo: "/partners/netgev.png" },
  { name: "פייס", logo: "/partners/pais.png" },
  { name: "SB0", logo: "/partners/sb0.png" },
];

export function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section
        id="hero"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-darker px-6 pt-20"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-surface-darker to-surface-darker" />

        {/* Animated orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 flex justify-center"
          >
            <img
              src="/symbol.png"
              alt="Negev Talent"
              className="h-16 w-16 md:h-20 md:w-20"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-extrabold leading-tight text-text-on-dark md:text-6xl"
          >
            הכשרה טכנולוגית
            <br />
            <span className="bg-gradient-to-l from-primary-400 to-accent-400 bg-clip-text text-transparent">
              והשתלבות בתעשייה בנגב
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-lg text-text-muted md:text-xl"
          >
            מסלול מקצועי ומעשי להכשרת אנליסטים בעידן ה-AI — מהיסודות ועד פרויקט גמר
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-full bg-primary-600 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-primary-600/30 hover:bg-primary-700 hover:shadow-primary-600/50 transition-all min-w-[180px]"
            >
              הרשמה לתוכנית
            </a>
            <a
              href="#program"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-10 py-4 text-base font-medium text-white hover:border-white/60 hover:bg-white/10 transition-all min-w-[180px]"
            >
              למידע נוסף
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="h-10 w-6 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="h-2 w-1 rounded-full bg-white/50" />
          </div>
        </motion.div>
      </section>

      {/* Program Overview */}
      <Section id="program">
        <SectionTitle
          title="על התוכנית"
          subtitle="מסלול מקיף ומעשי שמכשיר אנליסטים עם יכולות AI מתקדמות"
        />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              title: "למידה מעשית",
              description: "פרויקטים אמיתיים מעולם התעשייה, עם ליווי מקצועי צמוד",
              icon: "💡",
            },
            {
              title: "טכנולוגיות מתקדמות",
              description: "SQL, Python, Power BI, ו-AI — כל הכלים שתעשיית הדאטה דורשת",
              icon: "🔧",
            },
            {
              title: "השמה בתעשייה",
              description: "חיבור ישיר למעסיקים בנגב ומעבר חלק לעולם העבודה",
              icon: "🌍",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="rounded-2xl border border-primary-100 bg-surface-alt p-8 text-center hover:shadow-lg hover:shadow-primary-100/50 transition-shadow"
            >
              <div className="mb-4 text-4xl">{item.icon}</div>
              <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
              <p className="text-text-secondary">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Curriculum / Tracks */}
      <Section id="tracks" className="bg-surface-alt">
        <SectionTitle
          title="תכנית הלימודים"
          subtitle="8 מודולים מקצועיים שמובילים מהיסודות ועד פרויקט גמר"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {tracks.map((track, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-primary-100/60 bg-white p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-2xl group-hover:bg-primary-100 transition-colors">
                  {track.icon}
                </span>
                <div>
                  <h3 className="mb-1 font-bold text-text-primary">{track.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{track.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* SB0 Bootcamp — Eye-catching animated section */}
      <section
        id="bootcamp"
        className="relative bg-surface-darker py-[var(--spacing-section)]"
      >
        {/* Background clip container */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(92, 124, 250, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(92, 124, 250, 0.3) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Animated gradient blobs */}
          <motion.div
            animate={{
              x: [0, 50, -30, 0],
              y: [0, -30, 20, 0],
              scale: [1, 1.3, 0.9, 1],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary-600/30 to-accent-500/20 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -40, 30, 0],
              y: [0, 40, -20, 0],
              scale: [1.2, 0.8, 1.1, 1.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-accent-600/25 to-primary-500/15 blur-3xl"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          {/* Header badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "100px" }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-6 flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-500/10 px-5 py-2 text-sm font-medium text-accent-300">
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block h-2 w-2 rounded-full bg-accent-400"
              />
              חדש — מסלול הכשרה ייחודי
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "100px" }}
            transition={{ duration: 0.7 }}
            className="text-center text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl"
          >
            <span className="block">Bootcamp</span>
            <span className="mt-2 block bg-gradient-to-l from-accent-300 via-primary-300 to-accent-400 bg-clip-text text-transparent">
              3 חודשים. מקצוע חדש.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-center text-lg text-text-muted md:text-xl"
          >
            שיתוף פעולה בין <strong className="text-white">SB0 LTD</strong> ו-<strong className="text-white">Negev Talent</strong> —
            מסלול אינטנסיבי של 3 חודשים שהופך אנשים מוכשרים למקצועני טכנולוגיה
          </motion.p>

          {/* Feature cards */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "אינטנסיבי ומעשי",
                description: "3 חודשים של למידה צמודה, פרויקטים אמיתיים, ומנטורינג 1:1 עם מפתחים מהתעשייה",
                gradient: "from-primary-500/20 to-primary-600/5",
                border: "border-primary-500/30",
              },
              {
                icon: "🎓",
                title: "SIG — Software Integration Group",
                description: "הכשרה מקצועית בשיטת SIG — שילוב תוכנה, אינטגרציה, ועבודה בצוותים בסביבת פיתוח אמיתית",
                gradient: "from-accent-500/20 to-accent-600/5",
                border: "border-accent-500/30",
              },
              {
                icon: "🚀",
                title: "מוכנים לתעשייה",
                description: "בוגרי התוכנית מקבלים ליווי קריירה, חיבור למעסיקים, וכניסה ישירה לעולם ההייטק בנגב",
                gradient: "from-primary-400/20 to-accent-500/5",
                border: "border-primary-400/30",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "100px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`rounded-2xl border ${card.border} bg-gradient-to-b ${card.gradient} p-6 backdrop-blur-sm`}
              >
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-3xl">
                  {card.icon}
                </span>
                <h3 className="mb-3 text-xl font-bold text-white">{card.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{card.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Timeline visualization */}
          <div className="mt-20 flex flex-col items-center">
            <div className="flex w-full max-w-3xl items-center justify-between">
              {["חודש 1", "חודש 2", "חודש 3"].map((month, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white shadow-lg">
                    {i + 1}
                  </div>
                  <span className="mt-3 text-sm font-medium text-text-muted">{month}</span>
                  <span className="mt-1 text-xs text-text-muted/70">
                    {["יסודות + כלים", "פרויקטים + SIG", "התמחות + השמה"][i]}
                  </span>
                </div>
              ))}
            </div>
            {/* Connecting line */}
            <div className="relative -mt-[52px] mb-12 h-0.5 w-full max-w-[calc(75%_-_3rem)]">
              <div className="absolute inset-0 bg-gradient-to-l from-accent-500 via-primary-500 to-primary-400" />
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 flex justify-center">
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-l from-primary-600 to-accent-600 px-10 py-5 text-lg font-bold text-white shadow-xl shadow-primary-600/20 transition-all hover:shadow-2xl hover:shadow-primary-600/30"
            >
              <span>הצטרפו ל-Bootcamp</span>
              <span className="text-xl">←</span>
            </a>
          </div>

          {/* Powered by logos */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-text-muted">
            <span>בשיתוף</span>
            <img src="/partners/sb0.png" alt="SB0 LTD" className="h-6 w-auto opacity-70" />
            <span>×</span>
            <img src="/partners/elevation.png" alt="Elevation" className="h-6 max-w-[120px] w-auto opacity-70" />
          </div>
        </div>
      </section>

      {/* Partners */}
      <Section id="partners">
        <SectionTitle
          title="השותפים שלנו"
          subtitle="בשיתוף גופים מובילים בנגב ובארץ"
        />
        <div className="flex flex-wrap items-center justify-center gap-12">
          {partners.map((partner, i) => (
            <div
              key={i}
              className="grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-10 max-w-[120px] w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Contact / CTA */}
      <Section id="contact" dark>
        <div className="text-center">
          <SectionTitle
            title="מוכנים להתחיל?"
            subtitle="הצטרפו לתוכנית ההכשרה הטכנולוגית המובילה בנגב"
            light
          />
          <div className="mx-auto mt-8 max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <form className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="שם מלא"
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
              />
              <input
                type="email"
                placeholder="אימייל"
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
              />
              <input
                type="tel"
                placeholder="טלפון"
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
              />
              <button
                type="submit"
                className="mt-2 rounded-full bg-primary-600 px-8 py-4 font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/40 transition-all"
              >
                שליחה
              </button>
            </form>
          </div>
        </div>
      </Section>
    </>
  );
}

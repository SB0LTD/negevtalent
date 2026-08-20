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
  { name: "אשכול", logo: "/partners/eshkol.png" },
  { name: "ג׳וינט", logo: "/partners/joint.png" },
  { name: "נתגב", logo: "/partners/netgev.png" },
  { name: "פייס", logo: "/partners/pais.png" },
  { name: "SB0", logo: "/partners/sb0.png" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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
          >
            <img
              src="/logo-white.png"
              alt="Negev Talent"
              className="mx-auto mb-8 h-16 w-auto md:h-20"
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
              className="rounded-[var(--radius-pill)] bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/40 transition-all"
            >
              הרשמה לתוכנית
            </a>
            <a
              href="#program"
              className="rounded-[var(--radius-pill)] border border-white/20 px-8 py-4 text-base font-medium text-text-on-dark hover:border-white/40 hover:bg-white/5 transition-all"
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
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="rounded-[var(--radius-card)] border border-primary-100 bg-surface-alt p-8 text-center hover:shadow-lg hover:shadow-primary-100/50 transition-shadow"
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {tracks.map((track, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="group rounded-[var(--radius-card)] border border-primary-100/60 bg-white p-6 hover:border-primary-300 hover:shadow-md transition-all"
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
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Partners */}
      <Section id="partners">
        <SectionTitle
          title="השותפים שלנו"
          subtitle="בשיתוף גופים מובילים בנגב ובארץ"
        />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-12"
        >
          {partners.map((partner, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-16 w-auto object-contain"
              />
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Contact / CTA */}
      <Section id="contact" dark>
        <div className="text-center">
          <SectionTitle
            title="מוכנים להתחיל?"
            subtitle="הצטרפו לתוכנית ההכשרה הטכנולוגית המובילה בנגב"
            light
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-8 max-w-lg rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
          >
            <form className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="שם מלא"
                className="rounded-[var(--radius-button)] border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
              />
              <input
                type="email"
                placeholder="אימייל"
                className="rounded-[var(--radius-button)] border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
              />
              <input
                type="tel"
                placeholder="טלפון"
                className="rounded-[var(--radius-button)] border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
              />
              <button
                type="submit"
                className="mt-2 rounded-[var(--radius-pill)] bg-primary-600 px-8 py-4 font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/40 transition-all"
              >
                שליחה
              </button>
            </form>
          </motion.div>
        </div>
      </Section>
    </>
  );
}

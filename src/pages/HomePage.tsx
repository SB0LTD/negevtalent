import { motion } from "framer-motion";
import { ApplyWizard } from "@/components/ApplyWizard";
import "./HomePage.css";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6 },
};

function CodeBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="code-block"
    >
      <div className="code-block__dots">
        <span className="code-block__dot" style={{ background: "#F56345" }} />
        <span className="code-block__dot" style={{ background: "#F79534" }} />
        <span className="code-block__dot" style={{ background: "#80A0E9" }} />
      </div>
      <pre>
        <code>{`// main.sig — you control every byte
const buf: [4096]u8 = undefined;

const result = try sig.fmt.formatInto(
    &buf, "Hello, {s}!", .{name}
);

// No hidden allocations.
// No silent reallocation.
// Memory is not a guess.`}</code>
      </pre>
      <div className="code-block__glow-1" />
      <div className="code-block__glow-2" />
    </motion.div>
  );
}

export function HomePage() {
  return (
    <>
      {/* ═══ Hero ═══ */}
      <section className="hero">
        <div className="hero__grid" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="hero__content">
          <p className="hero__eyebrow">Bootcamp · 3 Months · Negev</p>
          <h1 className="hero__title">
            למד לפתח <span className="hero__title-accent">ב-Sig</span>
          </h1>
          <p className="hero__subtitle">
            שלושה חודשים אינטנסיביים של לימודי פיתוח בשפת Sig.
            <br />
            בלי ניסיון קודם. בנגב. עם אפשרות תעסוקה בסוף.
          </p>

          <div className="hero__actions">
            <motion.a href="#apply" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="btn btn--primary">
              הרשמה לתוכנית
            </motion.a>
            <motion.a href="#what" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="btn btn--ghost">
              מה זה Sig?
            </motion.a>
          </div>
        </motion.div>

        {/* Logo carousel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="carousel">
          <div className="carousel__track">
            {[...Array(2)].map((_, set) => (
              <div key={set} className="carousel__set">
                <img src="/partners/elevation.png" alt="Elevation" className="carousel__logo" />
                <img src="/partners/sb0.png" alt="SB0 LTD" className="carousel__logo" />
                <img src="/logo.png" alt="Negev Talent" className="carousel__logo" style={{ height: "1.5rem" }} />
                <img src="/partners/eshkol.png" alt="אשכול הנגב" className="carousel__logo" />
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ What is Sig ═══ */}
      <section id="what" className="section section--soft">
        <div className="container container--wide">
          <motion.div {...fade} className="text-center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow eyebrow--blue">הטכנולוגיה</span>
            <h2 className="section-title">מה זה Sig?</h2>
          </motion.div>

          <div className="about-grid">
            <motion.div {...fade} className="about-grid__prose">
              <p>
                <strong style={{ color: "var(--navy)" }}>Sig</strong> הוא קומפיילר שמבוסס על Zig. אותה שפה בדיוק, אותם כלים. הדבר היחיד שמשתנה: כשקובץ נקרא <code style={{ background: "rgba(11,11,93,0.06)", padding: "2px 8px", borderRadius: "4px", color: "var(--navy)", fontSize: "0.9em" }}>.sig</code> הקומפיילר כבר לא מרשה לך להקצות זיכרון בלי שתדע בדיוק לאן כל בייט הולך.
              </p>
              <p>
                Sig נבנה ומתוחזק על ידי <strong style={{ color: "var(--navy)" }}>SB0 LTD</strong>, ומסונכרן עם Zig בכל קומיט. מי שלומד את Sig לומד systems programming אמיתי, עם שליטה מלאה על כל מה שקורה מתחת למכסה.
              </p>
            </motion.div>

            <CodeBlock />
          </div>
        </div>
      </section>

      {/* ═══ Program — Timeline Cards ═══ */}
      <section id="program" className="section">
        <div className="container container--wide">
          <motion.div {...fade} className="section-head">
            <span className="eyebrow eyebrow--red">המסלול</span>
            <h2 className="section-title">מה תלמדו בשלושה חודשים</h2>
          </motion.div>

          <div className="phase-grid">
            {[
              { n: "01", title: "יסודות", color: "#214CC9", items: ["שפת Zig/Sig מהתחלה", "להבין איך זיכרון עובד", "מבני נתונים שימושיים", "סביבת עבודה וכלים"] },
              { n: "02", title: "פרקטיקה", color: "#F56345", items: ["לבנות פרויקטים אמיתיים", "לעבוד בצוות, לעשות Code Review", "קומפילציה, לינקינג, דיבאגינג", "לכתוב קוד ב-strict mode"] },
              { n: "03", title: "כניסה לתעשייה", color: "#F79534", items: ["להשתלב בסביבת עבודה", "להתכונן לראיונות טכניים", "ליווי אישי בתהליך", "אפשרות לעבוד ב-SB0"] },
            ].map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="card phase-card"
              >
                <div className="phase-card__accent" style={{ background: phase.color }} />
                <span className="phase-card__num" style={{ color: phase.color }}>{phase.n}</span>
                <h3 className="phase-card__title">{phase.title}</h3>
                <ul className="phase-card__list">
                  {phase.items.map((item, j) => (
                    <li key={j} className="phase-card__item">
                      <span className="phase-card__bullet" style={{ background: phase.color }} />
                      <span className="phase-card__text">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Who ═══ */}
      <section id="audience" className="section section--soft">
        <div className="container container--narrow text-center">
          <motion.div {...fade} className="section-head">
            <span className="eyebrow eyebrow--orange">קהל יעד</span>
            <h2 className="section-title">למי זה מתאים</h2>
          </motion.div>

          <div className="audience-grid">
            {[
              "אנשים שמעוניינים בפיתוח low-level",
              "גרים בנגב ורוצים ללמוד מקומית",
              "לא צריך ניסיון קודם בתכנות",
              "מוכנים להשקיע 3 חודשים ברצינות",
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="card audience-card"
              >
                <div className="audience-card__row">
                  <span className="audience-card__check">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#214CC9" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <p className="audience-card__label">{item}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Partners ═══ */}
      <section id="partners" className="section">
        <div className="container container--wide text-center">
          <motion.div {...fade} className="section-head">
            <span className="eyebrow eyebrow--blue">שותפים</span>
            <h2 className="section-title">מי עומד מאחורי זה</h2>
            <p className="section-lead">התוכנית רצה בשיתוף פעולה של כמה גופים</p>
          </motion.div>

          <div className="partner-grid">
            {[
              { name: "Elevation", role: "מנהלים את ההכשרה", logo: "/partners/elevation.png" },
              { name: "SB0 LTD", role: "הטכנולוגיה והתעסוקה", logo: "/partners/sb0.png" },
              { name: "Negev Talent", role: "יזמו את התוכנית", logo: "/logo.png" },
              { name: "אשכול הנגב", role: "שותף אזורי", logo: "/partners/eshkol.png" },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="card partner-card"
              >
                <div className="partner-card__logobox">
                  <img src={p.logo} alt={p.name} className="partner-card__logo" />
                </div>
                <div className="text-center">
                  <p className="partner-card__name">{p.name}</p>
                  <p className="partner-card__role">{p.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Apply ═══ */}
      <section id="apply" className="section section--soft">
        <div className="container" style={{ maxWidth: "32rem" }}>
          <motion.div {...fade} className="section-head" style={{ marginBottom: "3.5rem" }}>
            <span className="eyebrow eyebrow--green">פתוח להרשמה</span>
            <h2 className="section-title">הרשמה</h2>
            <p className="section-lead">המחזור הקרוב מתחיל בקרוב. תשאירו פרטים ונחזור אליכם</p>
          </motion.div>
          <ApplyWizard />
        </div>
      </section>
    </>
  );
}

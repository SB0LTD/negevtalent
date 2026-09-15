import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./ThankYouPage.css";

export function ThankYouPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <section className="thankyou">
      <div className="thankyou__grid" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="thankyou__card"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
          className="thankyou__badge"
        >
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="thankyou__eyebrow"
        >
          נרשמתם בהצלחה
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="thankyou__title"
        >
          תודה שנרשמתם
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="thankyou__body"
        >
          קיבלנו את הפרטים שלכם והם אצלנו במערכת. הצוות שלנו יעבור על הבקשה
          ויחזור אליכם בהקדם עם המשך התהליך. בינתיים, מוזמנים לחזור ולקרוא עוד
          על התוכנית.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="thankyou__actions"
        >
          <Link to="/" className="btn btn--primary">
            חזרה לדף הבית
          </Link>
          <Link to="/#program" className="btn btn--ghost">
            עוד על התוכנית
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

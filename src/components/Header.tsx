import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "התוכנית", hash: "#program" },
  { label: "למי מתאים", hash: "#audience" },
  { label: "שותפים", hash: "#partners" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" aria-label="Negev Talent">
          <img src="/logo.png" alt="Negev Talent Growth" className="site-header__logo" />
        </Link>

        <nav className="site-nav">
          {navLinks.map((l) => (
            <Link key={l.hash} to={{ pathname: "/", hash: l.hash }}>{l.label}</Link>
          ))}
          <Link to={{ pathname: "/", hash: "#apply" }} className="site-nav__cta">הרשמה ←</Link>
        </nav>

        <button onClick={() => setOpen(!open)} className="site-header__burger" aria-label="תפריט">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-nav"
          >
            <nav className="mobile-nav__inner">
              {navLinks.map((l) => (
                <Link key={l.hash} to={{ pathname: "/", hash: l.hash }} onClick={() => setOpen(false)}>{l.label}</Link>
              ))}
              <Link to={{ pathname: "/", hash: "#apply" }} className="site-nav__cta" onClick={() => setOpen(false)}>הרשמה</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

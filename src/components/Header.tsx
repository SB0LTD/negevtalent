import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "התוכנית", href: "#program" },
  { label: "למי מתאים", href: "#audience" },
  { label: "שותפים", href: "#partners" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <a href="#" className="shrink-0">
          <img src="/logo.png" alt="Negev Talent Growth" className="h-6 w-auto" />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-text-secondary hover:text-navy transition-colors">
              {l.label}
            </a>
          ))}
          <a href="#apply" className="text-sm font-semibold text-blue hover:text-navy transition-colors">
            הרשמה ←
          </a>
        </nav>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="תפריט">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            className="md:hidden bg-white border-t border-border/50 overflow-hidden"
          >
            <nav className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base text-text-secondary">
                  {l.label}
                </a>
              ))}
              <a href="#apply" onClick={() => setOpen(false)} className="text-base font-semibold text-blue">
                הרשמה
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

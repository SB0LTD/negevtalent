import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "ראשי", href: "#hero" },
  { label: "התוכנית", href: "#program" },
  { label: "מסלולים", href: "#tracks" },
  { label: "שותפים", href: "#partners" },
  { label: "צור קשר", href: "#contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/80 backdrop-blur-lg border-b border-primary-100/50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2 shrink-0">
          <img
            src="/symbol.png"
            alt="Negev Talent"
            className="h-9 w-9 rounded-full"
          />
          <span className="text-lg font-bold text-primary-800 hidden sm:inline">Negev Talent</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-5">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className="shrink-0 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors whitespace-nowrap"
          >
            הרשמה
          </a>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex flex-col gap-1.5 p-2"
          aria-label="תפריט"
        >
          <span className={`block h-0.5 w-6 bg-text-primary transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-text-primary transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-text-primary transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-white border-t border-primary-100/50"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-text-secondary hover:text-primary-600 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-full bg-primary-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                הרשמה
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-surface-dark text-text-on-dark">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand */}
          <div>
            <img src="/logo-white.png" alt="Negev Talent" className="h-8 w-auto mb-4 max-w-[200px]" />
            <p className="text-sm text-text-muted leading-relaxed">
              הכשרה טכנולוגית והשתלבות בתעשייה בנגב.
              <br />
              מסלולים מקצועיים להתפתחות בעולם הדאטה וה-AI.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">קישורים</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><a href="#program" className="hover:text-white transition-colors">התוכנית</a></li>
              <li><a href="#tracks" className="hover:text-white transition-colors">מסלולים</a></li>
              <li><a href="#partners" className="hover:text-white transition-colors">שותפים</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">צור קשר</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4">יצירת קשר</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>נגב, ישראל</li>
              <li>
                <a href="mailto:info@negevtalent.co.il" className="hover:text-white transition-colors">
                  info@negevtalent.co.il
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Negev Talent. כל הזכויות שמורות.
          </p>
          <p className="text-xs text-text-muted">
            בנייה ופיתוח:{" "}
            <a
              href="https://sb0.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:text-accent-300 transition-colors"
            >
              SB0 LTD
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

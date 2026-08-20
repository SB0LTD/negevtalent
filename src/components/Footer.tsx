export function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
        <span>© {new Date().getFullYear()} Negev Talent Growth</span>
        <span>
          בנייה:{" "}
          <a href="https://sb0.co" target="_blank" rel="noopener noreferrer" className="text-blue hover:text-navy transition-colors">
            SB0 LTD
          </a>
        </span>
      </div>
    </footer>
  );
}

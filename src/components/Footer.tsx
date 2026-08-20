export function Footer() {
  return (
    <footer className="bg-surface-dark text-white/70 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <img src="/logo-white.png" alt="Negev Talent" className="h-7 w-auto opacity-80" />
        <p className="text-sm text-center md:text-right">
          © {new Date().getFullYear()} Negev Talent Growth. בנייה ופיתוח:{" "}
          <a href="https://sb0.co" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-white transition-colors">
            SB0 LTD
          </a>
        </p>
      </div>
    </footer>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span>© {new Date().getFullYear()} Negev Talent Growth</span>
        <span>
          בנייה:{" "}
          <a href="https://sb0.tech" target="_blank" rel="noopener noreferrer">
            SB0 LTD
          </a>
        </span>
      </div>
    </footer>
  );
}

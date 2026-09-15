import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/**
 * Scrolls to the element matching the URL hash after navigation. Retries a few
 * times because sections can mount/animate in slightly after route change
 * (e.g. arriving at "/#program" from the Thank You page).
 */
function useScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    let attempts = 0;
    let raf = 0;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (attempts++ < 20) {
        raf = window.setTimeout(tryScroll, 100);
      }
    };

    tryScroll();
    return () => window.clearTimeout(raf);
  }, [pathname, hash]);
}

export function RootLayout() {
  useScrollToHash();

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", overflowX: "hidden" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

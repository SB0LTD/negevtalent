import { type ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}

export function Section({ id, children, className = "", dark = false }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-[var(--spacing-section)] px-6 overflow-hidden ${dark ? "bg-surface-dark text-text-on-dark" : "bg-surface"} ${className}`}
    >
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </section>
  );
}

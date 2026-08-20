import { type ReactNode } from "react";
import { motion } from "framer-motion";

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
      className={`py-[var(--spacing-section)] px-6 ${dark ? "bg-surface-dark text-text-on-dark" : "bg-surface"} ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-7xl"
      >
        {children}
      </motion.div>
    </section>
  );
}

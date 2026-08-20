import { motion } from "framer-motion";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  light?: boolean;
}

export function SectionTitle({ title, subtitle, light = false }: SectionTitleProps) {
  return (
    <div className="mb-12 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`text-3xl font-bold md:text-4xl ${light ? "text-text-on-dark" : "text-text-primary"}`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`mt-4 text-lg ${light ? "text-text-muted" : "text-text-secondary"}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-navy">{title}</h2>
      {subtitle && <p className="mt-4 text-text-secondary">{subtitle}</p>}
    </div>
  );
}

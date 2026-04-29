interface AssistantInsightCardProps {
  card: unknown;
}

interface InsightCardData {
  kind: string;
  tone?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  stats?: Array<{ label: string; value: string }>;
  badges?: string[];
  sections?: Array<{ title: string; items: string[] }>;
  cta?: { label: string; href: string };
}

function isInsightCardData(value: unknown): value is InsightCardData {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.kind === 'string' && typeof candidate.title === 'string';
}

function getToneClasses(tone: string | undefined) {
  switch (tone) {
    case 'orange':
      return {
        frame: 'border-[#FBD38D] bg-[#FFF7ED]',
        accent: 'text-[#C2410C]',
        accentSoft: 'text-[#7C2D12]',
        pill: 'border-[#FDBA74] bg-white text-[#C2410C]',
        panel: 'bg-white text-[#7C2D12]',
      };
    case 'blue':
      return {
        frame: 'border-[#BFDBFE] bg-[#EFF6FF]',
        accent: 'text-[#1D4ED8]',
        accentSoft: 'text-[#1E3A8A]',
        pill: 'border-[#93C5FD] bg-white text-[#1D4ED8]',
        panel: 'bg-white text-[#1E293B]',
      };
    case 'purple':
      return {
        frame: 'border-[#D8B4FE] bg-[#FAF5FF]',
        accent: 'text-[#7C3AED]',
        accentSoft: 'text-[#4C1D95]',
        pill: 'border-[#C4B5FD] bg-white text-[#6D28D9]',
        panel: 'bg-white text-[#1E293B]',
      };
    case 'green':
      return {
        frame: 'border-[#BBF7D0] bg-[#F0FDF4]',
        accent: 'text-[#15803D]',
        accentSoft: 'text-[#166534]',
        pill: 'border-[#86EFAC] bg-white text-[#15803D]',
        panel: 'bg-white text-[#14532D]',
      };
    default:
      return {
        frame: 'border-[#CBD5E1] bg-[#F8FAFC]',
        accent: 'text-[#334155]',
        accentSoft: 'text-[#1E293B]',
        pill: 'border-[#CBD5E1] bg-white text-[#334155]',
        panel: 'bg-white text-[#1E293B]',
      };
  }
}

export function AssistantInsightCard({ card }: AssistantInsightCardProps) {
  if (!isInsightCardData(card)) {
    return null;
  }

  const styles = getToneClasses(card.tone);
  const stats = Array.isArray(card.stats)
    ? card.stats.filter(
        (item): item is { label: string; value: string } =>
          typeof item?.label === 'string' && typeof item?.value === 'string'
      )
    : [];
  const badges = Array.isArray(card.badges)
    ? card.badges.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      )
    : [];
  const sections = Array.isArray(card.sections)
    ? card.sections.filter(
        (section): section is { title: string; items: string[] } =>
          typeof section?.title === 'string' &&
          Array.isArray(section.items) &&
          section.items.every((item) => typeof item === 'string')
      )
    : [];
  const cta =
    typeof card.cta?.label === 'string' && typeof card.cta?.href === 'string' ? card.cta : null;

  return (
    <div className={`mt-3 rounded-xl border p-4 ${styles.frame}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {card.eyebrow ? (
            <div className={`text-xs font-semibold uppercase tracking-wide ${styles.accent}`}>
              {card.eyebrow}
            </div>
          ) : null}
          <div className={`mt-1 text-sm font-semibold ${styles.accentSoft}`}>{card.title}</div>
          {card.subtitle ? (
            <div className="mt-1 text-sm text-[#475569]">{card.subtitle}</div>
          ) : null}
        </div>
        {cta ? (
          <a
            href={cta.href}
            className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-white/80 ${styles.pill}`}
          >
            {cta.label}
          </a>
        ) : null}
      </div>

      {stats.length > 0 ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={`${stat.label}-${stat.value}`} className={`rounded-lg p-3 ${styles.panel}`}>
              <div className={`text-xs font-semibold uppercase tracking-wide ${styles.accent}`}>
                {stat.label}
              </div>
              <div className="mt-1 text-sm font-medium">{stat.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${styles.pill}`}
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      {sections.length > 0 ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className={`rounded-lg p-3 ${styles.panel}`}>
              <div className={`text-xs font-semibold uppercase tracking-wide ${styles.accent}`}>
                {section.title}
              </div>
              <div className="mt-2 space-y-2 text-sm">
                {section.items.map((item) => (
                  <div key={item} className="leading-5 text-[#475569]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

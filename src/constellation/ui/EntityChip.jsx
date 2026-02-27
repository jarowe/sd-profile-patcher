import { useConstellationStore } from '../store';

/** Entity chip color mapping by type */
const CHIP_COLORS = {
  person: { bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.3)', text: '#a78bfa' },
  place: { bg: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.3)', text: '#2dd4bf' },
  project: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
  idea: { bg: 'rgba(34, 211, 238, 0.15)', border: 'rgba(34, 211, 238, 0.3)', text: '#22d3ee' },
  moment: { bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.3)', text: '#f87171' },
  milestone: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' },
};

const defaultColor = { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.6)' };

/**
 * Small clickable entity chip for detail panel.
 * Clicking filters the constellation to highlight all nodes connected to this entity.
 */
export default function EntityChip({ type, label, count, onClick }) {
  const setFilterEntity = useConstellationStore((s) => s.setFilterEntity);
  const colors = CHIP_COLORS[type] || defaultColor;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setFilterEntity({ type, value: label });
    }
  };

  return (
    <button
      className="entity-chip"
      onClick={handleClick}
      title={`Filter by ${label}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        border: '1px solid',
        fontSize: '0.75rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'transform 0.15s, filter 0.15s',
        letterSpacing: '0.01em',
        lineHeight: 1.4,
        background: colors.bg,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.filter = 'brightness(1.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          style={{
            fontSize: '0.65rem',
            opacity: 0.6,
          }}
        >
          ({count})
        </span>
      )}
    </button>
  );
}

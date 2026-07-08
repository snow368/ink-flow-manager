const STAR_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  fontSize: 22,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  lineHeight: 1,
  transition: 'transform 0.15s',
};

export function ReviewStars({ rating, size = 'md', interactive, onChange }: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const starSize = size === 'sm' ? 18 : size === 'lg' ? 32 : 22;
  const containerStyle = { display: 'inline-flex', gap: size === 'sm' ? 1 : 2, alignItems: 'center' };

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= rating;
    const half = !filled && i - 0.5 <= rating;
    stars.push(
      interactive ? (
        <button
          key={i}
          onClick={() => onChange?.(i)}
          onMouseEnter={(e) => { if (interactive) (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)'; }}
          onMouseLeave={(e) => { if (interactive) (e.currentTarget as HTMLElement).style.transform = ''; }}
          style={{ ...STAR_STYLE, width: starSize + 6, height: starSize + 6, fontSize: starSize }}
          type="button"
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
        >
          {filled ? '★' : half ? '★' : '☆'}
        </button>
      ) : (
        <span key={i} style={{ fontSize: starSize, lineHeight: 1, color: filled ? '#fbbf24' : '#475569' }}>
          {filled ? '★' : half ? '★' : '☆'}
        </span>
      )
    );
  }
  return <div style={containerStyle}>{stars}</div>;
}

export function ReviewSummary({ avg, total }: { avg: number; total: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <ReviewStars rating={avg} size="sm" />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
        {avg.toFixed(1)}
      </span>
      <span style={{ fontSize: 12, color: '#64748b' }}>
        ({total} {total === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}

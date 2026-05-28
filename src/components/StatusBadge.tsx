import { THEME } from '../lib/theme';
import { STATUS_COLORS, STATUS_LABELS, type AppointmentStatus } from '../lib/appointmentLogic';

interface StatusBadgeProps {
  status: AppointmentStatus;
  /** Show label text next to dot (default true) */
  labeled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

export function StatusDot({ status, size = 'md' }: { status: AppointmentStatus; size?: 'sm' | 'md' }) {
  const dotSize = size === 'sm' ? 6 : 8;
  return (
    <span
      style={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        background: STATUS_COLORS[status] || '#9ca3af',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

export default function StatusBadge({ status, labeled = true, size = 'md' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || '#9ca3af';
  const label = STATUS_LABELS[status] || status;
  const isMuted = status === 'done' || status === 'cancelled' || status === 'draft';

  const fontSize = size === 'sm' ? 10 : 11;
  const padding = size === 'sm' ? '2px 8px' : '3px 10px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding,
        borderRadius: THEME.radius.sm,
        border: `1px solid ${color}33`,
        background: `${color}15`,
        color: isMuted ? THEME.text.muted : color,
        fontSize,
        fontWeight: 600,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}
    >
      <StatusDot status={status} size={size} />
      {labeled && (STATUS_LABELS[status] || status)}
    </span>
  );
}

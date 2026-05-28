export const THEME = {
  bg: {
    app: '#0c0c0c',
    panel: '#141416',
    panelAlt: '#1a1a1e',
    hover: '#222226',
  },
  text: {
    primary: '#ffffff',
    muted: '#a3a3a3',
    subtle: '#525252',
  },
  brand: {
    primary: '#a33a3a',
    info: '#fbbf24',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#8b1a1a',
    accent: '#a33a3a',
  },
  border: {
    default: '#2a2a2e',
    soft: '#1a1a1e',
    subtle: '#222226',
  },
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 10,
    '2xl': 12,
    '3xl': 14,
  },
  spacing: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
  },
  fontSize: {
    xs: 10,
    sm: 11,
    base: 13,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
  },
  fontWeight: {
    normal: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

/* Shared component style factories */
export const btn = {
  primary: {
    width: '100%' as const,
    padding: '14px 24px',
    borderRadius: THEME.radius['2xl'],
    border: 'none',
    background: THEME.brand.primary,
    color: THEME.text.primary,
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.semibold,
    cursor: 'pointer' as const,
  },
  secondary: {
    padding: '8px 16px',
    borderRadius: THEME.radius.lg,
    border: `1px solid ${THEME.border.default}`,
    background: 'transparent',
    color: THEME.text.muted,
    fontSize: THEME.fontSize.base,
    cursor: 'pointer' as const,
  },
  ghost: {
    background: 'none',
    border: 'none',
    color: THEME.brand.info,
    fontSize: THEME.fontSize.base,
    cursor: 'pointer' as const,
  },
  danger: {
    width: '100%' as const,
    padding: '14px 24px',
    borderRadius: THEME.radius['2xl'],
    border: 'none',
    background: THEME.brand.danger,
    color: THEME.text.primary,
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.semibold,
    cursor: 'pointer' as const,
  },
  small: {
    padding: '6px 12px',
    borderRadius: THEME.radius.md,
    border: `1px solid ${THEME.border.default}`,
    background: 'transparent',
    color: THEME.text.muted,
    fontSize: THEME.fontSize.sm,
    cursor: 'pointer' as const,
  },
};

export const card: React.CSSProperties = {
  background: THEME.bg.panel,
  borderRadius: THEME.radius.xl,
  padding: THEME.spacing.xl,
  border: `1px solid ${THEME.border.default}`,
};

export const input: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: THEME.radius.xl,
  border: `1px solid ${THEME.border.default}`,
  background: THEME.bg.panel,
  color: THEME.text.primary,
  fontSize: THEME.fontSize.lg,
  outline: 'none',
  boxSizing: 'border-box',
};

export const pagePadding: React.CSSProperties = {
  padding: `${THEME.spacing['3xl']}px ${THEME.spacing['3xl']}px`,
  color: THEME.text.primary,
};

export const sectionHeader: React.CSSProperties = {
  fontSize: THEME.fontSize.xs,
  fontWeight: THEME.fontWeight.bold,
  color: THEME.text.subtle,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: THEME.spacing.lg,
  marginTop: THEME.spacing.xs,
};

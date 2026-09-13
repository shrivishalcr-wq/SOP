const VARIANTS = {
  success: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)' },
  danger: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' },
  neutral: { bg: 'var(--color-neutral-bg)', fg: 'var(--color-text-secondary)' },
};

const STATUS_VARIANT_MAP = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'danger',
  PENDING_CONSENT: 'warning',
  REVOKED: 'danger',
  NOT_STARTED: 'neutral',
};

export function StatusBadge({ status, variant }) {
  const resolvedVariant = variant || STATUS_VARIANT_MAP[status] || 'neutral';
  const colors = VARIANTS[resolvedVariant] || VARIANTS.neutral;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: colors.bg,
        color: colors.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {status ? status.replace(/_/g, ' ') : '—'}
    </span>
  );
}

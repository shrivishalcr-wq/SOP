export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div
      className="vc-card"
      style={{ padding: 20, textAlign: 'center', borderColor: 'var(--color-danger)' }}
    >
      <p style={{ color: 'var(--color-danger)', marginBottom: onRetry ? 12 : 0 }}>{message}</p>
      {onRetry ? (
        <button type="button" className="vc-btn" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

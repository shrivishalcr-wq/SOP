export function LoadingState({ label = 'Loading…' }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }} className="vc-text-muted">
      {label}
    </div>
  );
}

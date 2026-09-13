export function EmptyState({ title = 'No data yet', description }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <h3 className="vc-text-secondary">{title}</h3>
      {description ? (
        <p className="vc-text-muted" style={{ marginTop: 6 }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

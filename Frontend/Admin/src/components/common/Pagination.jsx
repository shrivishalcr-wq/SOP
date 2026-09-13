export function Pagination({ page, totalPages, total, onPageChange }) {
  if (!total) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
      <span className="vc-text-muted" style={{ fontSize: 12 }}>
        Page {page} of {totalPages || 1} · {total} total
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="vc-btn" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button type="button" className="vc-btn" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

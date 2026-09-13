import { useEffect, useRef } from 'react';

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (open) confirmButtonRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vc-confirm-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 12, 16, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        className="vc-card"
        style={{ padding: 20, width: 380, maxWidth: '90vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="vc-confirm-title" style={{ marginBottom: 8 }}>
          {title}
        </h3>
        {description ? (
          <p className="vc-text-secondary" style={{ marginBottom: 18 }}>
            {description}
          </p>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="vc-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            className={danger ? 'vc-btn vc-btn-danger' : 'vc-btn vc-btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { getResidentDetail } from '../api/residents.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { formatDateTime } from '../utils/formatters.js';

export function ResidentDetailPage() {
  const { residentId } = useParams();
  const navigate = useNavigate();

  const fetchDetail = useCallback(() => getResidentDetail(residentId), [residentId]);
  const { data, loading, error, reload } = useApi(fetchDetail, [fetchDetail]);

  if (loading) return <LoadingState label="Loading resident…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { resident, preferredCategories } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button type="button" className="vc-btn" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/residents')}>
        Back to residents
      </button>

      <div className="vc-card" style={{ padding: 20 }}>
        <h2>{resident.DisplayName || 'Unnamed resident'}</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginTop: 16,
          }}
        >
          <div>
            <div className="vc-label">Address</div>
            <div>{resident.Address || '—'}</div>
          </div>
          <div>
            <div className="vc-label">Notification Radius</div>
            <div>{resident.NotificationRadius} m</div>
          </div>
          <div>
            <div className="vc-label">Joined</div>
            <div>{formatDateTime(resident.createdAt)}</div>
          </div>
        </div>
      </div>

      <div className="vc-card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <h2>Preferred Categories</h2>
        </div>
        {preferredCategories.length === 0 ? (
          <EmptyState title="No preferences set" description="This resident has not selected any vendor categories yet." />
        ) : (
          <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {preferredCategories.map((category) => (
              <span
                key={category._id}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'var(--color-neutral-bg)',
                  fontSize: 12,
                }}
              >
                {category.Name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

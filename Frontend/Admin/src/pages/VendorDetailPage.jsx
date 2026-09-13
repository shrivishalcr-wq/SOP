import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { getVendorDetail, updateVendorStatus } from '../api/vendors.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { formatDateTime, formatRating } from '../utils/formatters.js';
import { extractErrorMessage } from '../api/client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('vendor-detail-page');

export function VendorDetailPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [pendingStatus, setPendingStatus] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchDetail = useCallback(() => getVendorDetail(vendorId), [vendorId]);
  const { data, loading, error, reload } = useApi(fetchDetail, [fetchDetail]);

  async function confirmStatusChange() {
    try {
      await updateVendorStatus(vendorId, pendingStatus);
      setPendingStatus(null);
      reload();
    } catch (err) {
      logger.error('Failed to update vendor status', err);
      setActionError(extractErrorMessage(err));
    }
  }

  if (loading) return <LoadingState label="Loading vendor…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { vendor, location, session, recentActivity } = data;

  const activityColumns = [
    { key: 'Event', header: 'Event' },
    { key: 'Description', header: 'Description' },
    { key: 'EventTime', header: 'When', render: (row) => formatDateTime(row.EventTime) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button type="button" className="vc-btn" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/vendors')}>
        Back to vendors
      </button>

      {actionError ? <ErrorState message={actionError} /> : null}

      <div className="vc-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>{vendor.VendorName}</h2>
            <p className="vc-text-secondary" style={{ marginTop: 4 }}>
              {vendor.Category_ID?.Name || 'Uncategorized'} · {vendor.Vehicle}
            </p>
          </div>
          <StatusBadge status={vendor.Status} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginTop: 20,
          }}
        >
          <div>
            <div className="vc-label">Average Rating</div>
            <div>{formatRating(vendor.AvgRating)} ({vendor.RatingCount} ratings)</div>
          </div>
          <div>
            <div className="vc-label">Registered</div>
            <div>{formatDateTime(vendor.createdAt)}</div>
          </div>
          <div>
            <div className="vc-label">Last Location Update</div>
            <div>{location ? formatDateTime(location.UpdatedAt) : 'No location reported yet'}</div>
          </div>
          <div>
            <div className="vc-label">Consent Status</div>
            <div><StatusBadge status={session?.SessionStatus || 'NOT_STARTED'} /></div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          {vendor.Status !== 'SUSPENDED' && (
            <button type="button" className="vc-btn vc-btn-danger" onClick={() => setPendingStatus('SUSPENDED')}>
              Suspend vendor
            </button>
          )}
          {vendor.Status === 'SUSPENDED' && (
            <button type="button" className="vc-btn" onClick={() => setPendingStatus('INACTIVE')}>
              Lift suspension
            </button>
          )}
          {vendor.Status !== 'ACTIVE' && vendor.Status !== 'SUSPENDED' && (
            <button type="button" className="vc-btn" onClick={() => setPendingStatus('ACTIVE')}>
              Mark active
            </button>
          )}
        </div>
      </div>

      <div className="vc-card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <h2>Recent Activity</h2>
        </div>
        <DataTable
          columns={activityColumns}
          rows={recentActivity}
          rowKey="_id"
          emptyTitle="No activity recorded yet"
        />
      </div>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={`Set "${vendor.VendorName}" to ${pendingStatus}?`}
        description="This change takes effect immediately and is recorded in this vendor's activity log."
        danger={pendingStatus === 'SUSPENDED'}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}

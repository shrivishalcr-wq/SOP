import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { listVendors, updateVendorStatus } from '../api/vendors.js';
import { listCategories } from '../api/categories.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { formatRelativeTime, formatRating } from '../utils/formatters.js';
import { extractErrorMessage } from '../api/client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('vendors-page');
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

export function VendorsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // { vendor, nextStatus }
  const [actionError, setActionError] = useState(null);

  const fetchVendors = useCallback(
    () => listVendors({ page, status: status || undefined, category: category || undefined, q: search || undefined }),
    [page, status, category, search]
  );
  const { data: vendorsResponse, loading, error, reload } = useApi(fetchVendors, [fetchVendors]);
  const { data: categories } = useApi(listCategories, []);

  function requestStatusChange(vendor, nextStatus) {
    setActionError(null);
    setPendingAction({ vendor, nextStatus });
  }

  async function confirmStatusChange() {
    if (!pendingAction) return;
    const { vendor, nextStatus } = pendingAction;
    try {
      await updateVendorStatus(vendor.Vendor_ID, nextStatus);
      setPendingAction(null);
      reload();
    } catch (err) {
      logger.error('Failed to update vendor status', err);
      setActionError(extractErrorMessage(err));
    }
  }

  const columns = [
    { key: 'VendorName', header: 'Vendor' },
    { key: 'Category', header: 'Category', render: (row) => row.Category?.Name || '—' },
    { key: 'Vehicle', header: 'Vehicle' },
    { key: 'Status', header: 'Status', render: (row) => <StatusBadge status={row.Status} /> },
    { key: 'ConsentStatus', header: 'Consent', render: (row) => <StatusBadge status={row.ConsentStatus} /> },
    { key: 'AvgRating', header: 'Rating', render: (row) => `${formatRating(row.AvgRating)} (${row.RatingCount})` },
    {
      key: 'LastLocationUpdate',
      header: 'Last Seen',
      render: (row) => formatRelativeTime(row.LastLocationUpdate),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          {row.Status !== 'SUSPENDED' && (
            <button type="button" className="vc-btn vc-btn-danger" onClick={() => requestStatusChange(row, 'SUSPENDED')}>
              Suspend
            </button>
          )}
          {row.Status !== 'ACTIVE' && row.Status !== 'SUSPENDED' && (
            <button type="button" className="vc-btn" onClick={() => requestStatusChange(row, 'ACTIVE')}>
              Reactivate
            </button>
          )}
          {row.Status === 'SUSPENDED' && (
            <button type="button" className="vc-btn" onClick={() => requestStatusChange(row, 'INACTIVE')}>
              Lift suspension
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="vc-card" style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 200 }}>
          <label className="vc-label" htmlFor="vendor-search">
            Search
          </label>
          <input
            id="vendor-search"
            className="vc-input"
            placeholder="Vendor name"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <label className="vc-label" htmlFor="vendor-status">
            Status
          </label>
          <select
            id="vendor-status"
            className="vc-select"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 180 }}>
          <label className="vc-label" htmlFor="vendor-category">
            Category
          </label>
          <select
            id="vendor-category"
            className="vc-select"
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
          >
            <option value="">All categories</option>
            {(categories || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError ? <ErrorState message={actionError} /> : null}

      <div className="vc-card">
        {loading ? (
          <LoadingState label="Loading vendors…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={vendorsResponse.data}
              rowKey="Vendor_ID"
              onRowClick={(row) => navigate(`/vendors/${row.Vendor_ID}`)}
              emptyTitle="No vendors found"
              emptyDescription="Vendors register themselves through WhatsApp - none match the current filters yet."
            />
            <Pagination
              page={vendorsResponse.meta.page}
              totalPages={vendorsResponse.meta.totalPages}
              total={vendorsResponse.meta.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction ? `Set "${pendingAction.vendor.VendorName}" to ${pendingAction.nextStatus}?` : ''}
        description="This change takes effect immediately and is recorded in the vendor's activity log."
        confirmLabel="Confirm"
        danger={pendingAction?.nextStatus === 'SUSPENDED'}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { listResidents } from '../api/residents.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { formatDateTime } from '../utils/formatters.js';

export function ResidentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchResidents = useCallback(() => listResidents({ page, q: search || undefined }), [page, search]);
  const { data, loading, error, reload } = useApi(fetchResidents, [fetchResidents]);

  const columns = [
    { key: 'DisplayName', header: 'Name', render: (row) => row.DisplayName || 'Unnamed resident' },
    { key: 'Address', header: 'Address', render: (row) => row.Address || '—' },
    { key: 'NotificationRadius', header: 'Notification Radius', render: (row) => `${row.NotificationRadius} m` },
    { key: 'createdAt', header: 'Joined', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="vc-card" style={{ padding: 16, maxWidth: 320 }}>
        <label className="vc-label" htmlFor="resident-search">
          Search
        </label>
        <input
          id="resident-search"
          className="vc-input"
          placeholder="Resident name"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <div className="vc-card">
        {loading ? (
          <LoadingState label="Loading residents…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data.data}
              rowKey="_id"
              onRowClick={(row) => navigate(`/residents/${row._id}`)}
              emptyTitle="No residents found"
              emptyDescription="Residents register through the mobile app - none match the current filters yet."
            />
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { listAlerts } from '../api/alerts.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { formatDateTime, formatDistance } from '../utils/formatters.js';

export function AlertsPage() {
  const [page, setPage] = useState(1);
  const fetchAlerts = useCallback(() => listAlerts({ page }), [page]);
  const { data, loading, error, reload } = useApi(fetchAlerts, [fetchAlerts]);

  const columns = [
    { key: 'VendorName', header: 'Vendor' },
    { key: 'ResidentName', header: 'Resident' },
    { key: 'EtaMinutes', header: 'ETA', render: (row) => `${row.EtaMinutes} min` },
    { key: 'DistanceAtAlert', header: 'Distance', render: (row) => formatDistance(row.DistanceAtAlert) },
    { key: 'Timestamp', header: 'Time', render: (row) => formatDateTime(row.Timestamp) },
  ];

  return (
    <div className="vc-card">
      {loading ? (
        <LoadingState label="Loading alerts…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey="Alert_ID"
            emptyTitle="No alerts yet"
            emptyDescription="Proximity alerts will appear here once vendors and residents start interacting."
          />
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

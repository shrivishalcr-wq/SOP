import { useCallback, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { listActivity } from '../api/activity.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { formatDateTime } from '../utils/formatters.js';

export function ActivityPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState('');

  const fetchActivity = useCallback(() => listActivity({ page, event: eventFilter || undefined }), [page, eventFilter]);
  const { data, loading, error, reload } = useApi(fetchActivity, [fetchActivity]);

  const columns = [
    { key: 'VendorName', header: 'Vendor' },
    { key: 'Event', header: 'Event' },
    { key: 'Description', header: 'Description' },
    { key: 'EventTime', header: 'When', render: (row) => formatDateTime(row.EventTime) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="vc-card" style={{ padding: 16, maxWidth: 320 }}>
        <label className="vc-label" htmlFor="event-filter">
          Event type
        </label>
        <input
          id="event-filter"
          className="vc-input"
          placeholder="e.g. Location Updated"
          value={eventFilter}
          onChange={(e) => {
            setPage(1);
            setEventFilter(e.target.value);
          }}
        />
      </div>

      <div className="vc-card">
        {loading ? (
          <LoadingState label="Loading activity…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data.data}
              rowKey="Log_ID"
              emptyTitle="No activity recorded yet"
              emptyDescription="Vendor registrations, location updates, and consent changes will appear here."
            />
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

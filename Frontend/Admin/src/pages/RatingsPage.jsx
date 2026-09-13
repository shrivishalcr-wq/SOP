import { useCallback, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { listRatings } from '../api/ratings.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { formatDateTime } from '../utils/formatters.js';

export function RatingsPage() {
  const [page, setPage] = useState(1);
  const fetchRatings = useCallback(() => listRatings({ page }), [page]);
  const { data, loading, error, reload } = useApi(fetchRatings, [fetchRatings]);

  const columns = [
    { key: 'VendorName', header: 'Vendor' },
    { key: 'RatingValue', header: 'Rating', render: (row) => `${row.RatingValue} / 5` },
    { key: 'Review', header: 'Review', render: (row) => row.Review || '—' },
    { key: 'RatingDate', header: 'Date', render: (row) => formatDateTime(row.RatingDate) },
  ];

  return (
    <div className="vc-card">
      {loading ? (
        <LoadingState label="Loading feedback…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey="Rating_ID"
            emptyTitle="No ratings yet"
            emptyDescription="Ratings will appear here once residents start rating vendors after a proximity alert."
          />
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

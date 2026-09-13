import { useCallback, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { getPilotReport } from '../api/dashboard.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { StatCard } from '../components/common/StatCard.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { formatDateTime, formatRating } from '../utils/formatters.js';

const WINDOW_OPTIONS = [7, 14, 30];

export function PilotReportPage() {
  const [windowDays, setWindowDays] = useState(7);
  const fetchReport = useCallback(() => getPilotReport(windowDays), [windowDays]);
  const { data, loading, error, reload } = useApi(fetchReport, [fetchReport]);

  const categoryColumns = [
    { key: 'categoryName', header: 'Category' },
    { key: 'avgRating', header: 'Avg Rating', render: (row) => formatRating(row.avgRating) },
    { key: 'ratingCount', header: 'Ratings' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="vc-card" style={{ padding: 16, maxWidth: 220 }}>
        <label className="vc-label" htmlFor="window-days">
          Reporting Window
        </label>
        <select
          id="window-days"
          className="vc-select"
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
        >
          {WINDOW_OPTIONS.map((days) => (
            <option key={days} value={days}>
              Last {days} days
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState label="Loading pilot report…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StatCard label="Vendors Registered" value={data.totalVendorsRegistered} />
            <StatCard label="Alerts Dispatched" value={data.totalAlertsDispatched} />
            <StatCard label="Active Vendor Hours" value={data.activeVendorHours.totalActiveHours} />
            <StatCard label="Distinct Active Vendors" value={data.activeVendorHours.distinctActiveVendors} />
            <StatCard
              label="Notification → Interaction"
              value={`${Math.round(data.interactionDensity.notificationToInteractionDensity * 100)}%`}
              hint="Share of alerted vendor/resident pairs that led to a rating"
            />
          </div>

          <div className="vc-card">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
              <h2>Average Rating by Category</h2>
            </div>
            <DataTable
              columns={categoryColumns}
              rows={data.avgRatingPerCategory}
              rowKey="categoryId"
              emptyTitle="No ratings in this window"
            />
          </div>

          <p className="vc-text-muted" style={{ fontSize: 12 }}>
            Report period: {formatDateTime(data.period.from)} – {formatDateTime(data.period.to)}
          </p>
        </>
      )}
    </div>
  );
}

import { useApi } from '../hooks/useApi.js';
import { getDashboardSummary } from '../api/dashboard.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { StatCard } from '../components/common/StatCard.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { formatDateTime, formatDistance } from '../utils/formatters.js';

export function DashboardPage() {
  const { data, loading, error, reload } = useApi(getDashboardSummary, []);

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const columns = [
    { key: 'vendorName', header: 'Vendor' },
    { key: 'residentName', header: 'Resident' },
    { key: 'etaMinutes', header: 'ETA', render: (row) => `${row.etaMinutes} min` },
    { key: 'distanceAtAlertKm', header: 'Distance', render: (row) => formatDistance(row.distanceAtAlertKm * 1000) },
    { key: 'timestamp', header: 'Time', render: (row) => formatDateTime(row.timestamp) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Active Vendors" value={data.totalActiveVendors} />
        <StatCard label="Registered Residents" value={data.totalResidents} />
        <StatCard label="Recent Alerts" value={data.recentAlerts.length} hint="Last 10 dispatched" />
      </div>

      <div className="vc-card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <h2>Recent Alerts</h2>
        </div>
        <DataTable
          columns={columns}
          rows={data.recentAlerts.map((alert) => ({ ...alert, _id: alert.alertId }))}
          emptyTitle="No alerts yet"
          emptyDescription="Proximity alerts will appear here once vendors and residents start interacting."
        />
      </div>

      <p className="vc-text-muted" style={{ fontSize: 12 }}>
        Last updated {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}

import { EmptyState } from './EmptyState.jsx';

/**
 * columns: [{ key, header, render?(row) }]
 * rows: array of data objects
 */
export function DataTable({ columns, rows, emptyTitle, emptyDescription, rowKey = '_id', onRowClick }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  borderBottom: '2px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                  background: 'var(--color-surface-alt)',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderBottom: '1px solid var(--color-border)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-alt)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'var(--color-bg)';
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '14px 16px',
                    verticalAlign: 'middle',
                    fontSize: 14,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

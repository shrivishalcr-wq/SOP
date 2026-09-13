import { Outlet, useMatches } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function AppShell() {
  const matches = useMatches();
  const current = [...matches].reverse().find((m) => m.handle?.title);
  const title = current?.handle?.title || 'VendiConnect';

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar title={title} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

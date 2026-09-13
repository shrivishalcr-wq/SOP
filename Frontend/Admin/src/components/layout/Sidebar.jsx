import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, User, Tag, Star, AlertTriangle, Activity, FileText, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vendors', label: 'Vendors', icon: Users },
  { to: '/residents', label: 'Residents', icon: User },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/ratings', label: 'Feedback', icon: Star },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/activity', label: 'Activity Log', icon: Activity },
  { to: '/pilot-report', label: 'Pilot Report', icon: FileText },
];

export function Sidebar() {
  const { admin } = useAuth();
  const navItems = admin?.role === 'SUPER_ADMIN'
    ? [...NAV_ITEMS, { to: '/register', label: 'Admin Accounts', icon: UserPlus }]
    : NAV_ITEMS;

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
      }}
    >
      <div style={{ padding: '0 24px 24px', borderBottom: '1px solid var(--color-border)', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent-contrast)',
          }}>
            V
          </div>
          VendiConnect
        </div>
        <div className="vc-text-muted" style={{ fontSize: 13, marginTop: 4 }}>
          Admin Console
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? 'var(--color-accent-contrast)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

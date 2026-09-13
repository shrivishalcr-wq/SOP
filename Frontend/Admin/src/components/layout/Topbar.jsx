import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Moon, Sun, LogOut, User } from 'lucide-react';

export function Topbar({ title }) {
  const { theme, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();

  return (
    <header
      style={{
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          className="vc-btn"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{ padding: '8px 12px' }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {admin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 8, background: 'var(--color-surface-alt)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <User size={16} />
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{admin.email}</div>
              <div className="vc-text-muted" style={{ fontSize: 11 }}>
                {admin.role}
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="vc-btn"
          onClick={logout}
          style={{ padding: '8px 16px' }}
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}

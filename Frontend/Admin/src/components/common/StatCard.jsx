import { TrendingUp, Users, AlertCircle, Activity } from 'lucide-react';

const ICONS = {
  'Active Vendors': Users,
  'Registered Residents': Users,
  'Recent Alerts': AlertCircle,
  'default': TrendingUp,
};

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
];

export function StatCard({ label, value, hint }) {
  const Icon = ICONS[label] || ICONS.default;
  const gradientIndex = Math.abs(label.length) % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex];

  return (
    <div
      className="vc-card"
      style={{
        padding: 20,
        minWidth: 200,
        flex: '1 1 200px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: gradient,
          opacity: 0.1,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="vc-label" style={{ marginBottom: 0 }}>
          {label}
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      {hint ? (
        <div className="vc-text-muted" style={{ marginTop: 6, fontSize: 12 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

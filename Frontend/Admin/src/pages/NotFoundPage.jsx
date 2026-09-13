import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <h2>Page not found</h2>
      <p className="vc-text-secondary" style={{ marginTop: 8, marginBottom: 20 }}>
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="vc-btn vc-btn-primary" style={{ textDecoration: 'none' }}>
        Return to dashboard
      </Link>
    </div>
  );
}

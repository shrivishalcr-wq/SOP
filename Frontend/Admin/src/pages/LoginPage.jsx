import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { extractErrorMessage } from '../api/client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('login-page');

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      logger.warn('Login failed', err);
      setError(extractErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
      }}
    >
      <form onSubmit={handleSubmit} className="vc-card" style={{ padding: 32, width: 360 }}>
        <h1 style={{ marginBottom: 4 }}>VendiConnect Admin</h1>
        <p className="vc-text-secondary" style={{ marginBottom: 24 }}>
          Sign in with your administrator account.
        </p>

        <div className="vc-field">
          <label className="vc-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="vc-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="vc-field">
          <label className="vc-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="vc-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? (
          <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 16 }}>{error}</p>
        ) : null}

        <button type="submit" className="vc-btn vc-btn-primary" 
        style={{  width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'  }} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="vc-text-secondary" style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          Sign in as a SUPER_ADMIN to create additional admin accounts.
        </p>
      </form>
    </div>
  );
}

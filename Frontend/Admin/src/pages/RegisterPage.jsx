import { useState } from 'react';
import { Link } from 'react-router-dom';
import { register as registerRequest } from '../api/auth.js';
import { extractErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const roles = ['SUPER_ADMIN', 'OPERATIONS', 'SUPPORT'];

export function RegisterPage() {
  const { admin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERATIONS');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await registerRequest(email.trim(), password, role);
      setMessage(`Created ${result.admin.email} as ${result.admin.role}.`);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to create the admin account.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (admin?.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="vc-card" style={{ padding: 32, width: 360 }}>
          <h1>Admin registration</h1>
          <p className="vc-text-secondary">Only SUPER_ADMIN accounts can create administrators.</p>
          <Link to="/" className="vc-btn vc-btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <form onSubmit={handleSubmit} className="vc-card" style={{ padding: 32, width: 360 }}>
        <h1 style={{ marginBottom: 4 }}>Create admin account</h1>
        <p className="vc-text-secondary" style={{ marginBottom: 24 }}>
          Signed in as {admin.email}. New accounts are stored securely in the database.
        </p>

        <div className="vc-field">
          <label className="vc-label" htmlFor="registration-email">Email</label>
          <input
            id="registration-email"
            type="email"
            className="vc-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="vc-field">
          <label className="vc-label" htmlFor="registration-password">Password</label>
          <input
            id="registration-password"
            type="password"
            className="vc-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="vc-field">
          <label className="vc-label" htmlFor="registration-role">Role</label>
          <select id="registration-role" className="vc-input" value={role} onChange={(event) => setRole(event.target.value)}>
            {roles.map((availableRole) => <option key={availableRole} value={availableRole}>{availableRole}</option>)}
          </select>
        </div>

        {error ? <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 16 }}>{error}</p> : null}
        {message ? <p style={{ color: 'var(--color-success)', fontSize: 13, marginBottom: 16 }}>{message}</p> : null}

        <button type="submit" className="vc-btn vc-btn-primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <Link to="/" className="vc-btn" style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>
          Cancel
        </Link>
      </form>
    </div>
  );
}
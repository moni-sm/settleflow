'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ACCOUNTS = {
  admin: { email: 'ops@settleflow.dev', password: 'demo1234', redirect: '/dashboard' },
  user: { email: 'player@settleflow.dev', password: 'demo1234', redirect: '/checkout' },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const router = useRouter();

  function fillDemo(role: 'admin' | 'user') {
    setEmail(ACCOUNTS[role].email);
    setPassword(ACCOUNTS[role].password);
    setError(false);
  }

  function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    const match = Object.values(ACCOUNTS).find(
      (a) => a.email.toLowerCase() === cleanEmail.toLowerCase() && a.password === password
    );

    if (match) {
      setError(false);
      setSignedIn(true);
      setTimeout(() => {
        router.push(match.redirect);
      }, 1000);
    } else {
      setError(true);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: 'var(--surface-2)',
          border: '0.5px solid var(--border)',
          borderRadius: '16px',
          padding: '1.75rem',
        }}
      >
        {!signedIn ? (
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
              SettleFlow
            </p>
            <h1 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 1.5rem' }}>Sign in to dashboard</h1>

            {error && (
              <div
                style={{
                  background: 'var(--bg-danger)',
                  color: 'var(--text-danger)',
                  fontSize: '13px',
                  borderRadius: 'var(--radius)',
                  padding: '8px 12px',
                  marginBottom: '1rem',
                }}
              >
                Invalid email or password
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={{
                    width: '100%',
                    background: 'var(--surface-1)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '0.65rem 0.9rem',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: 'var(--surface-1)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '0.65rem 0.9rem',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  padding: '0.85rem',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '1.25rem' }}>
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '0.5px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.75rem 0.9rem',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    marginBottom: '6px',
                  }}
                >
                  Admin
                </span>
                <p style={{ margin: '0 0 4px', fontWeight: 500, color: 'var(--text-primary)' }}>Demo credentials</p>
                email: <code style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)', borderRadius: '4px', padding: '1px 4px', fontSize: '11px' }}>ops@settleflow.dev</code><br />
                password: <code style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)', borderRadius: '4px', padding: '1px 4px', fontSize: '11px' }}>demo1234</code><br />
                <span
                  onClick={() => fillDemo('admin')}
                  style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--accent)', display: 'inline-block', marginTop: '4px' }}
                >
                  Fill in automatically
                </span>
              </div>

              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '0.5px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.75rem 0.9rem',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    marginBottom: '6px',
                  }}
                >
                  User
                </span>
                <p style={{ margin: '0 0 4px', fontWeight: 500, color: 'var(--text-primary)' }}>Demo credentials</p>
                email: <code style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)', borderRadius: '4px', padding: '1px 4px', fontSize: '11px' }}>player@settleflow.dev</code><br />
                password: <code style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)', borderRadius: '4px', padding: '1px 4px', fontSize: '11px' }}>demo1234</code><br />
                <span
                  onClick={() => fillDemo('user')}
                  style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--accent)', display: 'inline-block', marginTop: '4px' }}
                >
                  Fill in automatically
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '0.75rem', color: 'var(--accent)' }}>&#10003;</div>
            <h2 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 4px' }}>Signed in</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Redirecting to the destination&hellip;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

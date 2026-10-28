import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import logoImg from '../../assets/harvest_logo.jpg';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage({ onNavigateRegister }) {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      loginUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '32px 32px 24px',
            textAlign: 'center',
            borderBottom: '1px solid var(--border-light)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <img
            src={logoImg}
            alt="Harvest International School Logo"
            style={{
              width: '84px',
              height: '84px',
              objectFit: 'contain',
              margin: '0 auto 14px',
              display: 'block',
            }}
          />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.4px' }}>
            School AssetHub
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
            Harvest International School
          </p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Education Beyond Classrooms • IT Management Portal
          </span>
        </div>

        {/* Form Body */}
        <div style={{ padding: '28px 32px' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'var(--crimson-light)',
                border: '1px solid #ffcdd2',
                color: 'var(--crimson)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                marginBottom: '20px',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">School Email</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="admin@harvest.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-light)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '14px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In to Campus AssetHub'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Demo Quick Credentials:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="action-btn-sm"
                style={{ flex: 1, justifyContent: 'center', padding: '7px' }}
                onClick={() => handleQuickDemo('admin@harvest.edu', 'Admin123!')}
              >
                <ShieldCheck size={14} color="var(--primary)" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                className="action-btn-sm"
                style={{ flex: 1, justifyContent: 'center', padding: '7px' }}
                onClick={() => handleQuickDemo('sarah.jenkins@harvest.edu', 'Staff123!')}
              >
                <UserCheck size={14} color="var(--secondary)" />
                <span>Staff Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer switch to Registration */}
        <div
          style={{
            padding: '16px 32px',
            background: '#f8fafc',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          New faculty or staff member?{' '}
          <button
            onClick={onNavigateRegister}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Create Staff Account
          </button>
        </div>
      </div>
    </div>
  );
}

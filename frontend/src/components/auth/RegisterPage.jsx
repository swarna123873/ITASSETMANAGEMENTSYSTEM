import React, { useState } from 'react';
import { Mail, Lock, User, Building, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import logoImg from '../../assets/harvest_logo.jpg';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage({ onNavigateLogin }) {
  const { loginUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    department: 'Science Dept',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side checks
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please provide a valid school email address.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess('Registered successfully! Please log in with your credentials.');
      setTimeout(() => {
        onNavigateLogin();
      }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
          maxWidth: '480px',
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
            padding: '28px 32px 20px',
            textAlign: 'center',
            borderBottom: '1px solid var(--border-light)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <img
            src={logoImg}
            alt="Harvest International School Logo"
            style={{
              width: '72px',
              height: '72px',
              objectFit: 'contain',
              margin: '0 auto 10px',
              display: 'block',
            }}
          />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
            Staff Account Registration
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>
            Harvest International School
          </p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Join the campus hardware management directory
          </span>
        </div>

        {/* Form Body */}
        <div style={{ padding: '26px 32px' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'var(--crimson-light)',
                border: '1px solid #ffcdd2',
                color: 'var(--crimson)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                />
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. David Miller"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">School Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                  />
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="david.m@harvest.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department *</label>
                <div style={{ position: 'relative' }}>
                  <Building
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                  />
                  <select
                    name="department"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="Science Dept">Science Dept</option>
                    <option value="Maths Dept">Maths Dept</option>
                    <option value="English Dept">English Dept</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Administration">Administration</option>
                    <option value="Library">Library</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password (min 8 characters) *</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                />
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '14px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Complete Staff Registration'}
            </button>
          </form>

          {/* Security Notice */}
          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              background: '#f8fafc',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            🔒 <strong>Access Control Policy:</strong> Newly registered accounts receive standard faculty/staff permissions. Administrative access is restricted and provisioned solely by authorized campus administrators.
          </div>
        </div>

        {/* Back to Login link */}
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
          Already have an account?{' '}
          <button
            onClick={onNavigateLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'underline',
            }}
          >
            <ArrowLeft size={13} />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

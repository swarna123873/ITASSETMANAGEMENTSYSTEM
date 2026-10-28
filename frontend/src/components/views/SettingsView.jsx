import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Palette,
  Users,
  Key,
  CheckCircle,
  AlertCircle,
  Lock,
  UserCheck,
  UserX,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SettingsView({ onOpenPasswordModal }) {
  const { isAdmin, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'roles'
  const [settings, setSettings] = useState({
    schoolName: '',
    tagline: '',
    primaryColor: '#2e7d32',
    secondaryColor: '#0288d1',
    accentColor: '#c62828',
    defaultAssetType: 'Laptop',
  });
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setSettings(d);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/users/', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
      }
    } catch (err) {
      console.error('Error fetching users for settings:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchSettings(), fetchUsers()]).finally(() => setIsLoading(false));
  }, [isAdmin]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to update settings.', 'error');
        return;
      }

      showNotice(d.message || 'Branding settings updated!', 'success');
    } catch (err) {
      showNotice('Network error updating settings.', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/auth/users/${userId}/role/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to update user role.', 'error');
        return;
      }

      showNotice(d.message, 'success');
      fetchUsers();
    } catch (err) {
      showNotice('Network error updating role.', 'error');
    }
  };

  return (
    <div className="view-content" style={{ padding: '24px 32px' }}>
      {message.text && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: message.type === 'error' ? 'var(--crimson-light)' : 'var(--primary-light)',
            color: message.type === 'error' ? 'var(--crimson)' : 'var(--primary)',
            border: `1px solid ${message.type === 'error' ? '#ffcdd2' : 'var(--primary-border)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 500,
          }}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
          System & Institutional Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          Manage Harvest International School branding, institutional defaults, user accounts, and role privileges.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('branding')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            border: activeTab === 'branding' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: activeTab === 'branding' ? 'var(--primary-light)' : '#ffffff',
            color: activeTab === 'branding' ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Palette size={15} />
          <span>School Branding & Defaults</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              border: activeTab === 'roles' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              backgroundColor: activeTab === 'roles' ? 'var(--primary-light)' : '#ffffff',
              color: activeTab === 'roles' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Shield size={15} />
            <span>User Accounts & Role Permissions ({users.length})</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'branding' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Branding Form */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
              Institutional Identity
            </h2>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">School Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.schoolName}
                  onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">School Tagline</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Primary Color Theme</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      disabled={!isAdmin}
                      style={{ width: '40px', height: '38px', padding: 0, border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Asset Type</label>
                  <select
                    className="form-control"
                    value={settings.defaultAssetType}
                    onChange={(e) => setSettings({ ...settings, defaultAssetType: e.target.value })}
                    disabled={!isAdmin}
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Phone">Phone</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {isAdmin && (
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                  Save Branding Configuration
                </button>
              )}
            </form>
          </div>

          {/* Account Security Quick Action */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={17} style={{ color: 'var(--secondary)' }} />
                <span>Account Password & Credentials</span>
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Signed in as: <strong>{currentUser?.email}</strong> (Role: {currentUser?.role})
              </p>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                You can change your access password at any time. Passwords must be at least 8 characters long and are securely hashed using PBKDF2.
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={onOpenPasswordModal}
              style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}
            >
              <Lock size={14} />
              <span>Change Account Password</span>
            </button>
          </div>
        </div>
      )}

      {/* Roles & Users Administration */}
      {activeTab === 'roles' && isAdmin && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>USER</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>EMAIL</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>DEPARTMENT</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>CURRENT ROLE</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>ROLE ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfcfe')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                        {u.name} {isSelf && <span style={{ fontSize: '11px', color: 'var(--primary)' }}>(You)</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Joined: {u.dateJoined}</div>
                    </td>

                    <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--secondary)' }}>
                      {u.email}
                    </td>

                    <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {u.department || 'Campus Wide'}
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: u.role === 'ADMIN' ? '#e8f5e9' : '#f1f5f9',
                          color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {u.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      {isSelf ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                          Current Session
                        </span>
                      ) : u.role === 'STAFF' ? (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '5px 10px', color: 'var(--primary)', fontWeight: 600 }}
                          onClick={() => handleRoleChange(u.id, 'ADMIN')}
                        >
                          Promote to Admin
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '5px 10px', color: 'var(--crimson)', fontWeight: 600 }}
                          onClick={() => handleRoleChange(u.id, 'STAFF')}
                        >
                          Revoke Admin
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

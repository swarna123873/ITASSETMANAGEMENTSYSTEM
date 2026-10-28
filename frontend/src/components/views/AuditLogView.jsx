import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  User,
  Filter,
  Layers,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/audit/?';
      if (moduleFilter !== 'ALL') url += `module=${encodeURIComponent(moduleFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, search]);

  const getActionBadge = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('CREATE') || t.includes('REGISTER') || t.includes('ASSIGN')) {
      return (
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#e8f5e9', color: 'var(--primary)' }}>
          {type}
        </span>
      );
    }
    if (t.includes('RETURN') || t.includes('COMPLETE')) {
      return (
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: 'var(--secondary)' }}>
          {type}
        </span>
      );
    }
    if (t.includes('DELETE') || t.includes('LOGOUT') || t.includes('REPAIR')) {
      return (
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: 'var(--crimson)' }}>
          {type}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)' }}>
        {type}
      </span>
    );
  };

  const modules = ['ALL', 'Auth', 'Assets', 'Staff', 'Assignments', 'Repairs', 'Locations'];

  return (
    <div className="view-content" style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
          Activity Log & Audit Trail
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          Immutable institutional audit trail of user sessions, hardware changes, allocations, and administrative events.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search description, user email, action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setModuleFilter(m)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                border: moduleFilter === m ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: moduleFilter === m ? 'var(--primary-light)' : '#ffffff',
                color: moduleFilter === m ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {m === 'ALL' ? 'All Modules' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TIMESTAMP</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ACTION</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ACTOR</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>MODULE</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No security events found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfcfe')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={12} style={{ color: 'var(--text-light)' }} />
                      {log.timestamp}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {getActionBadge(log.actionType)}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={13} style={{ color: 'var(--secondary)' }} />
                      {log.actor.name || log.actor.username}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {log.module}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-main)', maxWidth: '450px' }}>
                    {log.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

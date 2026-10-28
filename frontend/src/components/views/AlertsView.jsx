import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Wrench,
  RotateCcw,
  CheckCircle,
  Calendar,
  User,
  Tag,
  MapPin,
  ExternalLink
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function AlertsView({ onSelectTab }) {
  const { isAdmin } = useAuth();
  const [alerts, setAlerts] = useState({
    totalAlerts: 0,
    overdueReturns: [],
    overdueCount: 0,
    warrantyAlerts: [],
    warrantyCount: 0,
    activeRepairs: [],
    repairCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'WARRANTY' | 'REPAIRS'

  // Return modal for overdue items
  const [returnAssignment, setReturnAssignment] = useState(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [notice, setNotice] = useState('');

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/alerts/', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setAlerts(d);
      }
    } catch (err) {
      console.error('Error fetching alerts hub:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnAssignment) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/assignments/${returnAssignment.assignmentId}/return/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          returnDate,
          notes: returnNotes,
        }),
      });

      const d = await res.json();
      if (res.ok) {
        setNotice(d.message || 'Overdue asset returned successfully!');
        setReturnAssignment(null);
        fetchAlerts();
        setTimeout(() => setNotice(''), 4000);
      }
    } catch (err) {
      console.error('Error returning overdue asset:', err);
    }
  };

  return (
    <div className="view-content" style={{ padding: '24px 32px' }}>
      {notice && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            border: '1px solid var(--primary-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 500,
          }}
        >
          <CheckCircle size={18} />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
          Alerts & Operational Notifications
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          Centralized priority monitoring for overdue returns, upcoming warranty expirations, and open repair tickets.
        </p>
      </div>

      {/* Category Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div
          className="card"
          onClick={() => setActiveCategory(activeCategory === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
            border: activeCategory === 'OVERDUE' ? '2px solid var(--crimson)' : '1px solid var(--border-color)',
            backgroundColor: activeCategory === 'OVERDUE' ? '#fff5f5' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--crimson)' }}>Overdue Hardware</span>
            <AlertTriangle size={18} style={{ color: 'var(--crimson)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>{alerts.overdueCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Checkouts past return date</div>
        </div>

        <div
          className="card"
          onClick={() => setActiveCategory(activeCategory === 'WARRANTY' ? 'ALL' : 'WARRANTY')}
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
            border: activeCategory === 'WARRANTY' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
            backgroundColor: activeCategory === 'WARRANTY' ? '#fffbeb' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#b45309' }}>Warranty Attention</span>
            <ShieldAlert size={18} style={{ color: '#b45309' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>{alerts.warrantyCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Expiring within 60 days</div>
        </div>

        <div
          className="card"
          onClick={() => setActiveCategory(activeCategory === 'REPAIRS' ? 'ALL' : 'REPAIRS')}
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
            border: activeCategory === 'REPAIRS' ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
            backgroundColor: activeCategory === 'REPAIRS' ? '#f0f9ff' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)' }}>Active Repairs</span>
            <Wrench size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>{alerts.repairCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Pending workshop resolution</div>
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading campus alerts...
        </div>
      ) : alerts.totalAlerts === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckCircle size={36} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            All Operations Healthy!
          </h3>
          <p style={{ margin: 0, fontSize: '13px' }}>
            No overdue returns, expiring warranties, or pending maintenance tickets right now.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. Overdue Returns Section */}
          {(activeCategory === 'ALL' || activeCategory === 'OVERDUE') && alerts.overdueReturns.length > 0 && (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--crimson)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle size={18} />
                <span>Overdue Equipment Returns ({alerts.overdueReturns.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.overdueReturns.map((item) => (
                  <div
                    key={item.assignmentId}
                    className="card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '4px solid var(--crimson)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', padding: '2px 6px', background: '#ffebee', color: 'var(--crimson)', borderRadius: '4px' }}>
                          {item.asset.tag}
                        </span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{item.asset.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({item.asset.type})</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Held by: <strong>{item.holder.name}</strong> ({item.holder.department}) • Due since: <strong>{item.expectedReturnDate}</strong>
                        <span style={{ color: 'var(--crimson)', fontWeight: 700, marginLeft: '6px' }}>({item.daysOverdue} days overdue)</span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          setReturnAssignment(item);
                          setReturnDate(new Date().toISOString().split('T')[0]);
                          setReturnNotes('');
                        }}
                      >
                        <RotateCcw size={13} />
                        Process Return
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Warranty Expirations */}
          {(activeCategory === 'ALL' || activeCategory === 'WARRANTY') && alerts.warrantyAlerts.length > 0 && (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ShieldAlert size={18} />
                <span>Warranty Attention Needed ({alerts.warrantyAlerts.length})</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                {alerts.warrantyAlerts.map((w) => (
                  <div
                    key={w.id}
                    className="card"
                    style={{
                      padding: '16px',
                      borderLeft: '4px solid #f59e0b',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: 'var(--primary)' }}>
                        {w.tag}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: w.isExpired ? 'var(--crimson)' : '#b45309' }}>
                        {w.isExpired ? 'EXPIRED' : `${w.daysRemaining} days left`}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', marginBottom: '6px' }}>
                      {w.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Warranty Date: <strong>{w.warrantyExpiry}</strong> • {w.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Pending Repairs */}
          {(activeCategory === 'ALL' || activeCategory === 'REPAIRS') && alerts.activeRepairs.length > 0 && (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Wrench size={18} />
                <span>Open Maintenance Tickets ({alerts.activeRepairs.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.activeRepairs.map((r) => (
                  <div
                    key={r.id}
                    className="card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '4px solid var(--secondary)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', padding: '2px 6px', background: '#e0f2fe', color: 'var(--secondary)', borderRadius: '4px' }}>
                          {r.assetTag}
                        </span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{r.assetName}</strong>
                        <span className="badge badge-repair">{r.status}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Fault: <strong>{r.fault}</strong> • Serviced by: {r.provider} • Started on: {r.startDate}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => onSelectTab && onSelectTab('repairs')}
                    >
                      View in Repairs →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Return Modal */}
      {returnAssignment && (
        <Modal
          isOpen={true}
          title={`Return Overdue Asset: ${returnAssignment.asset.tag}`}
          onClose={() => setReturnAssignment(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setReturnAssignment(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleReturnSubmit}>
                Confirm Return & Clear Alert
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Asset: <strong>{returnAssignment.asset.name}</strong> [{returnAssignment.asset.tag}]
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Faculty Holder: <strong>{returnAssignment.holder.name}</strong>
            </div>
          </div>

          <form onSubmit={handleReturnSubmit}>
            <div className="form-group">
              <label className="form-label">Return Date *</label>
              <input
                type="date"
                className="form-control"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Return Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Reason for late return, condition inspection..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

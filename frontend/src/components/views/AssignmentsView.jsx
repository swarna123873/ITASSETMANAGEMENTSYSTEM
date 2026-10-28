import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Tag,
  Laptop,
  Calendar,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function AssignmentsView() {
  const { isAdmin } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('Active'); // 'Active' | 'Returned' | 'ALL'
  const [message, setMessage] = useState({ text: '', type: '' });

  // Issue modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueData, setIssueData] = useState({
    assetId: '',
    staffId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: '',
  });

  // Return modal
  const [returnAssignment, setReturnAssignment] = useState(null);
  const [returnData, setReturnData] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/assignments/?';
      if (statusTab !== 'ALL') url += `status=${statusTab}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setAssignments(d.assignments || []);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [assetRes, staffRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/assets/?status=Available', { credentials: 'include' }),
        fetch('http://127.0.0.1:8000/api/staff/', { credentials: 'include' }),
      ]);
      if (assetRes.ok) {
        const ad = await assetRes.json();
        setAvailableAssets(ad.assets || []);
      }
      if (staffRes.ok) {
        const sd = await staffRes.json();
        setStaffList(sd.staff || []);
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [statusTab]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const openIssueModal = () => {
    fetchDropdowns();
    setIssueData({
      assetId: availableAssets[0]?.id || '',
      staffId: staffList[0]?.id || '',
      issueDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      notes: '',
    });
    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueData.assetId || !issueData.staffId) {
      showNotice('Please select both an available asset and a staff member.', 'error');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/assignments/issue/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(issueData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to issue asset.', 'error');
        return;
      }

      showNotice(d.message || 'Asset issued successfully!', 'success');
      setIsIssueModalOpen(false);
      fetchAssignments();
      fetchDropdowns();
    } catch (err) {
      showNotice('Network error issuing asset.', 'error');
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnAssignment) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/assignments/${returnAssignment.id}/return/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(returnData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to return asset.', 'error');
        return;
      }

      showNotice(d.message || 'Asset returned successfully!', 'success');
      setReturnAssignment(null);
      fetchAssignments();
      fetchDropdowns();
    } catch (err) {
      showNotice('Network error recording return.', 'error');
    }
  };

  return (
    <div className="view-content" style={{ padding: '24px 32px' }}>
      {/* Notice Banner */}
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

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            Hardware Assignments & Returns
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Allocate campus equipment with single-holder rule enforcement, return workflows and overdue tracking.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openIssueModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Issue Hardware to Staff</span>
          </button>
        )}
      </div>

      {/* Tabs & Overview Bar */}
      <div
        className="card"
        style={{
          padding: '12px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'Active', label: 'Active Checkouts' },
            { id: 'Returned', label: 'Returned Archive' },
            { id: 'ALL', label: 'All Lifecycle History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                border: statusTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: statusTab === tab.id ? 'var(--primary-light)' : '#ffffff',
                color: statusTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Available for Issue: <strong style={{ color: 'var(--primary)' }}>{availableAssets.length}</strong> devices
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>EQUIPMENT DETAILS</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ALLOCATED FACULTY</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ISSUE DATE</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>EXPECTED RETURN</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>STATUS</th>
              {isAdmin && <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading assignment records...
                </td>
              </tr>
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No allocation records found in this view.
                </td>
              </tr>
            ) : (
              assignments.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfcfe')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                      {item.asset.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#e8f5e9',
                          color: 'var(--primary)',
                        }}
                      >
                        {item.asset.tag}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {item.asset.type}</span>
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} style={{ color: 'var(--secondary)' }} />
                      {item.staff.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.staff.department} • {item.staff.email}
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} style={{ color: 'var(--text-light)' }} />
                      {item.issueDate}
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px' }}>
                    {item.expectedReturnDate ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: item.isOverdue ? 'var(--crimson)' : 'var(--text-secondary)',
                          fontWeight: item.isOverdue ? 700 : 500,
                        }}
                      >
                        {item.isOverdue && <AlertTriangle size={13} />}
                        {item.expectedReturnDate}
                        {item.isOverdue && ' (Overdue)'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-light)' }}>Permanent Allocation</span>
                    )}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    {item.status === 'Active' ? (
                      <Badge status={item.isOverdue ? 'Overdue' : 'Assigned'} text={item.isOverdue ? 'Overdue' : 'Active'} />
                    ) : (
                      <Badge status="Available" text="Returned" />
                    )}
                  </td>

                  {isAdmin && (
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      {item.status === 'Active' ? (
                        <button
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--primary)',
                            fontWeight: 600,
                          }}
                          onClick={() => {
                            setReturnAssignment(item);
                            setReturnData({
                              returnDate: new Date().toISOString().split('T')[0],
                              notes: '',
                            });
                          }}
                        >
                          <RotateCcw size={13} />
                          Return Hardware
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                          Returned on {item.actualReturnDate}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Asset Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        title="Issue Hardware to Staff Member"
        onClose={() => setIsIssueModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleIssueSubmit}>
              Confirm Allocation
            </button>
          </>
        }
      >
        <form onSubmit={handleIssueSubmit}>
          <div className="form-group">
            <label className="form-label">Select Available Asset *</label>
            {availableAssets.length === 0 ? (
              <div style={{ padding: '10px', background: 'var(--crimson-light)', color: 'var(--crimson)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                No hardware currently marked as Available. Register a new asset or process returns first.
              </div>
            ) : (
              <select
                className="form-control"
                value={issueData.assetId}
                onChange={(e) => setIssueData({ ...issueData, assetId: e.target.value })}
                required
              >
                <option value="">-- Choose Hardware to Allocate --</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name} ({a.type})
                  </option>
                ))}
              </select>
            )}
            <small style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Only devices currently in <strong>Available</strong> status can be issued.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Assign to Staff Member *</label>
            <select
              className="form-control"
              value={issueData.staffId}
              onChange={(e) => setIssueData({ ...issueData, staffId: e.target.value })}
              required
            >
              <option value="">-- Choose Faculty / Staff Member --</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department}) - {s.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Issue Date *</label>
              <input
                type="date"
                className="form-control"
                value={issueData.issueDate}
                onChange={(e) => setIssueData({ ...issueData, issueDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Return Date</label>
              <input
                type="date"
                className="form-control"
                value={issueData.expectedReturnDate}
                onChange={(e) => setIssueData({ ...issueData, expectedReturnDate: e.target.value })}
              />
              <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Leave blank if permanent allocation.</small>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Checkout Notes / Reason</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Allocated for semester teaching & exam evaluation..."
              value={issueData.notes}
              onChange={(e) => setIssueData({ ...issueData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Return Asset Modal */}
      {returnAssignment && (
        <Modal
          isOpen={true}
          title={`Process Return: ${returnAssignment.asset.tag}`}
          onClose={() => setReturnAssignment(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setReturnAssignment(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleReturnSubmit}>
                Confirm Return & Revert to Available
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Returning device: <strong>{returnAssignment.asset.name}</strong> [{returnAssignment.asset.tag}]
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Allocated to: <strong>{returnAssignment.staff.name}</strong> ({returnAssignment.staff.department})
            </div>
          </div>

          <form onSubmit={handleReturnSubmit}>
            <div className="form-group">
              <label className="form-label">Actual Return Date *</label>
              <input
                type="date"
                className="form-control"
                value={returnData.returnDate}
                onChange={(e) => setReturnData({ ...returnData, returnDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Device Inspection Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Check physical condition, charger returned, screen status, etc."
                value={returnData.notes}
                onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

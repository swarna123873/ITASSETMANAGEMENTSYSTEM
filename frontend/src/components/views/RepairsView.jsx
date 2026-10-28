import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Tag,
  Building,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function RepairsView() {
  const { isAdmin } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [updatingRepair, setUpdatingRepair] = useState(null);

  const [logFormData, setLogFormData] = useState({
    assetId: '',
    faultDescription: '',
    serviceProviderId: '',
    repairCost: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [updateFormData, setUpdateFormData] = useState({
    status: 'In Progress',
    repairCost: '',
    completionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchRepairs = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/repairs/?';
      if (statusFilter !== 'ALL') url += `status=${encodeURIComponent(statusFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setRepairs(d.repairs || []);
      }
    } catch (err) {
      console.error('Error fetching repairs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [assetRes, supRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/assets/', { credentials: 'include' }),
        fetch('http://127.0.0.1:8000/api/suppliers/', { credentials: 'include' }),
      ]);
      if (assetRes.ok) {
        const ad = await assetRes.json();
        setAssets(ad.assets || []);
      }
      if (supRes.ok) {
        const sd = await supRes.json();
        setSuppliers(sd.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [statusFilter, search]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const openLogModal = () => {
    fetchDropdowns();
    setLogFormData({
      assetId: assets[0]?.id || '',
      faultDescription: '',
      serviceProviderId: suppliers[0]?.id || '',
      repairCost: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsLogModalOpen(true);
  };

  const openUpdateModal = (repair) => {
    setUpdatingRepair(repair);
    setUpdateFormData({
      status: repair.status === 'Requested' ? 'In Progress' : 'Completed',
      repairCost: repair.repairCost || '',
      completionDate: new Date().toISOString().split('T')[0],
      notes: repair.notes || '',
    });
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!logFormData.assetId || !logFormData.faultDescription.trim()) {
      showNotice('Please select an asset and describe the defect.', 'error');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/repairs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(logFormData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to log maintenance ticket.', 'error');
        return;
      }

      showNotice(d.message || 'Maintenance ticket created successfully!', 'success');
      setIsLogModalOpen(false);
      fetchRepairs();
    } catch (err) {
      showNotice('Network error logging repair.', 'error');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updatingRepair) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/repairs/${updatingRepair.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateFormData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to update repair status.', 'error');
        return;
      }

      showNotice(d.message || 'Repair ticket updated successfully!', 'success');
      setUpdatingRepair(null);
      fetchRepairs();
    } catch (err) {
      showNotice('Network error updating repair.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Requested') return <span className="badge badge-overdue">Requested</span>;
    if (status === 'In Progress') return <span className="badge badge-repair">In Progress</span>;
    if (status === 'Completed') return <span className="badge badge-available">Completed</span>;
    return <span className="badge badge-muted">{status}</span>;
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
            Maintenance & Hardware Repairs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Track equipment defects, maintenance stages, repair costs, and restoration to Available status.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openLogModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Log Repair Ticket</span>
          </button>
        )}
      </div>

      {/* Tabs & Search */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
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
            placeholder="Search by tag, device name, or defect issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Tickets' },
            { id: 'Requested', label: 'Requested' },
            { id: 'In Progress', label: 'In Progress' },
            { id: 'Completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                border: statusFilter === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: statusFilter === tab.id ? 'var(--primary-light)' : '#ffffff',
                color: statusFilter === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Repairs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TICKET / HARDWARE</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>FAULT DESCRIPTION</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SERVICE PROVIDER</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>DATES</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>COST</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>STATUS</th>
              {isAdmin && <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading maintenance records...
                </td>
              </tr>
            ) : repairs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No repair tickets found matching criteria.
                </td>
              </tr>
            ) : (
              repairs.map((r) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfcfe')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                      {r.asset.name}
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
                        {r.asset.tag}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• Ticket #{r.id}</span>
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-main)', maxWidth: '260px' }}>
                    {r.faultDescription}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {r.serviceProvider ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Building size={13} style={{ color: 'var(--text-light)' }} />
                        {r.serviceProvider.name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-light)' }}>Internal IT</span>
                    )}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div>Started: {r.startDate}</div>
                    {r.completionDate && <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Resolved: {r.completionDate}</div>}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {r.repairCost > 0 ? `₹${r.repairCost.toLocaleString()}` : 'Free / Warranty'}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    {getStatusBadge(r.status)}
                  </td>

                  {isAdmin && (
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      {r.status !== 'Completed' && r.status !== 'Cancelled' ? (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '5px 10px', color: 'var(--primary)', fontWeight: 600 }}
                          onClick={() => openUpdateModal(r)}
                        >
                          Update Status
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Archived</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Ticket Modal */}
      <Modal
        isOpen={isLogModalOpen}
        title="Log Hardware Maintenance Ticket"
        onClose={() => setIsLogModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleLogSubmit}>
              Create Repair Ticket
            </button>
          </>
        }
      >
        <form onSubmit={handleLogSubmit}>
          <div className="form-group">
            <label className="form-label">Select Equipment *</label>
            <select
              className="form-control"
              value={logFormData.assetId}
              onChange={(e) => setLogFormData({ ...logFormData, assetId: e.target.value })}
              required
            >
              <option value="">-- Choose Asset Requiring Repair --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.tag}] {a.name} ({a.type}) - Current: {a.status}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fault / Defect Description *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Display backlight failing, keyboard keys sticky after spill..."
              value={logFormData.faultDescription}
              onChange={(e) => setLogFormData({ ...logFormData, faultDescription: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Service Vendor / Partner</label>
              <select
                className="form-control"
                value={logFormData.serviceProviderId}
                onChange={(e) => setLogFormData({ ...logFormData, serviceProviderId: e.target.value })}
              >
                <option value="">Internal Campus IT Workshop</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Repair Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 3500"
                value={logFormData.repairCost}
                onChange={(e) => setLogFormData({ ...logFormData, repairCost: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Additional Repair Notes</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Courier tracking, RMA reference number, etc."
              value={logFormData.notes}
              onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Update / Complete Repair Modal */}
      {updatingRepair && (
        <Modal
          isOpen={true}
          title={`Update Repair Ticket #${updatingRepair.id}`}
          onClose={() => setUpdatingRepair(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setUpdatingRepair(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateSubmit}>
                Save & Update Asset Status
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Asset: <strong>{updatingRepair.asset.name}</strong> [{updatingRepair.asset.tag}]
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Fault: {updatingRepair.faultDescription}
            </div>
          </div>

          <form onSubmit={handleUpdateSubmit}>
            <div className="form-group">
              <label className="form-label">New Status *</label>
              <select
                className="form-control"
                value={updateFormData.status}
                onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
              >
                <option value="In Progress">In Progress (At Workshop)</option>
                <option value="Completed">Completed (Restores Asset to Available)</option>
                <option value="Cancelled">Cancelled (Restores Asset to Available)</option>
              </select>
              <small style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Selecting <strong>Completed</strong> automatically updates the hardware status back to <strong>Available</strong> for checkout.
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Final Repair Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={updateFormData.repairCost}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, repairCost: e.target.value })}
                />
              </div>

              {updateFormData.status === 'Completed' && (
                <div className="form-group">
                  <label className="form-label">Completion Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={updateFormData.completionDate}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, completionDate: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Resolution Summary / Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="What was fixed, replaced parts, warranty notes..."
                value={updateFormData.notes}
                onChange={(e) => setUpdateFormData({ ...updateFormData, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

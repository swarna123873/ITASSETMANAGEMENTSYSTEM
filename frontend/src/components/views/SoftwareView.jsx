import React, { useState, useEffect } from 'react';
import {
  Key,
  Search,
  Plus,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  UserPlus,
  UserMinus,
  Edit2,
  Trash2,
  Lock
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function SoftwareView() {
  const { isAdmin } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    publisher: '',
    licenseKey: '',
    purchasedSeats: 5,
    renewalCost: '',
    purchaseDate: '',
    expirationDate: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchLicenses = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/licenses/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setLicenses(d.licenses || []);
      }
    } catch (err) {
      console.error('Error fetching licenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [search]);

  const openCreateModal = () => {
    setEditingLicense(null);
    setFormData({
      name: '',
      publisher: '',
      licenseKey: '',
      purchasedSeats: 10,
      renewalCost: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      expirationDate: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lic) => {
    setEditingLicense(lic);
    setFormData({
      name: lic.name,
      publisher: lic.publisher,
      licenseKey: '',
      purchasedSeats: lic.purchasedSeats,
      renewalCost: lic.renewalCost || '',
      purchaseDate: lic.purchaseDate || '',
      expirationDate: lic.expirationDate || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveLicense = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.publisher.trim()) {
      showNotice('Software title and publisher are required.', 'error');
      return;
    }

    try {
      const isEdit = !!editingLicense;
      const url = isEdit
        ? `http://127.0.0.1:8000/api/licenses/${editingLicense.id}/`
        : 'http://127.0.0.1:8000/api/licenses/';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to save license.', 'error');
        return;
      }

      showNotice(d.message || 'Software license saved!', 'success');
      setIsModalOpen(false);
      fetchLicenses();
    } catch (err) {
      showNotice('Network error saving license.', 'error');
    }
  };

  const handleSeatAction = async (lic, action) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/licenses/${lic.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to adjust seats.', 'error');
      } else {
        showNotice(`Seat ${action === 'allocate' ? 'allocated' : 'released'} successfully!`, 'success');
        fetchLicenses();
      }
    } catch (err) {
      showNotice('Network error adjusting seats.', 'error');
    }
  };

  const handleDelete = async (lic) => {
    if (!window.confirm(`Delete license record for '${lic.name}'?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/licenses/${lic.id}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to delete.', 'error');
      } else {
        showNotice(d.message, 'success');
        fetchLicenses();
      }
    } catch (err) {
      showNotice('Network error deleting license.', 'error');
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

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            Software Licenses & Digital Seats
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Manage campus software subscriptions, license keys, allocated faculty seats, and renewal schedules.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Register Software License</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search software title or publisher (e.g. Adobe, Microsoft, Zoom)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>
      </div>

      {/* Licenses Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SOFTWARE TITLE</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>LICENSE KEY (MASKED)</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SEAT UTILIZATION</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>EXPIRATION DATE</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ANNUAL RENEWAL</th>
              {isAdmin && <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>SEAT ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading software licenses...
                </td>
              </tr>
            ) : licenses.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No software licenses registered.
                </td>
              </tr>
            ) : (
              licenses.map((lic) => (
                <tr
                  key={lic.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfcfe')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{lic.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lic.publisher}</div>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '12px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        color: 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Lock size={11} />
                      {lic.keyMasked}
                    </span>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                        {lic.allocatedSeats} / {lic.purchasedSeats}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: lic.availableSeats > 0 ? '#e8f5e9' : '#fee2e2',
                          color: lic.availableSeats > 0 ? 'var(--primary)' : 'var(--crimson)',
                          fontWeight: 600,
                        }}
                      >
                        {lic.availableSeats} available
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {lic.expirationDate ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} style={{ color: 'var(--text-light)' }} />
                        {lic.expirationDate}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-light)' }}>Perpetual License</span>
                    )}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {lic.renewalCost > 0 ? `₹${lic.renewalCost.toLocaleString()}/yr` : 'Included'}
                  </td>

                  {isAdmin && (
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}
                          onClick={() => handleSeatAction(lic, 'allocate')}
                          disabled={lic.availableSeats === 0}
                          title="Allocate Seat"
                        >
                          <UserPlus size={13} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '11px', color: 'var(--crimson)', fontWeight: 600 }}
                          onClick={() => handleSeatAction(lic, 'deallocate')}
                          disabled={lic.allocatedSeats === 0}
                          title="Release Seat"
                        >
                          <UserMinus size={13} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px', color: 'var(--text-secondary)' }}
                          onClick={() => openEditModal(lic)}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px', color: 'var(--crimson)' }}
                          onClick={() => handleDelete(lic)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit License Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingLicense ? `Edit License: ${editingLicense.name}` : 'Register Software License'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveLicense}>
              Save License Record
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveLicense}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Software Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Adobe Creative Cloud Enterprise"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Publisher *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Adobe, Microsoft..."
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">License Key / Serial Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={formData.licenseKey}
              onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
            />
            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>License keys are automatically masked in the UI for safety.</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Purchased Seats *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.purchasedSeats}
                onChange={(e) => setFormData({ ...formData, purchasedSeats: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Annual Renewal Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 45000"
                value={formData.renewalCost}
                onChange={(e) => setFormData({ ...formData, renewalCost: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">License Expiration Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

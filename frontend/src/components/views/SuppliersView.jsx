import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Laptop
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function SuppliersView() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Hardware Vendor',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/suppliers/?';
      if (categoryFilter !== 'ALL') url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setSuppliers(d.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [categoryFilter, search]);

  const openCreateModal = () => {
    setEditingSup(null);
    setFormData({
      name: '',
      category: 'Hardware Vendor',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sup) => {
    setEditingSup(sup);
    setFormData({
      name: sup.name,
      category: sup.category,
      contactPerson: sup.contactPerson || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice('Supplier name is required.', 'error');
      return;
    }

    try {
      const isEdit = !!editingSup;
      const url = isEdit
        ? `http://127.0.0.1:8000/api/suppliers/${editingSup.id}/`
        : 'http://127.0.0.1:8000/api/suppliers/';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to save supplier.', 'error');
        return;
      }

      showNotice(d.message || 'Supplier record saved!', 'success');
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      showNotice('Network error saving supplier.', 'error');
    }
  };

  const handleDelete = async (sup) => {
    if (!window.confirm(`Delete supplier record '${sup.name}'?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/suppliers/${sup.id}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const d = await res.json();
      if (res.ok) {
        showNotice(d.message, 'success');
        fetchSuppliers();
      }
    } catch (err) {
      showNotice('Network error deleting supplier.', 'error');
    }
  };

  const categories = ['ALL', 'Hardware Vendor', 'Repair Provider', 'Software Reseller'];

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
            Suppliers & Service Vendors
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Directory of institutional hardware partners, authorized repair contractors, and software resellers.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Add Supplier / Vendor</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter */}
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
            placeholder="Search vendor name, contact person, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                border: categoryFilter === c ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: categoryFilter === c ? 'var(--primary-light)' : '#ffffff',
                color: categoryFilter === c ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {c === 'ALL' ? 'All Categories' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading suppliers directory...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No vendors found matching your filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                      {sup.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Contact: <strong>{sup.contactPerson || 'Vendor Desk'}</strong>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#e8f5e9',
                      color: 'var(--primary)',
                    }}
                  >
                    {sup.category}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', margin: '14px 0' }}>
                  {sup.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} style={{ color: 'var(--text-light)' }} />
                      <a href={`mailto:${sup.email}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
                        {sup.email}
                      </a>
                    </div>
                  )}
                  {sup.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} style={{ color: 'var(--text-light)' }} />
                      <span>{sup.phone}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MapPin size={14} style={{ color: 'var(--text-light)', marginTop: '2px' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Laptop size={13} style={{ color: 'var(--primary)' }} />
                  <span>
                    <strong>{sup.assetCount}</strong> hardware unit{sup.assetCount === 1 ? '' : 's'} supplied
                  </span>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '5px', color: 'var(--text-secondary)' }}
                      onClick={() => openEditModal(sup)}
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '5px', color: 'var(--crimson)' }}
                      onClick={() => handleDelete(sup)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingSup ? `Edit Vendor: ${editingSup.name}` : 'Register New Vendor / Partner'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveSupplier}>
              Save Vendor Record
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveSupplier}>
          <div className="form-group">
            <label className="form-label">Vendor / Company Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dell Commercial India"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Hardware Vendor">Hardware Vendor</option>
                <option value="Repair Provider">Authorized Repair Provider</option>
                <option value="Software Reseller">Software Reseller</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Key Contact Person</label>
              <input
                type="text"
                className="form-control"
                placeholder="Account Manager / Contact"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="orders@vendor.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Contact</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 80 1234 5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical / Dispatch Address</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Service center or distribution center address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

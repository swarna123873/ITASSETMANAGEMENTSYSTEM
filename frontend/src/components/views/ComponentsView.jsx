import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  Plus,
  Laptop,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Tag,
  Layers
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function ComponentsView() {
  const { isAdmin } = useAuth();
  const [components, setComponents] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'RAM',
    serialNumber: '',
    condition: 'Good',
    parentAssetId: '',
    notes: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchComponents = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/components/?';
      if (typeFilter !== 'ALL') url += `type=${encodeURIComponent(typeFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setComponents(d.components || []);
      }
    } catch (err) {
      console.error('Error fetching components:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/assets/', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setAssets(d.assets || []);
      }
    } catch (err) {
      console.error('Error fetching assets for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, [typeFilter, search]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const openCreateModal = () => {
    setEditingComp(null);
    setFormData({
      name: '',
      type: 'RAM',
      serialNumber: '',
      condition: 'Good',
      parentAssetId: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (comp) => {
    setEditingComp(comp);
    setFormData({
      name: comp.name,
      type: comp.type,
      serialNumber: comp.serialNumber || '',
      condition: comp.condition,
      parentAssetId: comp.parentAsset?.id || '',
      notes: comp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveComponent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice('Component name is required.', 'error');
      return;
    }

    try {
      const isEdit = !!editingComp;
      const url = isEdit
        ? `http://127.0.0.1:8000/api/components/${editingComp.id}/`
        : 'http://127.0.0.1:8000/api/components/';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to save component.', 'error');
        return;
      }

      showNotice(d.message || 'Component saved!', 'success');
      setIsModalOpen(false);
      fetchComponents();
    } catch (err) {
      showNotice('Network error saving component.', 'error');
    }
  };

  const handleDelete = async (comp) => {
    if (!window.confirm(`Delete component '${comp.name}'?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/components/${comp.id}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const d = await res.json();
      if (res.ok) {
        showNotice(d.message, 'success');
        fetchComponents();
      }
    } catch (err) {
      showNotice('Network error deleting component.', 'error');
    }
  };

  const types = ['ALL', 'RAM', 'SSD', 'Hard Drive', 'Graphics Card', 'Other'];

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
            Hardware Components & Modular Spares
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Catalog modular RAM, SSDs, GPUs, and replacement components linked to host devices or IT stock.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Add Hardware Component</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
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
            placeholder="Search component name, serial number, parent device..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                border: typeFilter === t ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: typeFilter === t ? 'var(--primary-light)' : '#ffffff',
                color: typeFilter === t ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Components Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>COMPONENT NAME</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TYPE</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SERIAL NUMBER</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>PARENT DEVICE</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>CONDITION</th>
              {isAdmin && <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading modular components...
                </td>
              </tr>
            ) : components.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No components registered matching current filter.
                </td>
              </tr>
            ) : (
              components.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfcfe')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{c.name}</div>
                    {c.notes && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.notes}</div>}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#e0f2fe',
                        color: 'var(--secondary)',
                      }}
                    >
                      {c.type}
                    </span>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {c.serialNumber || '-'}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    {c.parentAsset ? (
                      <div>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#e8f5e9',
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Laptop size={11} />
                          {c.parentAsset.tag}
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '2px' }}>
                          {c.parentAsset.name}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                        Unattached Spare (In Store)
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span className={`badge ${c.condition === 'Good' ? 'badge-available' : 'badge-repair'}`}>
                      {c.condition}
                    </span>
                  </td>

                  {isAdmin && (
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px', color: 'var(--text-secondary)' }}
                          onClick={() => openEditModal(c)}
                          title="Edit Component"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px', color: 'var(--crimson)' }}
                          onClick={() => handleDelete(c)}
                          title="Delete Component"
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

      {/* Add / Edit Component Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingComp ? `Edit Component: ${editingComp.name}` : 'Register Hardware Component'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveComponent}>
              Save Component Record
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveComponent}>
          <div className="form-group">
            <label className="form-label">Component Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Samsung 980 Pro 1TB NVMe SSD"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Component Category *</label>
              <select
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="RAM">RAM / Memory</option>
                <option value="SSD">SSD (Solid State Drive)</option>
                <option value="Hard Drive">Hard Drive (HDD)</option>
                <option value="Graphics Card">Graphics Card (GPU)</option>
                <option value="Other">Power Supply / Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Condition</label>
              <select
                className="form-control"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              >
                <option value="Good">Good / Operational</option>
                <option value="Fair">Fair / Tested</option>
                <option value="Faulty">Faulty / Under Repair</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Component S/N"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Installed in Host Device</label>
              <select
                className="form-control"
                value={formData.parentAssetId}
                onChange={(e) => setFormData({ ...formData, parentAssetId: e.target.value })}
              >
                <option value="">None (Unattached Spare in IT Store)</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Technical Notes / Specs</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Clock speed, generation, capacity details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

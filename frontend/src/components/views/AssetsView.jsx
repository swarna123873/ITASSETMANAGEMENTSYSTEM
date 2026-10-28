import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Tag,
  MapPin,
  Building,
  User,
  X
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function AssetsView({ onSelectTab, onIssueAsset }) {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    type: 'Laptop',
    serialNumber: '',
    brand: '',
    model: '',
    status: 'Available',
    locationId: '',
    supplierId: '',
    purchasePrice: '',
    purchaseDate: '',
    warrantyExpiry: '',
    notes: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/assets/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (typeFilter !== 'ALL') url += `type=${encodeURIComponent(typeFilter)}&`;
      if (statusFilter !== 'ALL') url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuxiliary = async () => {
    try {
      const [locRes, supRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/locations/', { credentials: 'include' }),
        fetch('http://127.0.0.1:8000/api/suppliers/', { credentials: 'include' }),
      ]);
      if (locRes.ok) {
        const d = await locRes.json();
        setLocations(d.locations || []);
      }
      if (supRes.ok) {
        const d = await supRes.json();
        setSuppliers(d.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching auxiliary data:', err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchAuxiliary();
  }, []);

  const openCreateModal = () => {
    fetchAuxiliary();
    setEditingAsset(null);
    setFormData({
      name: '',
      tag: `HAR-${Date.now().toString().slice(-4)}`,
      type: 'Laptop',
      serialNumber: '',
      brand: '',
      model: '',
      status: 'Available',
      locationId: locations[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      purchasePrice: '',
      purchaseDate: '',
      warrantyExpiry: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      tag: asset.tag,
      type: asset.type,
      serialNumber: asset.serialNumber || '',
      brand: asset.brand || '',
      model: asset.model || '',
      status: asset.status,
      locationId: asset.location?.id || '',
      supplierId: asset.supplier?.id || '',
      purchasePrice: asset.purchasePrice || '',
      purchaseDate: asset.purchaseDate || '',
      warrantyExpiry: asset.warrantyExpiry || '',
      notes: asset.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.tag.trim()) {
      showNotice('Asset Name and Tag are required.', 'error');
      return;
    }

    try {
      const isEdit = !!editingAsset;
      const url = isEdit
        ? `http://127.0.0.1:8000/api/assets/${editingAsset.id}/`
        : 'http://127.0.0.1:8000/api/assets/';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Failed to save asset.', 'error');
        return;
      }

      showNotice(data.message || 'Asset saved successfully!', 'success');
      setIsModalOpen(false);
      fetchAssets();
    } catch (err) {
      showNotice('Network error while saving asset.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmAsset) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/assets/${deleteConfirmAsset.id}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Failed to delete asset.', 'error');
      } else {
        showNotice(data.message, 'success');
        fetchAssets();
      }
    } catch (err) {
      showNotice('Network error deleting asset.', 'error');
    } finally {
      setDeleteConfirmAsset(null);
    }
  };

  return (
    <div className="view-content" style={{ padding: '24px 32px' }}>
      {/* Notifications */}
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
            Hardware Assets Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Manage campus hardware lifecycle, allocations, location tracking, and serial numbers.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Register New Asset</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
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
            placeholder="Search by tag (HAR-LAP-0104), name, brand, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
          <select
            className="form-control"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ height: '40px', width: '130px' }}
          >
            <option value="ALL">All Types</option>
            <option value="Laptop">Laptop</option>
            <option value="Monitor">Monitor</option>
            <option value="Phone">Phone</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: '40px', width: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Showing <strong>{assets.length}</strong> equipment record{assets.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Assets Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ASSET TAG</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>NAME & SPEC</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TYPE</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>STATUS</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ASSIGNED TO</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>CAMPUS LOCATION</th>
              {isAdmin && <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading inventory records...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No assets found matching current criteria.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr
                  key={asset.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfcfe')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 18px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#e8f5e9',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px',
                      }}
                    >
                      <Tag size={12} />
                      {asset.tag}
                    </span>
                  </td>
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{asset.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {asset.brand} {asset.model} {asset.serialNumber ? `• S/N: ${asset.serialNumber}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {asset.type}
                  </td>
                  <td style={{ padding: '16px 18px' }}>
                    <Badge status={asset.status} />
                  </td>
                  <td style={{ padding: '16px 18px' }}>
                    {asset.holder ? (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} style={{ color: 'var(--secondary)' }} />
                          {asset.holder.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{asset.holder.department}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {asset.location ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={13} style={{ color: 'var(--text-light)' }} />
                        {asset.location.name} ({asset.location.building})
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-light)' }}>-</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {asset.status === 'Available' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => onSelectTab && onSelectTab('assignments')}
                          >
                            Assign
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px', color: 'var(--text-secondary)' }}
                          onClick={() => openEditModal(asset)}
                          title="Edit Asset"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px', color: 'var(--crimson)' }}
                          onClick={() => setDeleteConfirmAsset(asset)}
                          title="Delete Asset"
                        >
                          <Trash2 size={14} />
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

      {/* Add / Edit Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingAsset ? `Edit Asset: ${editingAsset.tag}` : 'Register New Campus Asset'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveAsset}>
              {editingAsset ? 'Save Changes' : 'Create Asset Record'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveAsset}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Asset Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Dell Latitude 5430"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Asset Tag *</label>
              <input
                type="text"
                className="form-control"
                placeholder="HAR-LAP-0105"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Asset Type *</label>
              <select
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Phone">Phone</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Operational Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                className="form-control"
                placeholder="Dell, HP, Apple..."
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                className="form-control"
                placeholder="Latitude 5430 / MacBook Air..."
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Factory Serial Number"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Campus Location</label>
              <select
                className="form-control"
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              >
                <option value="">Select Storage / Room</option>
                {(locations.length > 0 ? locations : [
                  { id: 1, name: 'Science Lab B', building: 'Science Wing' },
                  { id: 2, name: 'Main IT Store', building: 'Admin Block' },
                  { id: 3, name: 'Room 204', building: 'Academic Block A' },
                  { id: 4, name: 'Repair Workshop', building: 'Facilities Block' }
                ]).map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.building})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Purchase Price (₹ / $)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 65000"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Warranty Expiry Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Campus usage details or hardware specifications..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmAsset && (
        <Modal
          isOpen={true}
          title="Confirm Asset Deletion"
          onClose={() => setDeleteConfirmAsset(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmAsset(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete Asset
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-main)', margin: '0 0 12px 0' }}>
            Are you sure you want to permanently delete asset <strong>[{deleteConfirmAsset.tag}]</strong> ({deleteConfirmAsset.name})?
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            This action will remove the asset record and its history. This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

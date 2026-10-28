import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building,
  Plus,
  Edit2,
  Trash2,
  Laptop,
  CheckCircle,
  AlertCircle,
  Search,
  Layers
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function LocationsView() {
  const { isAdmin } = useAuth();
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [selectedFacilityAssets, setSelectedFacilityAssets] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Classroom',
    building: 'Main Campus',
    room: '',
    description: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/locations/?';
      if (buildingFilter !== 'ALL') url += `building=${encodeURIComponent(buildingFilter)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setLocations(d.locations || []);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [buildingFilter]);

  const openCreateModal = () => {
    setEditingLoc(null);
    setFormData({
      name: '',
      type: 'Classroom',
      building: 'Academic Block A',
      room: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (loc) => {
    setEditingLoc(loc);
    setFormData({
      name: loc.name,
      type: loc.type,
      building: loc.building,
      room: loc.room || '',
      description: loc.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice('Location name is required.', 'error');
      return;
    }

    try {
      const isEdit = !!editingLoc;
      const url = isEdit
        ? `http://127.0.0.1:8000/api/locations/${editingLoc.id}/`
        : 'http://127.0.0.1:8000/api/locations/';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to save location.', 'error');
        return;
      }

      showNotice(d.message || 'Location saved successfully!', 'success');
      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      showNotice('Network error saving facility.', 'error');
    }
  };

  const handleDeleteLocation = async (loc) => {
    if (!window.confirm(`Are you sure you want to delete facility '${loc.name}'?`)) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/locations/${loc.id}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to delete location.', 'error');
      } else {
        showNotice(d.message, 'success');
        fetchLocations();
      }
    } catch (err) {
      showNotice('Network error deleting facility.', 'error');
    }
  };

  const buildings = ['ALL', 'Science Wing', 'Admin Block', 'Academic Block A', 'Facilities Block'];

  const filteredLocations = locations.filter((loc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.building.toLowerCase().includes(q) ||
      loc.room.toLowerCase().includes(q) ||
      loc.type.toLowerCase().includes(q)
    );
  });

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
            Campus Locations & Facilities
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Manage campus buildings, computer labs, classrooms, and track equipment stationed in each room.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Add Campus Facility</span>
          </button>
        )}
      </div>

      {/* Search & Building Filter */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
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
            placeholder="Search facility name, building, room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {buildings.map((b) => (
            <button
              key={b}
              onClick={() => setBuildingFilter(b)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                border: buildingFilter === b ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: buildingFilter === b ? 'var(--primary-light)' : '#ffffff',
                color: buildingFilter === b ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {b === 'ALL' ? 'All Buildings' : b}
            </button>
          ))}
        </div>
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading campus facilities...
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No locations found matching your criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                      {loc.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={13} />
                      {loc.building} {loc.room ? `• Room ${loc.room}` : ''}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#e0f2fe',
                      color: 'var(--secondary)',
                    }}
                  >
                    {loc.type}
                  </span>
                </div>

                {loc.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                    {loc.description}
                  </p>
                )}
              </div>

              {/* Stationed Assets Bar */}
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
                  <Laptop size={14} style={{ color: loc.assetCount > 0 ? 'var(--primary)' : 'var(--text-light)' }} />
                  <span>
                    <strong>{loc.assetCount}</strong> asset{loc.assetCount === 1 ? '' : 's'} stationed
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {loc.assetCount > 0 && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => setSelectedFacilityAssets(loc)}
                    >
                      View Assets
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px', color: 'var(--text-secondary)' }}
                        onClick={() => openEditModal(loc)}
                        title="Edit Facility"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px', color: 'var(--crimson)' }}
                        onClick={() => handleDeleteLocation(loc)}
                        title="Delete Facility"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Location Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingLoc ? `Edit Facility: ${editingLoc.name}` : 'Register New Campus Facility'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveLocation}>
              {editingLoc ? 'Update Facility' : 'Save Location Record'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveLocation}>
          <div className="form-group">
            <label className="form-label">Facility Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Physics Computing Lab"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Facility Type</label>
              <select
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Lab">Computer / Science Lab</option>
                <option value="Classroom">Classroom</option>
                <option value="Storage">IT Store / Storage</option>
                <option value="Office">Staff / Admin Office</option>
                <option value="Library">Library</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Building Wing *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Science Wing"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Room Number / Door Identifier</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Room 102 or IT-01"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Facility Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Equipment capacity, specialized lab setup, keys holder..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Stationed Assets Modal */}
      {selectedFacilityAssets && (
        <Modal
          isOpen={true}
          title={`Assets Stationed at: ${selectedFacilityAssets.name}`}
          onClose={() => setSelectedFacilityAssets(null)}
          footer={
            <button className="btn btn-secondary" onClick={() => setSelectedFacilityAssets(null)}>
              Close
            </button>
          }
        >
          <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Building: <strong>{selectedFacilityAssets.building}</strong> • Room: {selectedFacilityAssets.room || 'N/A'}
          </div>

          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#f8fafc', fontSize: '12px', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>TAG</th>
                <th style={{ padding: '8px 12px' }}>DEVICE NAME</th>
                <th style={{ padding: '8px 12px' }}>TYPE</th>
                <th style={{ padding: '8px 12px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {selectedFacilityAssets.assets.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                    {a.tag}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{a.type}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-available">{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}

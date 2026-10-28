import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  MapPin,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function ConsumablesView() {
  const { isAdmin } = useAuth();
  const [consumables, setConsumables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);

  const [createFormData, setCreateFormData] = useState({
    name: '',
    category: 'Printing',
    quantity: 10,
    minimumThreshold: 5,
    unit: 'pcs',
    unitCost: '',
    storageLocation: 'Central IT Store',
  });

  const [adjustFormData, setAdjustFormData] = useState({
    type: 'Usage',
    quantity: 1,
    notes: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchConsumables = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/consumables/?';
      if (categoryFilter !== 'ALL') url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setConsumables(d.consumables || []);
      }
    } catch (err) {
      console.error('Error fetching consumables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumables();
  }, [categoryFilter, search]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createFormData.name.trim()) {
      showNotice('Item name is required.', 'error');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/consumables/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createFormData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to add consumable item.', 'error');
        return;
      }

      showNotice(d.message || 'Consumable item registered!', 'success');
      setIsCreateModalOpen(false);
      fetchConsumables();
    } catch (err) {
      showNotice('Network error saving consumable.', 'error');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustItem) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/consumables/${adjustItem.id}/adjust/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(adjustFormData),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to adjust stock.', 'error');
        return;
      }

      showNotice(d.message || 'Stock updated successfully!', 'success');
      setAdjustItem(null);
      fetchConsumables();
    } catch (err) {
      showNotice('Network error updating stock.', 'error');
    }
  };

  const categories = ['ALL', 'Printing', 'Cables', 'Batteries', 'Accessories', 'Stationery'];

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
            Consumables & Stock Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Monitor printer toners, printing paper, cables, dispense records, and low-stock replenishment warnings.
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setCreateFormData({
                name: '',
                category: 'Printing',
                quantity: 10,
                minimumThreshold: 5,
                unit: 'pcs',
                unitCost: '',
                storageLocation: 'Central IT Store',
              });
              setIsCreateModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            <span>Add Consumable Item</span>
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
            placeholder="Search consumable item name, category, or storage..."
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

      {/* Consumables Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ITEM NAME</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>CATEGORY</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>CURRENT STOCK</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>MIN. THRESHOLD</th>
              <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>STORAGE LOCATION</th>
              {isAdmin && <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>STOCK MOVEMENT</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading stock inventory...
                </td>
              </tr>
            ) : consumables.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No consumable items recorded.
                </td>
              </tr>
            ) : (
              consumables.map((item) => (
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
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{item.name}</div>
                    {item.unitCost > 0 && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. Unit Cost: ₹{item.unitCost}</div>}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {item.category}
                    </span>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: item.isLowStock ? 'var(--crimson)' : 'var(--text-main)',
                        }}
                      >
                        {item.quantity} {item.unit}
                      </span>
                      {item.isLowStock && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#fee2e2',
                            color: 'var(--crimson)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <AlertTriangle size={11} />
                          Low Stock
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Alert if &le; {item.minimumThreshold} {item.unit}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} style={{ color: 'var(--text-light)' }} />
                      {item.storageLocation}
                    </span>
                  </td>

                  {isAdmin && (
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{
                          fontSize: '12px',
                          padding: '5px 12px',
                          fontWeight: 600,
                          color: 'var(--primary)',
                        }}
                        onClick={() => {
                          setAdjustItem(item);
                          setAdjustFormData({ type: 'Usage', quantity: 1, notes: '' });
                        }}
                      >
                        Adjust / Dispense
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Consumable Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        title="Add New Consumable Item"
        onClose={() => setIsCreateModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>
              Save Stock Item
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Item Description / Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. HP LaserJet 85A Black Toner Cartridge"
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={createFormData.category}
                onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value })}
              >
                <option value="Printing">Printing & Toners</option>
                <option value="Cables">Cables & Adapters</option>
                <option value="Batteries">Batteries & Power</option>
                <option value="Accessories">Mice & Keyboards</option>
                <option value="Stationery">Paper & Stationery</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit of Measure</label>
              <input
                type="text"
                className="form-control"
                placeholder="pcs / cartridges / reams"
                value={createFormData.unit}
                onChange={(e) => setCreateFormData({ ...createFormData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Initial Quantity in Stock *</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={createFormData.quantity}
                onChange={(e) => setCreateFormData({ ...createFormData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Alert Threshold</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={createFormData.minimumThreshold}
                onChange={(e) => setCreateFormData({ ...createFormData, minimumThreshold: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estimated Unit Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 1250"
                value={createFormData.unitCost}
                onChange={(e) => setCreateFormData({ ...createFormData, unitCost: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Storage Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Central IT Store Shelf B"
                value={createFormData.storageLocation}
                onChange={(e) => setCreateFormData({ ...createFormData, storageLocation: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Adjust / Dispense Modal */}
      {adjustItem && (
        <Modal
          isOpen={true}
          title={`Adjust Stock: ${adjustItem.name}`}
          onClose={() => setAdjustItem(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAdjustItem(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAdjustSubmit}>
                Confirm Stock Movement
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Current Stock Balance: <strong>{adjustItem.quantity} {adjustItem.unit}</strong>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Storage: {adjustItem.storageLocation}
            </div>
          </div>

          <form onSubmit={handleAdjustSubmit}>
            <div className="form-group">
              <label className="form-label">Movement Type *</label>
              <select
                className="form-control"
                value={adjustFormData.type}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, type: e.target.value })}
              >
                <option value="Usage">Dispense / Usage (Deducts stock)</option>
                <option value="Addition">Restock / Replenishment (Adds stock)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity to {adjustFormData.type === 'Usage' ? 'Dispense' : 'Add'} ({adjustItem.unit}) *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={adjustFormData.quantity}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Recipient / Reason Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="e.g. Dispensed 2 toners to Senior Science Faculty Office..."
                value={adjustFormData.notes}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

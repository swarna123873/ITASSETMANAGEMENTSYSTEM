import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Briefcase,
  Building,
  Edit2,
  CheckCircle,
  AlertCircle,
  Laptop
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function StaffDirectoryView({ onSelectTab }) {
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [message, setMessage] = useState({ text: '', type: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Science Dept',
    jobTitle: '',
    phone: '',
    notes: '',
  });

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/staff/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (deptFilter !== 'ALL') url += `department=${encodeURIComponent(deptFilter)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error('Error fetching staff directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search, deptFilter]);

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      department: 'Science Dept',
      jobTitle: '',
      phone: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      department: member.department,
      jobTitle: member.jobTitle || '',
      phone: member.phone || '',
      notes: member.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.department.trim()) {
      showNotice('Name, email, and department are required.', 'error');
      return;
    }

    try {
      const isEdit = !!editingStaff;
      const url = isEdit
        ? `http://127.0.0.1:8000/api/staff/${editingStaff.id}/`
        : 'http://127.0.0.1:8000/api/staff/';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Failed to save staff record.', 'error');
        return;
      }

      showNotice(data.message || 'Staff record saved successfully!', 'success');
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      showNotice('Network error saving staff profile.', 'error');
    }
  };

  const departments = ['ALL', 'Science Dept', 'Maths Dept', 'IT Services', 'Academic Admin', 'Humanities'];

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
            Faculty & Staff Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Institutional faculty, teaching departments, and assigned IT assets breakdown.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Add Faculty / Staff</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
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
            placeholder="Search by name, email, department or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                border: deptFilter === dept ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: deptFilter === dept ? 'var(--primary-light)' : '#ffffff',
                color: deptFilter === dept ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading staff directory...
        </div>
      ) : staff.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No staff members found matching your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {staff.map((member) => (
            <div
              key={member.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                      {member.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Briefcase size={13} />
                      {member.jobTitle || 'Faculty Member'}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px' }}
                      onClick={() => openEditModal(member)}
                      title="Edit Staff Member"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building size={14} style={{ color: 'var(--text-light)' }} />
                    <span style={{ fontWeight: 600 }}>{member.department}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ color: 'var(--text-light)' }} />
                    <a href={`mailto:${member.email}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
                      {member.email}
                    </a>
                  </div>
                  {member.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} style={{ color: 'var(--text-light)' }} />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Hardware Footer */}
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
                  <Laptop size={14} style={{ color: member.assignedCount > 0 ? 'var(--primary)' : 'var(--text-light)' }} />
                  <span>
                    <strong>{member.assignedCount}</strong> device{member.assignedCount === 1 ? '' : 's'} assigned
                  </span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => onSelectTab && onSelectTab('staff-asset-view')}
                >
                  View Devices →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingStaff ? `Edit Staff: ${editingStaff.name}` : 'Add Faculty / Staff Member'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveStaff}>
              {editingStaff ? 'Update Profile' : 'Save Staff Profile'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveStaff}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dr. Robert Fox"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">School Email *</label>
              <input
                type="email"
                className="form-control"
                placeholder="faculty@harvest.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-control"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Science Dept">Science Dept</option>
                <option value="Maths Dept">Maths Dept</option>
                <option value="IT Services">IT Services</option>
                <option value="Academic Admin">Academic Admin</option>
                <option value="Humanities">Humanities</option>
                <option value="Physical Education">Physical Education</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Job Title / Designation</label>
              <input
                type="text"
                className="form-control"
                placeholder="Senior Faculty / HOD..."
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Contact</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Internal Notes</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Campus responsibilities, office room, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Laptop,
  User,
  Building,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Mail,
  Calendar,
  Layers,
  Search,
  AlertCircle
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function StaffAssetMatrixView() {
  const { isAdmin } = useAuth();
  const [matrix, setMatrix] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Return modal state
  const [returnDevice, setReturnDevice] = useState(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

  const showNotice = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchMatrix = async () => {
    try {
      setIsLoading(true);
      let url = 'http://127.0.0.1:8000/api/assignments/staff-matrix/?';
      if (deptFilter !== 'ALL') url += `department=${encodeURIComponent(deptFilter)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setMatrix(d.matrix || []);
      }
    } catch (err) {
      console.error('Error fetching staff matrix:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [deptFilter]);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnDevice) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/assignments/${returnDevice.assignmentId}/return/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          returnDate,
          notes: returnNotes,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        showNotice(d.error || 'Failed to process return.', 'error');
        return;
      }

      showNotice(d.message || 'Asset returned successfully!', 'success');
      setReturnDevice(null);
      fetchMatrix();
    } catch (err) {
      showNotice('Network error processing return.', 'error');
    }
  };

  const departments = ['ALL', 'Science Dept', 'Maths Dept', 'IT Services', 'Academic Admin', 'Humanities'];

  const filteredMatrix = matrix.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      item.devices.some((d) => d.tag.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
          Faculty Asset Matrix
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          Direct breakdown of all campus hardware devices currently checked out to faculty members.
        </p>
      </div>

      {/* Filters Bar */}
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
            placeholder="Search teacher, department, or device tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
              }}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Cards */}
      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading staff asset allocations...
        </div>
      ) : filteredMatrix.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No staff records found matching your filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredMatrix.map((staff) => (
            <div
              key={staff.staffId}
              className="card"
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                border: staff.heldCount > 0 ? '1px solid var(--border-color)' : '1px dashed var(--border-light)',
              }}
            >
              {/* Faculty Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      {staff.name}
                    </h2>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: staff.heldCount > 0 ? 'var(--primary-light)' : '#f1f5f9',
                        color: staff.heldCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {staff.heldCount} device{staff.heldCount === 1 ? '' : 's'} assigned
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {staff.jobTitle || 'Faculty'} • <strong>{staff.department}</strong> • {staff.email}
                  </div>
                </div>
              </div>

              {/* Assigned Devices List */}
              {staff.devices.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', padding: '8px 0' }}>
                  No campus equipment currently assigned to this faculty member.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {staff.devices.map((dev) => (
                    <div
                      key={dev.assignmentId}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#fbfcfe',
                        border: dev.isOverdue ? '1px solid #ffcdd2' : '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '12px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#e8f5e9',
                              color: 'var(--primary)',
                            }}
                          >
                            {dev.tag}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dev.type}</span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px', marginBottom: '8px' }}>
                          {dev.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-light)' }} />
                          Issued: {dev.issueDate}
                        </div>
                        {dev.expectedReturnDate && (
                          <div
                            style={{
                              fontSize: '12px',
                              marginTop: '3px',
                              color: dev.isOverdue ? 'var(--crimson)' : 'var(--text-muted)',
                              fontWeight: dev.isOverdue ? 700 : 400,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {dev.isOverdue && <AlertTriangle size={12} />}
                            Due: {dev.expectedReturnDate} {dev.isOverdue ? '(Overdue)' : ''}
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                          <button
                            className="btn btn-secondary"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              fontSize: '12px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '6px',
                              color: 'var(--primary)',
                              fontWeight: 600,
                            }}
                            onClick={() => {
                              setReturnDevice({ ...dev, staffName: staff.name });
                              setReturnNotes('');
                              setReturnDate(new Date().toISOString().split('T')[0]);
                            }}
                          >
                            <RotateCcw size={13} />
                            Check In / Return
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Return Modal */}
      {returnDevice && (
        <Modal
          isOpen={true}
          title={`Return Device: ${returnDevice.tag}`}
          onClose={() => setReturnDevice(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setReturnDevice(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleReturnSubmit}>
                Confirm Return
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Device: <strong>{returnDevice.name}</strong> [{returnDevice.tag}]
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Holding Faculty: <strong>{returnDevice.staffName}</strong>
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
              <label className="form-label">Inspection Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Physical hardware inspection notes..."
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

import React, { useState } from 'react';
import { Search, Bell, ChevronDown, User, Key, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const titleMap = {
  dashboard: { title: 'IT Asset Dashboard', desc: 'Overview of school hardware, assignments, and operational status' },
  assets: { title: 'Assets Management', desc: 'Register, catalog, track and manage school equipment' },
  staff: { title: 'Staff Directory', desc: 'Faculty, teachers, administrators and departmental personnel' },
  assignments: { title: 'Assignments & Returns', desc: 'Issue devices to staff, manage active allocations and returns' },
  'staff-asset-view': { title: 'Staff Asset View', desc: 'Inspect current hardware holdings per faculty member' },
  repairs: { title: 'Maintenance & Repairs', desc: 'Track damaged equipment, service requests, diagnostics and costs' },
  locations: { title: 'Locations & Campus Facilities', desc: 'Buildings, computer labs, classrooms, libraries and storage' },
  software: { title: 'Software Licenses', desc: 'Manage digital software licenses, seat allocations and expiry dates' },
  components: { title: 'Hardware Components', desc: 'RAM, SSDs, GPUs and modular spare parts linked to parent devices' },
  suppliers: { title: 'Suppliers & Vendors', desc: 'Equipment vendors, warranty service providers and repair partners' },
  consumables: { title: 'Consumables & Stock', desc: 'Toners, printing paper, cables and supplies inventory with threshold alerts' },
  alerts: { title: 'Alerts & Notifications', desc: 'Overdue returns, maintenance notices, low-stock warnings, and license reminders' },
  reports: { title: 'Reports & Analytics', desc: 'Downloadable CSV summaries, inventory metrics and departmental breakdowns' },
  audit: { title: 'Audit Trail & Activity Log', desc: 'Immutable timeline of inventory changes, assignments, and system events' },
  settings: { title: 'System & Branding Settings', desc: 'School branding, institutional details, security and notification preferences' },
};

export default function TopNavbar({ activeTab, onSearch, unreadAlertsCount = 3, onSelectTab, onOpenPasswordModal }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { currentUser, logoutUser, isAdmin } = useAuth();
  const currentMeta = titleMap[activeTab] || { title: 'AssetHub', desc: 'School IT Management' };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="topbar">
      {/* Current Title & Breadcrumb */}
      <div className="topbar-left">
        <div className="breadcrumb-area">
          <h1>{currentMeta.title}</h1>
          <p>{currentMeta.desc}</p>
        </div>
      </div>

      {/* Global Quick Search */}
      <div className="topbar-search">
        <Search className="topbar-search-icon" />
        <input
          type="text"
          placeholder="Quick search assets, tags, staff..."
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      {/* Actions & Profile */}
      <div className="topbar-actions">
        {/* Alerts Notification Bell */}
        <button
          className="icon-btn"
          title="Notifications"
          onClick={() => onSelectTab && onSelectTab('alerts')}
        >
          <Bell size={18} />
          {unreadAlertsCount > 0 && <span className="notification-badge-dot" />}
        </button>

        {/* User Profile Menu */}
        <div style={{ position: 'relative' }}>
          <div
            className="user-profile-menu"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="avatar-circle">
              {getInitials(currentUser?.name)}
            </div>
            <div className="user-meta">
              <div className="user-name">{currentUser?.name || 'Authorized User'}</div>
              <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isAdmin ? (
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Administrator</span>
                ) : (
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Staff Member</span>
                )}
                <span>• {currentUser?.department || 'Campus'}</span>
              </div>
            </div>
            <ChevronDown size={14} color="#64748b" />
          </div>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '240px',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)',
                padding: '8px 0',
                zIndex: 60,
              }}
            >
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '12px' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                  {currentUser?.name}
                </p>
                <p style={{ color: 'var(--text-muted)' }}>{currentUser?.email}</p>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isAdmin ? 'var(--primary-light)' : 'var(--secondary-light)',
                    color: isAdmin ? 'var(--primary)' : 'var(--secondary)',
                  }}
                >
                  {isAdmin ? 'ADMIN PRIVILEGES' : 'RESTRICTED STAFF ROLE'}
                </span>
              </div>

              <button
                className="nav-item"
                style={{ borderRadius: 0, color: 'var(--text-main)', fontSize: '13px' }}
                onClick={() => {
                  setDropdownOpen(false);
                  onSelectTab('settings');
                }}
              >
                <User size={15} />
                <span>Profile & Preferences</span>
              </button>

              <button
                className="nav-item"
                style={{ borderRadius: 0, color: 'var(--text-main)', fontSize: '13px' }}
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenPasswordModal) onOpenPasswordModal();
                  else onSelectTab('settings');
                }}
              >
                <Key size={15} />
                <span>Change Password</span>
              </button>

              {isAdmin && (
                <button
                  className="nav-item"
                  style={{ borderRadius: 0, color: 'var(--text-main)', fontSize: '13px' }}
                  onClick={() => {
                    setDropdownOpen(false);
                    onSelectTab('settings');
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>Security & Roles</span>
                </button>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

              <button
                className="nav-item"
                style={{ borderRadius: 0, color: 'var(--crimson)', fontSize: '13px' }}
                onClick={() => {
                  setDropdownOpen(false);
                  logoutUser();
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

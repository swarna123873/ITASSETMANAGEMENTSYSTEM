import React from 'react';
import {
  LayoutDashboard,
  Laptop,
  Users,
  ArrowLeftRight,
  UserCheck,
  Wrench,
  MapPin,
  FileKey,
  Cpu,
  Truck,
  Boxes,
  Bell,
  BarChart3,
  History,
  Settings,
  GraduationCap,
  Shield,
  Lock
} from 'lucide-react';
import logoImg from '../../assets/harvest_logo.jpg';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Core', adminOnly: false },
  { id: 'assets', label: 'Assets', icon: Laptop, section: 'Core', adminOnly: false },
  { id: 'staff', label: 'Staff', icon: Users, section: 'Core', adminOnly: true },
  { id: 'assignments', label: 'Assignments & Returns', icon: ArrowLeftRight, section: 'Core', adminOnly: true },
  { id: 'staff-asset-view', label: 'Staff Asset View', icon: UserCheck, section: 'Core', adminOnly: false },

  { id: 'repairs', label: 'Maintenance & Repairs', icon: Wrench, section: 'Operations', adminOnly: true },
  { id: 'locations', label: 'Locations', icon: MapPin, section: 'Operations', adminOnly: false },
  { id: 'software', label: 'Software Licenses', icon: FileKey, section: 'Operations', adminOnly: true },
  { id: 'components', label: 'Hardware Components', icon: Cpu, section: 'Operations', adminOnly: true },
  { id: 'suppliers', label: 'Suppliers', icon: Truck, section: 'Operations', adminOnly: true },
  { id: 'consumables', label: 'Consumables & Stock', icon: Boxes, section: 'Operations', adminOnly: true },

  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell, section: 'System', adminOnly: false, badge: 3 },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, section: 'System', adminOnly: true },
  { id: 'audit', label: 'Activity Log / Audit', icon: History, section: 'System', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'System', adminOnly: false },
];

export default function Sidebar({ activeTab, onSelectTab, unreadAlertsCount = 3 }) {
  const { isAdmin, currentUser } = useAuth();
  const sections = ['Core', 'Operations', 'System'];

  return (
    <aside className="sidebar">
      {/* Brand & School Logo */}
      <div className="sidebar-header">
        <img
          src={logoImg}
          alt="Harvest International School Logo"
          className="school-logo-img"
        />
        <div className="sidebar-brand-text">
          <h2>School AssetHub</h2>
          <p>Harvest Int'l School</p>
        </div>
      </div>

      {/* Role Banner */}
      <div
        style={{
          padding: '8px 16px',
          background: isAdmin ? 'rgba(46, 125, 50, 0.15)' : 'rgba(2, 136, 209, 0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={13} color={isAdmin ? '#81c784' : '#4fc3f7'} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: isAdmin ? '#81c784' : '#4fc3f7' }}>
            {isAdmin ? 'ADMINISTRATOR' : 'STAFF MEMBER'}
          </span>
        </div>
        <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
          {currentUser?.department || 'Harvest'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {sections.map(section => {
          const visibleItems = navItems.filter(item => {
            if (item.section !== section) return false;
            // Admin sees all. Staff sees non-adminOnly items.
            return isAdmin || !item.adminOnly;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section}>
              <div className="nav-section-title">{section}</div>
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badgeCount = item.id === 'alerts' ? unreadAlertsCount : item.badge;

                return (
                  <button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectTab(item.id)}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="nav-badge">{badgeCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* School Motto & Tagline Footer */}
      <div className="sidebar-footer">
        <div className="school-tagline-badge">
          <GraduationCap size={14} />
          <span>Education Beyond Classrooms</span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
          v1.0.0 • Secured Campus Portal
        </span>
      </div>
    </aside>
  );
}

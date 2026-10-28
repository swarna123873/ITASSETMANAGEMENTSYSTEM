import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ChangePasswordModal from './components/auth/ChangePasswordModal';
import Sidebar from './components/layout/Sidebar';
import TopNavbar from './components/layout/TopNavbar';
import DashboardView from './components/views/DashboardView';
import AssetsView from './components/views/AssetsView';
import StaffDirectoryView from './components/views/StaffDirectoryView';
import AssignmentsView from './components/views/AssignmentsView';
import StaffAssetMatrixView from './components/views/StaffAssetMatrixView';
import RepairsView from './components/views/RepairsView';
import LocationsView from './components/views/LocationsView';
import AlertsView from './components/views/AlertsView';
import AuditLogView from './components/views/AuditLogView';
import SoftwareView from './components/views/SoftwareView';
import ComponentsView from './components/views/ComponentsView';
import SuppliersView from './components/views/SuppliersView';
import ConsumablesView from './components/views/ConsumablesView';
import ReportsView from './components/views/ReportsView';
import SettingsView from './components/views/SettingsView';
import PlaceholderView from './components/views/PlaceholderView';
import Modal from './components/common/Modal';
import Toast from './components/common/Toast';

const moduleConfig = {
  dashboard: { title: 'Dashboard', desc: 'Campus hardware summary & operational status', phase: 'Part 1: Core Layout' },
  assets: { title: 'Assets Management', desc: 'Hardware registration, cataloging & full lifecycle management', phase: 'Part 3: Core Assets' },
  staff: { title: 'Staff Directory', desc: 'Institutional staff, departments and contact details', phase: 'Part 3: Staff Management' },
  assignments: { title: 'Assignments & Returns', desc: 'Single-holder hardware allocation & check-in lifecycle', phase: 'Part 3: Allocation Workflows' },
  'staff-asset-view': { title: 'Staff Asset View', desc: 'View currently assigned devices by faculty member', phase: 'Part 3: Staff Asset Matrix' },
  repairs: { title: 'Maintenance & Repairs', desc: 'Hardware fault logging, repair stages, costs and recovery', phase: 'Part 4: Operations' },
  locations: { title: 'Locations & Campus Facilities', desc: 'School buildings, computer labs, classrooms and storage', phase: 'Part 4: Operations' },
  software: { title: 'Software Licenses', desc: 'Digital software seats, license allocations and expiration', phase: 'Part 5: Advanced Modules' },
  components: { title: 'Hardware Components', desc: 'RAM, SSD, GPU and spare parts linked to parent devices', phase: 'Part 5: Advanced Modules' },
  suppliers: { title: 'Suppliers & Vendors', desc: 'Hardware suppliers, service partners and repair history', phase: 'Part 5: Advanced Modules' },
  consumables: { title: 'Consumables & Stock', desc: 'Toner cartridges, printing paper and cable stock tracking', phase: 'Part 5: Advanced Modules' },
  alerts: { title: 'Alerts & Notifications', desc: 'Overdue returns, license expiration, and low-stock alerts', phase: 'Part 4: Operations' },
  reports: { title: 'Reports & Analytics', desc: 'Downloadable CSV exports, charts and inventory breakdown', phase: 'Part 5: Analytics' },
  audit: { title: 'Activity Log & Audit Trail', desc: 'Immutable security log of modifications across all modules', phase: 'Part 4: Operations' },
  settings: { title: 'System & Branding Settings', desc: 'School branding, institutional details and role management', phase: 'Part 5: Settings' },
};

function AuthenticatedApp() {
  const { isAuthenticated, currentUser, isAdmin } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetch('http://127.0.0.1:8000/api/alerts/', { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((d) => {
          if (d) setUnreadAlertsCount(d.totalAlerts || 0);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, activeTab]);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Quick form state for testing Add Asset modal
  const [newAsset, setNewAsset] = useState({
    name: '',
    tag: '',
    type: 'Laptop',
    serial: '',
    status: 'Available',
  });

  const handleCreateAsset = (e) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.tag) {
      addToast('Please enter both asset name and a unique tag.', 'error');
      return;
    }
    setIsAddAssetOpen(false);
    addToast(`Asset "${newAsset.name}" [${newAsset.tag}] recorded.`, 'success');
    setNewAsset({ name: '', tag: '', type: 'Laptop', serial: '', status: 'Available' });
  };

  // 1. If not authenticated, render Login or Registration screen
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onNavigateLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateRegister={() => setAuthView('register')} />;
  }

  // 2. Authenticated Management Application
  return (
    <div className="app-layout">
      {/* Persistent Sidebar with RBAC destinations */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <TopNavbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unreadAlertsCount={unreadAlertsCount}
          onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
          onSearch={(query) => {
            if (query.trim()) {
              addToast(`Searching for: "${query}" across inventory...`, 'success');
            }
          }}
        />

        {/* Dynamic View Display */}
        {activeTab === 'dashboard' && (
          <DashboardView
            onSelectTab={setActiveTab}
            onOpenAddAsset={() => setActiveTab('assets')}
          />
        )}
        {activeTab === 'assets' && (
          <AssetsView onSelectTab={setActiveTab} />
        )}
        {activeTab === 'staff' && (
          <StaffDirectoryView onSelectTab={setActiveTab} />
        )}
        {activeTab === 'assignments' && (
          <AssignmentsView />
        )}
        {activeTab === 'staff-asset-view' && (
          <StaffAssetMatrixView />
        )}
        {activeTab === 'repairs' && (
          <RepairsView />
        )}
        {activeTab === 'locations' && (
          <LocationsView />
        )}
        {activeTab === 'alerts' && (
          <AlertsView onSelectTab={setActiveTab} />
        )}
        {activeTab === 'audit' && (
          <AuditLogView />
        )}
        {activeTab === 'software' && (
          <SoftwareView />
        )}
        {activeTab === 'components' && (
          <ComponentsView />
        )}
        {activeTab === 'suppliers' && (
          <SuppliersView />
        )}
        {activeTab === 'consumables' && (
          <ConsumablesView />
        )}
        {activeTab === 'reports' && (
          <ReportsView />
        )}
        {activeTab === 'settings' && (
          <SettingsView onOpenPasswordModal={() => setIsPasswordModalOpen(true)} />
        )}
      </div>

      {/* Interactive Modal for Add Asset (Admin Only) */}
      <Modal
        isOpen={isAddAssetOpen}
        title="Register New Campus Asset"
        onClose={() => setIsAddAssetOpen(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsAddAssetOpen(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateAsset}>
              Save Asset Record
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAsset}>
          <div className="form-group">
            <label className="form-label">Asset Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dell Latitude 5430"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Unique Asset Tag *</label>
              <input
                type="text"
                className="form-control"
                placeholder="HAR-LAP-0099"
                value={newAsset.tag}
                onChange={(e) => setNewAsset({ ...newAsset, tag: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Asset Type *</label>
              <select
                className="form-control"
                value={newAsset.type}
                onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
              >
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Phone">Phone</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CN-0XYZ12-987"
                value={newAsset.serial}
                onChange={(e) => setNewAsset({ ...newAsset, serial: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                className="form-control"
                value={newAsset.status}
                onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Repair">Under Repair</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={(msg) => addToast(msg, 'success')}
      />

      {/* Floating Toast Notification System */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

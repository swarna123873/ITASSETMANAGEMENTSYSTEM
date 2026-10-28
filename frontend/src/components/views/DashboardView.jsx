import React, { useState, useEffect } from 'react';
import {
  Laptop,
  CheckCircle2,
  Users,
  Wrench,
  Plus,
  ArrowUpRight,
  Download,
  AlertTriangle,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';
import MetricCard from '../common/MetricCard';
import Badge from '../common/Badge';

export default function DashboardView({ onSelectTab, onOpenAddAsset }) {
  const [backendStatus, setBackendStatus] = useState({ checking: true, connected: false, data: null });

  // Sample initial records demonstrating the Harvest campus inventory
  const [metrics, setMetrics] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    repair: 0,
    overdueCount: 0,
  });

  const [recentAssets, setRecentAssets] = useState([]);

  // Fetch live metrics and equipment from backend
  useEffect(() => {
    // 1. Health check
    fetch('http://127.0.0.1:8000/api/health/')
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus({ checking: false, connected: true, data });
      })
      .catch((err) => {
        setBackendStatus({ checking: false, connected: false, error: err.message });
      });

    // 2. Fetch live assets
    fetch('http://127.0.0.1:8000/api/assets/', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.assets) {
          const list = data.assets;
          setRecentAssets(
            list.slice(0, 6).map((a) => ({
              id: a.id,
              name: a.name,
              tag: a.tag,
              type: a.type,
              holder: a.holder ? `${a.holder.name} (${a.holder.department})` : 'Unassigned',
              location: a.location ? a.location.name : 'Central IT Store',
              status: a.status,
            }))
          );

          const avail = list.filter((a) => a.status === 'Available').length;
          const assig = list.filter((a) => a.status === 'Assigned').length;
          const rep = list.filter((a) => a.status === 'Under Repair').length;

          setMetrics((prev) => ({
            ...prev,
            total: list.length,
            available: avail,
            assigned: assig,
            repair: rep,
          }));
        }
      })
      .catch(() => {});

    // 3. Fetch overdue count from assignments
    fetch('http://127.0.0.1:8000/api/assignments/?status=Active', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.assignments) {
          const overdue = data.assignments.filter((a) => a.isOverdue).length;
          setMetrics((prev) => ({ ...prev, overdueCount: overdue }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-container">
      {/* Top Welcome / Campus Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                background: 'rgba(46, 125, 50, 0.3)',
                color: '#81c784',
                fontSize: '12px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 'var(--radius-sm)',
                letterSpacing: '0.3px',
              }}
            >
              HARVEST INTERNATIONAL SCHOOL
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>• IT Asset Portal</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.4px' }}>
            Campus Hardware & Asset Operations
          </h2>
          <p style={{ fontSize: '13.5px', color: '#cbd5e1', marginTop: '4px' }}>
            Centralized monitoring for laptops, classroom displays, staff equipment, repairs & inventory.
          </p>
        </div>

        {/* Backend live status pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Server size={18} color={backendStatus.connected ? '#4caf50' : '#ffa726'} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>
              Django REST API: {backendStatus.connected ? 'Connected' : 'Listening...'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {backendStatus.connected
                ? `${backendStatus.data?.service || 'School AssetHub'} (v${backendStatus.data?.version || '1.0'})`
                : 'http://127.0.0.1:8000/api/'}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Summary Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total School Assets"
          value={metrics.total}
          subtext="Cataloged institutional devices"
          icon={Laptop}
          variant="total"
          onClick={() => onSelectTab('assets')}
        />
        <MetricCard
          title="Available in Stock"
          value={metrics.available}
          subtext="Ready for staff assignment"
          icon={CheckCircle2}
          variant="available"
          onClick={() => onSelectTab('assets')}
        />
        <MetricCard
          title="Currently Assigned"
          value={metrics.assigned}
          subtext="Allocated to faculty & staff"
          icon={Users}
          variant="assigned"
          onClick={() => onSelectTab('assignments')}
        />
        <MetricCard
          title="Under Maintenance"
          value={metrics.repair}
          subtext="Active repair or diagnostics"
          icon={Wrench}
          variant="repair"
          onClick={() => onSelectTab('repairs')}
        />
      </div>

      {/* Action Bar + Status Breakdown */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Hardware Distribution & Quick Workflows</div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Live allocation ratio across Harvest International School campus
            </p>
          </div>
          <div className="header-action-group">
            <button
              className="btn btn-secondary"
              onClick={() => onSelectTab('reports')}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (onOpenAddAsset) onOpenAddAsset();
                else onSelectTab('assets');
              }}
            >
              <Plus size={16} />
              <span>Add New Asset</span>
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Progress Bar Distribution */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                height: '14px',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                background: '#e2e8f0',
                gap: '2px',
              }}
            >
              <div
                style={{
                  width: `${(metrics.assigned / metrics.total) * 100}%`,
                  background: 'var(--secondary)',
                  title: 'Assigned',
                }}
              />
              <div
                style={{
                  width: `${(metrics.available / metrics.total) * 100}%`,
                  background: 'var(--primary)',
                  title: 'Available',
                }}
              />
              <div
                style={{
                  width: `${(metrics.repair / metrics.total) * 100}%`,
                  background: 'var(--amber)',
                  title: 'Under Repair',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '24px',
                marginTop: '12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-main)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--secondary)',
                  }}
                />
                <span>Assigned: {Math.round((metrics.assigned / metrics.total) * 100)}% ({metrics.assigned})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary)',
                  }}
                />
                <span>Available: {Math.round((metrics.available / metrics.total) * 100)}% ({metrics.available})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--amber)',
                  }}
                />
                <span>Under Repair: {Math.round((metrics.repair / metrics.total) * 100)}% ({metrics.repair})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assets & Timeline Preview */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recently Registered Assets</div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => onSelectTab('assets')}
          >
            <span>View All Assets</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Asset Tag</th>
                <th>Type</th>
                <th>Current Holder</th>
                <th>Location</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentAssets.map((asset) => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 600 }}>{asset.name}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        background: '#f1f5f9',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {asset.tag}
                    </span>
                  </td>
                  <td>{asset.type}</td>
                  <td>
                    {asset.holder === 'Unassigned' ? (
                      <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>
                        Unassigned
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        {asset.holder}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{asset.location}</td>
                  <td>
                    <Badge status={asset.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="action-btn-sm"
                      onClick={() => onSelectTab('assets')}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

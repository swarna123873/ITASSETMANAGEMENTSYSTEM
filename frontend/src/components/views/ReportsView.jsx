import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  DollarSign,
  Laptop,
  CheckCircle,
  FileSpreadsheet,
  PieChart,
  Layers,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ReportsView() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/reports/summary/', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setSummary(d);
      }
    } catch (err) {
      console.error('Error fetching reports summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDownload = (endpoint, filename) => {
    window.open(`http://127.0.0.1:8000/api/reports/export/${endpoint}/`, '_blank');
  };

  return (
    <div className="view-content" style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            Reports & Inventory Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Comprehensive institutional inventory audit, departmental allocation distribution, and CSV data exports.
          </p>
        </div>

        {/* Quick CSV Export Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleDownload('assets', 'harvest_assets_catalog.csv')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <Download size={15} />
            <span>Export Assets CSV</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleDownload('assignments', 'harvest_assignments_log.csv')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <Download size={15} />
            <span>Export Allocations CSV</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing institutional analytics...
        </div>
      ) : !summary ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Failed to load analytics data.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Financial Valuation Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px' }}>
                Total Equipment Valuation
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                ₹{summary.financials.totalAssetValuation.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Cumulative campus hardware acquisition value
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--crimson)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--crimson)', marginBottom: '8px' }}>
                Total Maintenance Expense
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                ₹{summary.financials.totalRepairExpense.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Repairs & component replacement spending
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--secondary)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)', marginBottom: '8px' }}>
                Active Hardware Units
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                {summary.totalAssets}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Registered devices tracked in system
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', marginBottom: '8px' }}>
                Active Software Subscriptions
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                {summary.financials.activeLicensesCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Managed digital tool titles
              </div>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {/* By Hardware Type */}
            <div className="card" style={{ padding: '22px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Laptop size={17} style={{ color: 'var(--primary)' }} />
                <span>Inventory Distribution by Device Type</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {summary.byType.map((t) => {
                  const pct = summary.totalAssets > 0 ? Math.round((t.count / summary.totalAssets) * 100) : 0;
                  return (
                    <div key={t.asset_type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.asset_type}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          <strong>{t.count}</strong> units ({pct}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Status */}
            <div className="card" style={{ padding: '22px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={17} style={{ color: 'var(--secondary)' }} />
                <span>Inventory Operational Status</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {summary.byStatus.map((s) => {
                  const pct = summary.totalAssets > 0 ? Math.round((s.count / summary.totalAssets) * 100) : 0;
                  const color =
                    s.status === 'Available'
                      ? 'var(--primary)'
                      : s.status === 'Assigned'
                      ? 'var(--secondary)'
                      : s.status === 'Under Repair'
                      ? '#f59e0b'
                      : 'var(--crimson)';
                  return (
                    <div key={s.status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.status}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          <strong>{s.count}</strong> units ({pct}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="card" style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={17} style={{ color: 'var(--text-secondary)' }} />
              <span>Active Hardware Allocation by Department</span>
            </h2>
            {summary.byDepartment.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No active assignments currently logged.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {summary.byDepartment.map((d) => (
                  <div
                    key={d.department}
                    style={{
                      padding: '14px',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {d.department}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      <strong>{d.count}</strong> device{d.count === 1 ? '' : 's'} allocated
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

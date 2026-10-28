import React from 'react';
import { Layers, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export default function PlaceholderView({ tabId, title, description, plannedPhase, onSelectTab }) {
  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{title}</div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {description}
            </p>
          </div>
          <span
            style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {plannedPhase}
          </span>
        </div>

        <div className="card-body" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'var(--bg-main)',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--primary)',
            }}
          >
            <Layers size={32} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
            {title} Module Configured
          </h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 24px', fontSize: '14px', color: 'var(--text-muted)' }}>
            This section is part of the Harvest International School IT AssetHub structure. The persistent navigation, layout, design tokens, and routing are now active. Full CRUD and database workflows will be hooked in the next sequential phase.
          </p>

          <div style={{ display: 'inline-flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => onSelectTab('dashboard')}>
              Back to Dashboard
            </button>
            <button className="btn btn-primary" onClick={() => onSelectTab('assets')}>
              <span>View Assets Preview</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

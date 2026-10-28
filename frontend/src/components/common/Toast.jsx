import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Toast({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle size={18} color="var(--crimson)" />
          ) : (
            <CheckCircle2 size={18} color="var(--primary)" />
          )}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => onClose(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light)',
            }}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

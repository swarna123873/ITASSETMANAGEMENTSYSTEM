import React from 'react';

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'total',
  onClick,
}) {
  return (
    <div
      className={`metric-card ${variant}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="metric-info">
        <h3>{title}</h3>
        <div className="metric-value">{value}</div>
        {subtext && <div className="metric-subtext">{subtext}</div>}
      </div>
      {Icon && (
        <div className="metric-icon-wrap">
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}

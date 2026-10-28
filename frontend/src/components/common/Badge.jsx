import React from 'react';

export default function Badge({ status, text }) {
  const norm = (status || '').toLowerCase().replace(/ /g, '-');
  let badgeClass = 'badge-muted';
  let display = text || status;

  if (norm.includes('avail')) {
    badgeClass = 'badge-available';
    display = display || 'Available';
  } else if (norm.includes('assign')) {
    badgeClass = 'badge-assigned';
    display = display || 'Assigned';
  } else if (norm.includes('repair') || norm.includes('maint')) {
    badgeClass = 'badge-repair';
    display = display || 'Under Repair';
  } else if (norm.includes('overdue') || norm.includes('expir') || norm.includes('crit')) {
    badgeClass = 'badge-overdue';
    display = display || 'Overdue';
  }

  return <span className={`badge ${badgeClass}`}>{display}</span>;
}

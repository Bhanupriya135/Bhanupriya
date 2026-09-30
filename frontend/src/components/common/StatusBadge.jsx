import React from 'react'

const statusConfig = {
  // Project statuses
  planning:        { label: 'Planning',        class: 'badge-blue' },
  in_progress:     { label: 'In Progress',     class: 'badge-yellow' },
  estimation_done: { label: 'Estimation Done', class: 'badge-navy' },
  completed:       { label: 'Completed',       class: 'badge-green' },
  cancelled:       { label: 'Cancelled',       class: 'badge-red' },

  // Drawing statuses
  pending:         { label: 'Pending',         class: 'badge-gray' },
  uploaded:        { label: 'Uploaded',        class: 'badge-blue' },
  processing:      { label: 'Processing',      class: 'badge-yellow' },
  failed:          { label: 'Failed',          class: 'badge-red' },

  // Generic
  active:          { label: 'Active',          class: 'badge-green' },
  inactive:        { label: 'Inactive',        class: 'badge-gray' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: 'badge-gray' }
  return <span className={`badge ${config.class}`}>{config.label}</span>
}

import React from 'react'

export function LoadingSpinner({ size = 20, color = 'var(--primary)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid var(--primary-200)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block',
      flexShrink: 0,
    }} />
  )
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <LoadingSpinner size={32} />
      <span>{message}</span>
    </div>
  )
}

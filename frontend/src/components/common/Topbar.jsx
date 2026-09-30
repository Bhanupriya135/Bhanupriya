import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/drawings': 'Drawing Analysis',
  '/estimation': 'Material Estimation',
  '/cost': 'Cost Estimation',
  '/boq': 'Bill of Quantities (BOQ)',
  '/reports': 'Reports',
  '/materials': 'Materials Database',
  '/tender':    'Tender / Quotation',
  '/settings':  'Settings',
}

export default function Topbar() {
  const location = useLocation()
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const title = pageTitles[location.pathname] ||
    (location.pathname.startsWith('/projects/') ? 'Project Details' : 'AI MatEsti')

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 'var(--sidebar-width)',
      right: 0,
      height: 'var(--topbar-height)',
      background: 'white',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      zIndex: 99,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Page Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 12px',
        width: 220,
      }}>
        <Search size={15} color="var(--text-muted)" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 13,
            color: 'var(--text-primary)',
            width: '100%',
          }}
        />
      </div>

      {/* Notifications */}
      <button style={{
        width: 38, height: 38,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        color: 'var(--text-secondary)',
      }}>
        <Bell size={17} />
        <span style={{
          position: 'absolute',
          top: 6, right: 6,
          width: 8, height: 8,
          background: 'var(--primary)',
          borderRadius: '50%',
          border: '2px solid white',
        }} />
      </button>

      {/* User Avatar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 8,
      }}>
        <div style={{
          width: 34, height: 34,
          borderRadius: '50%',
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <User size={16} color="white" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {user?.name?.split(' ')[0] || 'User'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role || 'Engineer'}</span>
        </div>
        <ChevronDown size={14} color="var(--text-muted)" />
      </div>
    </header>
  )
}

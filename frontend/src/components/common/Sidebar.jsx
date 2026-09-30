import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, FolderKanban, FileImage, Calculator,
  DollarSign, ClipboardList, BarChart3, Settings,
  LogOut, ChevronRight, Building2, Package, User, FileSignature
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard,  label: 'Dashboard' },
  { to: '/projects',  icon: FolderKanban,     label: 'Projects' },
  { to: '/drawings',  icon: FileImage,         label: 'Drawing Analysis' },
  { to: '/estimation',icon: Calculator,        label: 'Material Estimation' },
  { to: '/cost',      icon: DollarSign,        label: 'Cost Estimation' },
  { to: '/boq',       icon: ClipboardList,     label: 'BOQ' },
  { to: '/tender',    icon: FileSignature,     label: 'Tender / Quote' },
  { to: '/reports',   icon: BarChart3,         label: 'Reports' },
  { to: '/materials', icon: Package,           label: 'Materials DB' },
  { to: '/settings',  icon: Settings,          label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 40, height: 40,
          background: 'var(--primary)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Building2 size={22} color="white" />
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>AI MatEsti</div>
          <div style={{ color: 'var(--primary-light)', fontSize: 11 }}>Construction Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 10px 6px' }}>
          Main Menu
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 10px',
              borderRadius: 8,
              marginBottom: 2,
              color: isActive ? 'white' : 'var(--sidebar-text)',
              background: isActive ? 'var(--primary)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background.includes('var(--primary)')) {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                e.currentTarget.style.background = isActive ? 'var(--primary)' : 'transparent'
              }
            }}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div style={{
        padding: 12,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 8,
          marginBottom: 4,
        }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <User size={16} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {user?.role || 'engineer'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

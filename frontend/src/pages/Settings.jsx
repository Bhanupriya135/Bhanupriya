import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon, User, Database, Bell, Shield, Palette } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and application preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Sidebar Tabs */}
        <div className="card" style={{ padding: 8, height: 'fit-content' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, border: 'none',
                background: activeTab === id ? 'var(--primary)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 14, fontWeight: activeTab === id ? 600 : 400,
                marginBottom: 2, textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'preferences' && <PreferencesSettings />}
          {activeTab === 'database' && <DatabaseSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings({ user }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', role: user?.role || '' })
  return (
    <div className="card">
      <div className="card-header"><h2 className="card-title">Profile Information</h2></div>
      <div style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-control" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-control" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} type="email" />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <input className="form-control" value={form.role} readOnly style={{ background: 'var(--bg-secondary)' }} />
        </div>
        <button className="btn btn-primary" onClick={() => toast.success('Profile saved (demo mode)')}>Save Changes</button>
      </div>
    </div>
  )
}

function PreferencesSettings() {
  return (
    <div className="card">
      <div className="card-header"><h2 className="card-title">Application Preferences</h2></div>
      <div style={{ maxWidth: 480 }}>
        {[
          { label: 'Currency', value: 'INR (₹ Indian Rupee)' },
          { label: 'Default Location', value: 'Bangalore' },
          { label: 'Unit System', value: 'Metric + Imperial (sqft, kg, cft)' },
          { label: 'Date Format', value: 'DD/MM/YYYY' },
          { label: 'Language', value: 'English' },
        ].map(({ label, value }) => (
          <div key={label} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-control" value={value} readOnly style={{ background: 'var(--bg-secondary)' }} />
          </div>
        ))}
        <button className="btn btn-primary" onClick={() => toast.success('Preferences saved')}>Save Preferences</button>
      </div>
    </div>
  )
}

function DatabaseSettings() {
  return (
    <div className="card">
      <div className="card-header"><h2 className="card-title">Database Information</h2></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Database Type', value: 'SQLite' },
          { label: 'Database File', value: 'database/ai_matesti.db' },
          { label: 'ORM', value: 'SQLAlchemy 2.0' },
          { label: 'Backend Framework', value: 'FastAPI + Uvicorn' },
          { label: 'API URL', value: 'http://localhost:8000/api' },
          { label: 'Swagger Docs', value: 'http://localhost:8000/docs' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: 16, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <span style={{ minWidth: 160, color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
            <span style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    estimation_complete: true,
    boq_generated: true,
    report_ready: true,
    project_updates: false,
  })
  return (
    <div className="card">
      <div className="card-header"><h2 className="card-title">Notification Preferences</h2></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(settings).map(([key, val]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ fontSize: 14 }}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            <input type="checkbox" checked={val} onChange={e => setSettings(s => ({...s, [key]: e.target.checked}))} />
          </label>
        ))}
        <button className="btn btn-primary" onClick={() => toast.success('Notification settings saved')}>Save Settings</button>
      </div>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="card">
      <div className="card-header"><h2 className="card-title">Security Settings</h2></div>
      <div style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className="form-control" type="password" placeholder="Enter current password" />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input className="form-control" type="password" placeholder="Enter new password" />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input className="form-control" type="password" placeholder="Confirm new password" />
        </div>
        <button className="btn btn-primary" onClick={() => toast.success('Password changed (demo mode)')}>Change Password</button>
      </div>
    </div>
  )
}

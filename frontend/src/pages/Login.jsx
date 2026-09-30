import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    const success = await login(form.email, form.password)
    setLoading(false)
    if (success) {
      navigate('/dashboard')
    } else {
      setError('Invalid email or password')
    }
  }

  const fillDemo = () => {
    setForm(f => ({ ...f, email: 'demo@aimatesti.com', password: 'demo1234' }))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 50%, #0ea5e9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, white 50px, white 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, white 50px, white 51px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'var(--primary)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Building2 size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>AI MatEsti</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Construction Estimation Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              marginBottom: 16, fontSize: 14, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: 38 }}
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={form.remember}
                onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
              />
              Remember me
            </label>
            <a href="#" style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 500 }}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 15, marginBottom: 12 }}
            disabled={loading}
          >
            {loading ? <><LoadingSpinner size={16} color="white" /> Signing in...</> : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={fillDemo}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
          >
            Use Demo Account
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          Demo: demo@aimatesti.com / demo1234
        </div>
      </div>
    </div>
  )
}

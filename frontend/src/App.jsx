import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/common/Sidebar'
import Topbar from './components/common/Topbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import DrawingAnalysis from './pages/DrawingAnalysis'
import MaterialEstimation from './pages/MaterialEstimation'
import CostEstimation from './pages/CostEstimation'
import BOQ from './pages/BOQ'
import Reports from './pages/Reports'
import Materials from './pages/Materials'
import Settings from './pages/Settings'
import Tender from './pages/Tender'

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid var(--primary-200)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading AI MatEsti...</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
      <Route path="/projects/:id" element={<ProtectedLayout><ProjectDetails /></ProtectedLayout>} />
      <Route path="/drawings" element={<ProtectedLayout><DrawingAnalysis /></ProtectedLayout>} />
      <Route path="/estimation" element={<ProtectedLayout><MaterialEstimation /></ProtectedLayout>} />
      <Route path="/cost" element={<ProtectedLayout><CostEstimation /></ProtectedLayout>} />
      <Route path="/boq" element={<ProtectedLayout><BOQ /></ProtectedLayout>} />
      <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="/materials" element={<ProtectedLayout><Materials /></ProtectedLayout>} />
      <Route path="/tender" element={<ProtectedLayout><Tender /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
    </AuthProvider>
  )
}

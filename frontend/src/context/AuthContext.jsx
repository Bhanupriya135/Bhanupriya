import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/reportService'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const res = await authService.login(email, password)
      const { access_token, user: userData } = res.data
      setToken(access_token)
      setUser(userData)
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      toast.success(`Welcome back, ${userData.name}!`)
      return true
    } catch (err) {
      toast.error(err.message || 'Login failed')
      return false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('prince_token')
    if (token) {
      authAPI.me()
        .then(data => setUser(data.user))
        .catch(() => localStorage.removeItem('prince_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    setError('')
    try {
      const data = await authAPI.login(email, password)
      localStorage.setItem('prince_token', data.token)
      setUser(data.user)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const register = async (name, email, password) => {
    setError('')
    try {
      const data = await authAPI.register(name, email, password)
      localStorage.setItem('prince_token', data.token)
      setUser(data.user)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('prince_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

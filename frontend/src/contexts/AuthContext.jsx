import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [csrfToken, setCsrfToken] = useState(null)

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getCSRF()
      setAuthenticated(data.authenticated)
      setCsrfToken(data.csrf_token)
    } catch (err) {
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (username, password) => {
    const data = await api.login(username, password)
    if (data.csrf_token) setCsrfToken(data.csrf_token)
    setAuthenticated(true)
    return data
  }

  const logout = async () => {
    await api.logout()
    setAuthenticated(false)
    setCsrfToken(null)
  }

  return (
    <AuthContext.Provider value={{ loading, authenticated, csrfToken, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

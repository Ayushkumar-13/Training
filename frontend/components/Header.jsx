import React, { useEffect, useState } from 'react'
import { useTheme } from '../lib/ThemeContext'
import { getAuthToken, clearAuthToken, getCookie } from '../lib/api'

export default function Header() {
  const { darkMode, toggleTheme } = useTheme()
  const [token, setToken] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    function syncAuthState() {
      const t = getAuthToken()
      const email = localStorage.getItem('user_email') || getCookie('user_email')
      const name = localStorage.getItem('user_name') || getCookie('user_name')

      if (t) {
        setToken(t)
        if (email) setUserEmail(email)
        if (name) setUserName(name)
      } else {
        // Clear stale user info immediately if no valid auth token exists
        setToken(null)
        setUserEmail('')
        setUserName('')
        clearAuthToken()
      }
    }

    syncAuthState()

    window.addEventListener('auth_logout', syncAuthState)
    window.addEventListener('auth_login', syncAuthState)
    window.addEventListener('storage', syncAuthState)

    return () => {
      window.removeEventListener('auth_logout', syncAuthState)
      window.removeEventListener('auth_login', syncAuthState)
      window.removeEventListener('storage', syncAuthState)
    }
  }, [])

  function handleLogout() {
    clearAuthToken()
    setToken(null)
    setUserEmail('')
    setUserName('')
    window.location.href = '/'
  }

  // Display user's Full Name / Title instead of email address
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'User')

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${darkMode ? 'bg-[#0d1322]/90 backdrop-blur-md border-slate-800/80 text-white shadow-lg shadow-black/20' : 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-900 shadow-sm'}`}>
      {/* Main Single Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 text-xl font-black tracking-tight hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            +
          </div>
          <span className={darkMode ? 'text-white' : 'text-slate-900'}>
            Med<span className={darkMode ? 'text-cyan-400' : 'text-cyan-600'}>Equip</span>
          </span>
        </a>

        <nav className={`hidden md:flex items-center gap-6 text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <a href="/products" className={`transition-colors ${darkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`}>Equipment Catalog</a>
          <a href="/wishlist" className={`transition-colors ${darkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`}>Wishlist</a>
          <a href="/cart" className={`transition-colors ${darkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`}>Cart</a>
          <a href="/orders" className={`transition-colors ${darkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`}>My Orders</a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'}`}
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <span>🌙 Dark</span> : <span>☀️ Light</span>}
          </button>

          {token ? (
            <div className="flex items-center gap-3">
              {/* Displays User Name instead of Email */}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${darkMode ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-cyan-50 text-cyan-900 border-cyan-200'}`}>
                👤 {displayName}
              </span>
              <button
                onClick={handleLogout}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${darkMode ? 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a href="/login" className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}>
                Sign In
              </a>
              <a href="/register" className="px-3.5 py-1.5 text-sm font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all">
                Register
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

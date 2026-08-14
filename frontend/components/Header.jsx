import React, { useEffect, useState } from 'react'
import { useTheme } from '../lib/ThemeContext'

export default function Header() {
  const { darkMode, toggleTheme } = useTheme()
  const [token, setToken] = useState(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('token')
    const email = localStorage.getItem('user_email')
    if (t) setToken(t)
    if (email) setUserEmail(email)
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user_email')
    window.location.href = '/'
  }

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-xl font-black tracking-tight hover:opacity-90 transition-opacity">
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
            className={`p-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'}`}
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <span>☀️ Light</span> : <span>🌙 Dark</span>}
          </button>

          {token ? (
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono font-bold hidden sm:inline ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>{userEmail}</span>
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

import { useState } from 'react'
import { useRouter } from 'next/router'
import { fetchJSON } from '../lib/api'
import { useTheme } from '../lib/ThemeContext'

export default function Register() {
  const { darkMode } = useTheme()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    setLoading(true)

    if (!email || !password || !fullName) {
      setErr('Full name, email, and password are required.')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    try {
      const res = await fetchJSON('/api/register', {
        method: 'POST',
        body: JSON.stringify({ email, full_name: fullName, password })
      })

      if (res && res.token) {
        localStorage.setItem('token', res.token)
        localStorage.setItem('user_email', email)
        router.push('/')
      }
    } catch (e) {
      setErr(e.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-md mx-auto px-4 py-16">
        <div className={`border p-8 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black">Create Account</h1>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Register for hospital or personal purchasing access.</p>
          </div>

          {err && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Full Name / Title</label>
              <input
                type="text"
                placeholder="Dr. Alex Morgan"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
              <input
                type="email"
                placeholder="alex.morgan@hospital.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-md transition-all"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>

            <div className="text-center pt-2">
              <a href="/login" className={`text-xs font-bold transition-colors ${darkMode ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'}`}>
                Already have an account? Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift())
  return null
}

export function setAuthToken(token, email = '', name = '') {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem('token', token)
    document.cookie = `token=${token}; Path=/; Max-Age=2592000; SameSite=Lax`
  }
  if (email) {
    localStorage.setItem('user_email', email)
    document.cookie = `user_email=${encodeURIComponent(email)}; Path=/; Max-Age=2592000; SameSite=Lax`
  }
  if (name) {
    localStorage.setItem('user_name', name)
    document.cookie = `user_name=${encodeURIComponent(name)}; Path=/; Max-Age=2592000; SameSite=Lax`
  }
  window.dispatchEvent(new Event('auth_login'))
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || getCookie('token') || localStorage.getItem('admin_token')
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user_email')
  localStorage.removeItem('user_name')
  localStorage.removeItem('admin_token')
  document.cookie = 'token=; Path=/; Max-Age=0;'
  document.cookie = 'user_email=; Path=/; Max-Age=0;'
  document.cookie = 'user_name=; Path=/; Max-Age=0;'
  document.cookie = 'admin_token=; Path=/; Max-Age=0;'
  window.dispatchEvent(new Event('auth_logout'))
}

export async function fetchJSON(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  try {
    const token = getAuthToken()
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`
    }
  } catch (e) {}

  let fullUrl = url
  if (url.startsWith('/api') && typeof window !== 'undefined') {
    const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    fullUrl = `${apiHost.replace(/\/$/, '')}${url}`
  }

  const res = await fetch(fullUrl, { ...opts, headers })
  if (!res.ok) {
    let errMessage = `${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      if (data.error) errMessage = data.error
    } catch (e) {
      const text = await res.text()
      if (text) errMessage = text
    }

    // Auto-logout user on 401 Unauthorized / Expired session
    if (res.status === 401 && typeof window !== 'undefined') {
      clearAuthToken()
    }

    throw new Error(errMessage)
  }
  return res.json()
}

export function formatPrice(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100)
}

export async function fetchJSON(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token')
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
    throw new Error(errMessage)
  }
  return res.json()
}

export function formatPrice(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100)
}


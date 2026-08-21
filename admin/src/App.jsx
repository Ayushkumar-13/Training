import { useEffect, useState } from 'react'

function AdminApp() {
  const [darkMode, setDarkMode] = useState(true)
  const [view, setView] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({ total_products: 0, total_orders: 0, total_revenue_cents: 0, pending_orders: 0, low_stock_items: 0 })
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)

  // Filters
  const [prodQuery, setProdQuery] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [condFilter, setCondFilter] = useState('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  // Form states
  const [loginEmail, setLoginEmail] = useState('ayush@medequip.com')
  const [loginPassword, setLoginPassword] = useState('AyushPass123!')

  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    price_cents: 48000000,
    category_id: '',
    is_refurbished: false,
    warranty_months: 24,
    inventory: 3,
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('medequip_admin_theme')
    if (savedTheme === 'light') setDarkMode(false)

    const t = localStorage.getItem('admin_token')
    if (t) {
      setToken(t)
    } else {
      performLogin('ayush@medequip.com', 'AyushPass123!')
    }
  }, [])

  function toggleTheme() {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('medequip_admin_theme', next ? 'dark' : 'light')
      return next
    })
  }

  const [reviews, setReviews] = useState([])

  useEffect(() => {
    if (token) {
      fetchProducts()
      fetchOrders()
      fetchUsers()
      fetchStats()
      fetchCategories()
      fetchReviews()
    }
  }, [view, token])

  async function fetchReviews(tok = null) {
    try {
      const data = await apiFetch('/api/admin/reviews', {}, tok)
      setReviews(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch reviews:', e)
    }
  }

  async function deleteReview(id) {
    if (!confirm(`Are you sure you want to delete review #${id}?`)) return
    try {
      await apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      fetchReviews()
      alert('Review deleted successfully')
    } catch (e) {
      alert('Failed to delete review: ' + e.message)
    }
  }

  const apiHost = 'http://localhost:8080'

  async function apiFetch(path, opts = {}, overrideToken = null) {
    const activeToken = overrideToken || token || localStorage.getItem('admin_token')
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`
    const res = await fetch(`${apiHost}${path}`, { ...opts, headers })
    if (res.status === 401 && !path.includes('/login')) {
      localStorage.removeItem('admin_token')
      setToken(null)
      performLogin('ayush@medequip.com', 'AyushPass123!')
      throw new Error('401 Unauthorized - Reauthenticating admin session')
    }
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err)
    }
    return res.json()
  }

  async function fetchProducts(tok = null) {
    setLoading(true)
    try {
      const data = await apiFetch('/api/products', {}, tok)
      setProducts(Array.isArray(data) ? data : (data.data || []))
    } catch (e) {
      console.error('fetchProducts', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrders(tok = null) {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/orders', {}, tok)
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('fetchOrders', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsers(tok = null) {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/users', {}, tok)
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('fetchUsers', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats(tok = null) {
    try {
      const data = await apiFetch('/api/admin/stats', {}, tok)
      setStats(data)
    } catch (e) {
      console.error('fetchStats', e)
    }
  }

  async function fetchCategories() {
    try {
      const data = await apiFetch('/api/categories')
      setCategories(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('fetchCategories', e)
    }
  }

  async function performLogin(email, password) {
    try {
      const res = await fetch(`${apiHost}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const j = await res.json()
      const tokenVal = j.token || (j.data && j.data.token)
      if (tokenVal) {
        localStorage.setItem('admin_token', tokenVal)
        setToken(tokenVal)
        setView('dashboard')
        fetchProducts(tokenVal)
        fetchOrders(tokenVal)
        fetchUsers(tokenVal)
        fetchStats(tokenVal)
        fetchCategories()
      } else {
        alert(j.error || 'Login failed: invalid credentials')
      }
    } catch (err) {
      console.error('Login error: ' + err.message)
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault()
    await performLogin(loginEmail, loginPassword)
  }

  function autoFillMarketProduct() {
    const firstCat = categories.length > 0 ? categories[0].id : ''
    setForm({
      sku: 'MRI-SIE-15T',
      name: 'Siemens MAGNETOM Alumina 1.5T MRI Scanner',
      description: 'High-field 1.5 Tesla magnetic resonance imaging system with BioMatrix Technology, 70 cm wide bore, Turbo Suite acceleration, and Deep Resolve AI reconstruction.',
      category_id: firstCat,
      price_cents: 48000000,
      warranty_months: 24,
      inventory: 3,
      is_refurbished: false,
    })
  }

  async function createProduct(e) {
    e.preventDefault()
    try {
      await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          description: form.description,
          price_cents: parseInt(form.price_cents),
          category_id: parseInt(form.category_id) || 1,
          is_refurbished: form.is_refurbished,
          warranty_months: parseInt(form.warranty_months),
          inventory: parseInt(form.inventory),
        }),
      })
      alert('Product created successfully!')
      setView('products')
      fetchProducts()
      fetchStats()
    } catch (err) {
      alert('Failed to create product: ' + err.message)
    }
  }

  // Real-Time WebSockets Engine (Broadcast Sync across Admin & Storefront)
  useEffect(() => {
    let wsUrl = 'ws://localhost:8080/api/ws'
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      wsUrl = `wss://${window.location.host}/api/ws`
    } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      wsUrl = `ws://${window.location.hostname}:8080/api/ws`
    }

    let socket = null
    let reconnectTimer = null
    let initTimer = null

    function connectWS() {
      try {
        socket = new WebSocket(wsUrl)
        socket.onopen = () => console.log('[ADMIN WEBSOCKET ENGINE] Connected & Active')
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'INVENTORY_UPDATED' && data.payload) {
              const { product_id, inventory } = data.payload
              setProducts((prev) =>
                prev.map((p) => (p.id === product_id ? { ...p, inventory } : p))
              )
            } else if (data.type === 'ORDER_CREATED' || data.type === 'ORDER_STATUS_UPDATED') {
              fetchOrders()
              fetchStats()
            } else if (data.type === 'REVIEW_ADDED') {
              fetchReviews()
            }
          } catch (err) {}
        }
        socket.onerror = () => {}
        socket.onclose = () => {
          reconnectTimer = setTimeout(connectWS, 3000)
        }
      } catch (err) {}
    }

    // Small delay to prevent React Strict Mode double-mount race condition
    initTimer = setTimeout(connectWS, 100)

    return () => {
      if (initTimer) clearTimeout(initTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (socket) {
        socket.onclose = null
        if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => {
            try { socket.close() } catch(e) {}
          }
        } else if (socket.readyState === WebSocket.OPEN) {
          try { socket.close() } catch(e) {}
        }
      }
    }
  }, [])

  async function adjustInventory(id, delta) {
    // 0ms Instant Optimistic In-Memory UI Update (Zero page reloads / zero flickering!)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, inventory: Math.max(0, (p.inventory || 0) + delta) }
          : p
      )
    )

    try {
      await apiFetch(`/api/products/${id}/inventory`, {
        method: 'PUT',
        body: JSON.stringify({ delta }),
      })
      // Background silent stats update
      fetchStats()
    } catch (e) {
      // Rollback on network failure
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, inventory: Math.max(0, (p.inventory || 0) - delta) }
            : p
        )
      )
      alert('Inventory update failed')
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this equipment listing?')) return
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
      fetchStats()
    } catch (e) {
      alert('Delete failed')
    }
  }

  async function clearAllProducts() {
    if (!confirm('Are you sure you want to delete ALL pre-seeded catalog items from the database?')) return
    try {
      await apiFetch('/api/admin/products/clear-all', { method: 'DELETE' })
      alert('Catalog cleared! Only items created by you will be present.')
      fetchProducts()
      fetchStats()
    } catch (e) {
      alert('Clear catalog failed: ' + e.message)
    }
  }

  function exportCSVReport() {
    if (orders.length === 0) {
      alert('No orders available to export.')
      return
    }
    const headers = ['Order ID', 'Customer Email', 'Address', 'City', 'State', 'Postal Code', 'Total Amount ($)', 'Payment Method', 'Payment ID', 'Status', 'Cancellation Reason', 'Created At']
    const rows = orders.map(o => [
      o.id,
      `"${o.user_email || ''}"`,
      `"${(o.shipping_address || '').replace(/"/g, '""')}"`,
      `"${(o.city || '').replace(/"/g, '""')}"`,
      `"${(o.state || '').replace(/"/g, '""')}"`,
      `"${(o.postal_code || '').replace(/"/g, '""')}"`,
      ((o.total_cents || 0) / 100).toFixed(2),
      o.payment_method,
      `"${o.payment_receipt_no || ''}"`,
      o.status,
      `"${(o.cancellation_reason || '').replace(/"/g, '""')}"`,
      `"${new Date(o.created_at).toLocaleString()}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `medequip_orders_audit_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function autoRestockLowStock() {
    const lowItems = products.filter(p => (p.inventory || 0) <= 2)
    if (lowItems.length === 0) {
      alert('All equipment listings currently have sufficient stock levels (> 2 units)!')
      return
    }
    setLoading(true)
    try {
      for (const item of lowItems) {
        await apiFetch(`/api/products/${item.id}/inventory`, {
          method: 'PUT',
          body: JSON.stringify({ delta: 10 })
        })
      }
      alert(`Successfully added +10 stock to ${lowItems.length} low-stock equipment item(s)!`)
      fetchProducts()
      fetchStats()
    } catch (e) {
      alert('Restock failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId, status) {
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      fetchOrders()
      fetchStats()
    } catch (e) {
      alert('Order status update failed')
    }
  }

  async function updateOrderReturnStatus(orderId, returnStatus) {
    try {
      await apiFetch(`/api/orders/${orderId}/return-status`, {
        method: 'PUT',
        body: JSON.stringify({ return_status: returnStatus }),
      })
      fetchOrders()
      fetchStats()
      alert(`Return status updated to '${returnStatus}'`)
    } catch (e) {
      alert('Return status update failed: ' + e.message)
    }
  }

  function logout() {
    localStorage.removeItem('admin_token')
    setToken(null)
    setView('dashboard')
  }

  const formatCurrency = (cents) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100)

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (prodQuery && !p.name.toLowerCase().includes(prodQuery.toLowerCase()) && !p.sku.toLowerCase().includes(prodQuery.toLowerCase())) return false
    if (selectedCat && p.category_id !== parseInt(selectedCat)) return false
    if (condFilter === 'new' && p.is_refurbished) return false
    if (condFilter === 'refurbished' && !p.is_refurbished) return false
    return true
  })

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false
    return true
  })

  // Filtered Users
  const filteredUsers = users.filter(u => {
    if (userQuery && !u.email.toLowerCase().includes(userQuery.toLowerCase()) && !(u.full_name || '').toLowerCase().includes(userQuery.toLowerCase())) return false
    return true
  })

  const lowStockCount = products.filter(p => (p.inventory || 0) <= 5).length

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-200 ${darkMode ? 'bg-[#0e1726]/90 border-slate-800 text-white shadow-md' : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-cyan-600/30">
              ⚡
            </div>
            <div>
              <span className="font-black text-lg tracking-tight">MedEquip B2B</span>
              <span className={`text-xs ml-2.5 px-2.5 py-0.5 rounded-full font-bold uppercase ${darkMode ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80' : 'bg-cyan-100 text-cyan-800 border border-cyan-200'}`}>
                Enterprise Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${darkMode ? 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'}`}
            >
              {darkMode ? <span>🌙 Dark</span> : <span>☀️ Light</span>}
            </button>

            {token ? (
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold hidden sm:inline ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>● Admin Session Active</span>
                <button
                  onClick={logout}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${darkMode ? 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('login')}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Navigation Tabs */}
        {token && (
          <div className={`flex flex-wrap items-center gap-2 p-2 rounded-2xl border shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                view === 'dashboard' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              📊 Overview Metrics
            </button>
            <button
              onClick={() => setView('products')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                view === 'products' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              📦 Equipment Inventory ({products.length})
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                view === 'create' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              + Create Product Listing
            </button>
            <button
              onClick={() => setView('orders')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                view === 'orders' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              🛒 Hospital Orders ({orders.length})
            </button>
            <button
              onClick={() => setView('users')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                view === 'users' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              👥 User Accounts ({users.length})
            </button>
            <button
              onClick={() => setView('reviews')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                view === 'reviews' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              ⭐ Customer Reviews ({reviews.length})
            </button>
          </div>
        )}

        {/* LOGIN VIEW */}
        {(!token || view === 'login') && (
          <div className="max-w-md mx-auto py-12">
            <form onSubmit={handleLoginSubmit} className={`border p-8 rounded-2xl shadow-xl ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-xl font-black mb-1">Clinical Admin Sign In</h2>
              <p className={`text-xs mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Enter your enterprise administrator credentials to manage products and fulfill orders.</p>

              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all"
                >
                  Sign In to Admin Dashboard
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DASHBOARD OVERVIEW */}
        {token && view === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Clinical Operations KPI Metrics</h2>
              <button
                onClick={() => { fetchStats(); fetchProducts(); fetchOrders(); fetchUsers(); }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${darkMode ? 'bg-[#101726] border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
                🔄 Refresh Stats
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active Devices</div>
                <div className="text-3xl font-black mt-2">{stats.total_products || products.length}</div>
                <div className="text-xs text-emerald-400 font-bold mt-1">Certified Hardware</div>
              </div>

              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total B2B Orders</div>
                <div className="text-3xl font-black mt-2">{stats.total_orders || orders.length}</div>
                <div className="text-xs text-cyan-400 font-bold mt-1">Hospital POs</div>
              </div>

              <div className={`border p-6 rounded-2xl shadow-sm relative overflow-hidden transition-all ${
                darkMode
                  ? 'bg-gradient-to-br from-emerald-950/40 via-[#101726] to-[#101726] border-emerald-800/50 text-slate-100 shadow-lg shadow-emerald-950/30'
                  : 'bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-200 text-slate-900 shadow-sm'
              }`}>
                <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <span>Gross Revenue</span>
                  <span className="text-base">💰</span>
                </div>
                <div className="text-2xl lg:text-2xl xl:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight whitespace-nowrap">
                  {formatCurrency(stats.total_revenue_cents)}
                </div>
                <div className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${darkMode ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
                  <span>✓</span> Cleared Payments & POs
                </div>
              </div>

              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pending Fulfillment</div>
                <div className="text-3xl font-black text-amber-400 mt-2">{stats.pending_orders}</div>
                <div className="text-xs text-amber-400 font-bold mt-1">Awaiting Shipment</div>
              </div>

              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>User Accounts</div>
                <div className="text-3xl font-black text-purple-400 mt-2">{users.length}</div>
                <div className="text-xs text-purple-400 font-bold mt-1">Registered Users</div>
              </div>
            </div>

            {/* Real Enterprise Operations Quick Actions */}
            <div className={`border p-6 rounded-2xl ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Quick Operations Utilities</h3>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Execute instant administrative batch actions, export audit reports, and sync system metrics.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={exportCSVReport}
                  className="px-5 py-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <span>📥</span> Export CSV Procurement Audit Log
                </button>
                <button
                  onClick={autoRestockLowStock}
                  className={`px-5 py-3 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'}`}
                >
                  <span>⚡</span> Auto-Restock Low Stock (&le; 2 Units)
                </button>
                <button
                  onClick={() => { setOrderStatusFilter('pending'); setView('orders'); }}
                  className={`px-5 py-3 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'}`}
                >
                  <span>🚨</span> Filter Urgent Pending Orders ({stats.pending_orders})
                </button>
                <button
                  onClick={() => { fetchStats(); fetchProducts(); fetchOrders(); fetchUsers(); alert('System state & cache successfully synchronized!'); }}
                  className={`px-5 py-3 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'}`}
                >
                  <span>🔄</span> Flush Cache & Sync Metrics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT TABLE */}
        {token && view === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Equipment Inventory & Stock Controls</h2>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Manage medical equipment catalog, adjust inventory levels, and delete listings.</p>
              </div>
              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <button
                    onClick={clearAllProducts}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${darkMode ? 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900' : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'}`}
                  >
                    🗑 Clear All Catalog Items
                  </button>
                )}
                <button
                  onClick={() => setView('create')}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 flex-shrink-0"
                >
                  + Add Equipment Listing
                </button>
              </div>
            </div>

            {/* Inventory Search & Filters */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-4 ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Filter by SKU or Name..."
                  value={prodQuery}
                  onChange={e => setProdQuery(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <select
                  value={selectedCat}
                  onChange={e => setSelectedCat(e.target.value)}
                  className={`px-3.5 py-2 text-xs rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={condFilter}
                  onChange={e => setCondFilter(e.target.value)}
                  className={`px-3.5 py-2 text-xs rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="all">All Conditions</option>
                  <option value="new">Certified New Only</option>
                  <option value="refurbished">Factory Refurbished</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 font-semibold animate-pulse">Loading equipment inventory...</div>
            ) : (
              <div className={`overflow-x-auto border rounded-2xl shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs uppercase font-bold border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">SKU</th>
                      <th className="px-6 py-4 whitespace-nowrap">Equipment Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Category</th>
                      <th className="px-6 py-4 whitespace-nowrap">Market Price</th>
                      <th className="px-6 py-4 whitespace-nowrap">Condition</th>
                      <th className="px-6 py-4 whitespace-nowrap">Stock Level</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4 font-mono font-bold text-cyan-400 whitespace-nowrap">{p.sku}</td>
                        <td className="px-6 py-4 font-bold text-slate-100">{p.name}</td>
                        <td className={`px-6 py-4 text-xs font-semibold whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {p.category_name || `Category #${p.category_id}`}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400 whitespace-nowrap">{formatCurrency(p.price_cents)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`whitespace-nowrap inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${
                            p.is_refurbished
                              ? (darkMode ? 'bg-amber-950/60 text-amber-300 border-amber-800/80' : 'bg-amber-100 text-amber-800 border-amber-300')
                              : (darkMode ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80' : 'bg-cyan-100 text-cyan-800 border-cyan-300')
                          }`}>
                            {p.is_refurbished ? 'Refurbished' : 'Certified New'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                            p.inventory <= 5
                              ? (darkMode ? 'bg-rose-950/60 text-rose-300 border-rose-800/80' : 'bg-rose-50 text-rose-700 border-rose-200')
                              : (darkMode ? 'bg-slate-800/80 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300')
                          }`}>
                            <span className="font-mono text-sm">{p.inventory}</span> units
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="whitespace-nowrap flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => adjustInventory(p.id, 5)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'}`}
                            >
                              +5 Stock
                            </button>
                            <button
                              onClick={() => adjustInventory(p.id, -1)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'}`}
                            >
                              -1 Stock
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CREATE PRODUCT FORM */}
        {token && view === 'create' && (
          <div className={`max-w-2xl mx-auto border p-8 rounded-2xl shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black">Create New Medical Equipment Listing</h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Prices are configured in Cents ($100.00 USD = 10000 cents).</p>
              </div>
              <button
                type="button"
                onClick={autoFillMarketProduct}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all"
              >
                ⚡ Auto-Fill Siemens MRI ($480k)
              </button>
            </div>

            <form onSubmit={createProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>SKU</label>
                  <input
                    placeholder="e.g. MRI-SIE-15T"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Equipment Name</label>
                <input
                  placeholder="e.g. Siemens MAGNETOM Alumina 1.5T MRI Scanner"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                <textarea
                  rows="3"
                  placeholder="High-field 1.5 Tesla magnetic resonance imaging system with BioMatrix Technology, 70 cm wide bore, Turbo Suite acceleration, and Deep Resolve AI reconstruction."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Market Price (Cents) <span className="text-cyan-400 font-mono font-bold block">{formatCurrency(form.price_cents)}</span>
                  </label>
                  <input
                    type="number"
                    value={form.price_cents}
                    onChange={(e) => setForm({ ...form, price_cents: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Warranty (Months)</label>
                  <input
                    type="number"
                    value={form.warranty_months}
                    onChange={(e) => setForm({ ...form, warranty_months: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Initial Stock</label>
                  <input
                    type="number"
                    value={form.inventory}
                    onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_refurbished}
                    onChange={(e) => setForm({ ...form, is_refurbished: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-sm font-bold">Is Factory Refurbished</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all"
              >
                Create Product Listing
              </button>
            </form>
          </div>
        )}

        {/* ORDERS MANAGEMENT TABLE */}
        {token && view === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Hospital Orders & Fulfillment Hub</h2>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Track customer procurement orders, payment modes, cancellation reasons, and update fulfillment.</p>
              </div>

              {/* Status Filter Tabs */}
              <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl uppercase transition-all ${orderStatusFilter === st ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 font-semibold animate-pulse">Loading hospital orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-[#101726] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                No hospital orders found matching status <strong className="text-cyan-400 font-mono">{orderStatusFilter}</strong>.
              </div>
            ) : (
              <div className={`w-full border rounded-2xl shadow-sm overflow-hidden ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs uppercase font-bold border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="px-4 py-3.5 whitespace-nowrap">Order ID</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Customer Email</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Address & Contact</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Total Amount</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Payment Method</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Status & Reason</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">Fulfillment Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-3.5 font-mono font-bold text-cyan-400 whitespace-nowrap">#{o.id}</td>
                        <td className={`px-4 py-3.5 text-xs font-mono font-bold whitespace-nowrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {o.user_email || `User #${o.user_id}`}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <div className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{o.shipping_address || 'Facility Address Unspecified'}</div>
                          <div className={`mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{o.city}{o.state ? `, ${o.state}` : ''} {o.postal_code}</div>
                          {o.phone && <div className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold mt-1">📞 {o.phone}</div>}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatCurrency(o.total_cents)}</td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          {o.payment_method === 'cod' ? (
                            <span className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                              darkMode ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              💵 Cash on Delivery (COD)
                            </span>
                          ) : o.payment_method === 'hospital_po' ? (
                            <span className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                              darkMode ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}>
                              🏥 Hospital PO Net 30
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                                darkMode ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                              }`}>
                                💳 Online (Razorpay)
                              </span>
                              <div className={`text-[11px] font-mono font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                💳 Payment ID: {o.payment_receipt_no || `PAY-RZP-2026-${(o.id * 18493 + 10293) % 900000 + 100000}`}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`whitespace-nowrap inline-flex items-center px-3 py-1 text-xs font-bold rounded-lg uppercase border ${
                            o.status === 'delivered' ? (darkMode ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' : 'bg-emerald-100 text-emerald-800 border-emerald-300') :
                            o.status === 'shipped' ? (darkMode ? 'bg-blue-950/80 text-blue-300 border-blue-800/80' : 'bg-blue-100 text-blue-800 border-blue-300') :
                            o.status === 'processing' ? (darkMode ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80' : 'bg-cyan-100 text-cyan-800 border-cyan-300') :
                            o.status === 'cancelled' ? (darkMode ? 'bg-rose-950/80 text-rose-300 border-rose-800/80' : 'bg-rose-100 text-rose-800 border-rose-300') :
                            (darkMode ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' : 'bg-amber-100 text-amber-800 border-amber-300')
                          }`}>
                            {o.status === 'processing' ? 'Shipped' : o.status === 'shipped' ? 'Out for Delivery' : o.status}
                          </span>

                          {o.cancellation_reason && (
                            <div className={`mt-2 text-xs font-semibold rounded-xl p-3 max-w-sm leading-relaxed shadow-sm border ${
                              darkMode ? 'text-rose-300 bg-rose-950/50 border-rose-800/80' : 'text-rose-900 bg-rose-50 border-rose-200'
                            }`}>
                              <span className="font-bold text-rose-600 dark:text-rose-400 block mb-0.5">⚠️ Cancellation Reason:</span>
                              <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>"{o.cancellation_reason}"</span>
                            </div>
                          )}

                          {o.return_status && o.return_status !== 'none' && (
                            <div className={`mt-2 text-xs font-semibold rounded-xl p-3 max-w-sm leading-relaxed shadow-sm border ${
                              darkMode ? 'text-amber-300 bg-amber-950/50 border-amber-800/80' : 'text-amber-900 bg-amber-50 border-amber-200'
                            }`}>
                              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">↺ Return Policy Request ({o.return_status.toUpperCase()}):</span>
                              <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>"{o.return_reason}"</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="whitespace-nowrap flex items-center justify-end gap-2">
                            {o.return_status === 'requested' && (
                              <>
                                <button
                                  onClick={() => updateOrderReturnStatus(o.id, 'approved')}
                                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 transition-all"
                                >
                                  Approve Return
                                </button>
                                <button
                                  onClick={() => updateOrderReturnStatus(o.id, 'refunded')}
                                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
                                >
                                  Process Refund
                                </button>
                              </>
                            )}
                            {o.status !== 'processing' && o.status !== 'shipped' && o.status !== 'delivered' && o.status !== 'cancelled' && (
                              <button
                                onClick={() => updateOrderStatus(o.id, 'processing')}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all"
                              >
                                Set Shipped
                              </button>
                            )}
                            {o.status !== 'shipped' && o.status !== 'delivered' && o.status !== 'cancelled' && (
                              <button
                                onClick={() => updateOrderStatus(o.id, 'shipped')}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all"
                              >
                                Set Out for Delivery
                              </button>
                            )}
                            {o.status !== 'delivered' && o.status !== 'cancelled' && (
                              <button
                                onClick={() => updateOrderStatus(o.id, 'delivered')}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
                              >
                                Set Delivered
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USERS MANAGEMENT TABLE */}
        {token && view === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Registered Hospital & User Accounts</h2>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Monitor customer accounts, access roles, and registered hospital emails.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter users by name or email..."
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  className={`px-3.5 py-2 text-xs rounded-xl border focus:outline-none w-64 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`}
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 font-semibold animate-pulse">Loading user accounts...</div>
            ) : filteredUsers.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-[#101726] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                No user accounts found matching query.
              </div>
            ) : (
              <div className={`overflow-x-auto border rounded-2xl shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs uppercase font-bold border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">User ID</th>
                      <th className="px-6 py-4 whitespace-nowrap">Full Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Email Address</th>
                      <th className="px-6 py-4 whitespace-nowrap">Role Permission</th>
                      <th className="px-6 py-4 whitespace-nowrap">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4 font-mono font-bold text-cyan-400 whitespace-nowrap">#{u.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-100 whitespace-nowrap">{u.full_name || 'Medical Practitioner'}</td>
                        <td className={`px-6 py-4 text-xs font-mono font-bold whitespace-nowrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`whitespace-nowrap inline-flex items-center px-3 py-1 text-xs font-bold rounded-lg uppercase border ${u.role === 'admin' ? 'bg-purple-950/80 text-purple-300 border-purple-800/80' : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'}`}>
                            {u.role === 'admin' ? '👑 System Admin' : '🏥 Hospital User'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-xs whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS & RATINGS MANAGEMENT TABLE */}
        {token && view === 'reviews' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Customer Equipment Reviews</h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Monitor customer satisfaction feedback, verified purchase badges, helpful votes, and delete inappropriate content.
                </p>
              </div>
            </div>

            {/* Production Rating Breakdown Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Reviews</div>
                <div className="text-3xl font-black text-amber-400 mt-2">{reviews.length}</div>
                <div className="text-xs text-amber-400 font-bold mt-1">Verified Submissions</div>
              </div>
              <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Average Star Rating</div>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '5.0'} ★
                </div>
                <div className="text-xs text-emerald-400 font-bold mt-1">Clinical Satisfaction Rate</div>
              </div>
              <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Verified Buyer Rate</div>
                <div className="text-3xl font-black text-cyan-400 mt-2">100%</div>
                <div className="text-xs text-cyan-400 font-bold mt-1">Verified Hospital Purchases</div>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-[#101726] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                No customer equipment reviews submitted yet.
              </div>
            ) : (
              <div className={`overflow-x-auto border rounded-2xl shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs uppercase font-bold border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Review ID</th>
                      <th className="px-6 py-4 whitespace-nowrap">Equipment Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Customer Email</th>
                      <th className="px-6 py-4 whitespace-nowrap">Star Rating</th>
                      <th className="px-6 py-4 whitespace-nowrap">Verification</th>
                      <th className="px-6 py-4 whitespace-nowrap">Review Feedback</th>
                      <th className="px-6 py-4 whitespace-nowrap">Helpful Votes</th>
                      <th className="px-6 py-4 whitespace-nowrap">Date</th>
                      <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {reviews.map((r) => (
                      <tr key={r.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4 font-mono font-bold text-cyan-400 whitespace-nowrap">#{r.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-100 whitespace-nowrap">{r.product_name || `Equipment #${r.product_id}`}</td>
                        <td className={`px-6 py-4 text-xs font-mono font-bold whitespace-nowrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{r.user_email || 'Customer'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/80 inline-flex items-center gap-1">
                            <span>★</span> {r.rating}.0
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 inline-flex items-center gap-1">
                            <span>✓</span> Verified Purchase
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-xs max-w-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                          "{r.review_text}"
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-cyan-400">
                          👍 {r.helpful_count || 0} votes
                        </td>
                        <td className={`px-6 py-4 text-xs whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => deleteReview(r.id)}
                            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/30 transition-all"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminApp

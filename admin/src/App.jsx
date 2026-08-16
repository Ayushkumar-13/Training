import { useEffect, useState } from 'react'

function AdminApp() {
  const [darkMode, setDarkMode] = useState(false)
  const [view, setView] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({ total_products: 0, total_orders: 0, total_revenue_cents: 0, pending_orders: 0, low_stock_items: 0 })
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)

  // Filters
  const [prodQuery, setProdQuery] = useState('')
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
    if (savedTheme === 'dark') setDarkMode(true)

    const t = localStorage.getItem('admin_token')
    if (t) setToken(t)
  }, [])

  function toggleTheme() {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('medequip_admin_theme', next ? 'dark' : 'light')
      return next
    })
  }

  useEffect(() => {
    if (token) {
      if (view === 'products' || view === 'dashboard') fetchProducts()
      if (view === 'orders' || view === 'dashboard') fetchOrders()
      if (view === 'dashboard') fetchStats()
      fetchCategories()
    }
  }, [view, token])

  const apiHost = 'http://localhost:8080'

  async function apiFetch(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${apiHost}${path}`, { ...opts, headers })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err)
    }
    return res.json()
  }

  async function fetchProducts() {
    setLoading(true)
    try {
      const data = await apiFetch('/api/products')
      setProducts(Array.isArray(data) ? data : (data.data || []))
    } catch (e) {
      console.error('fetchProducts', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrders() {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('fetchOrders', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const data = await apiFetch('/api/admin/stats')
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
      } else {
        alert(j.error || 'Login failed: invalid credentials')
      }
    } catch (err) {
      alert('Login error: ' + err.message)
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
      price_cents: 48000000, // Actual Siemens MRI Market Price: $480,000.00 USD
      warranty_months: 24,
      inventory: 3,
      is_refurbished: false,
    })
  }

  async function createProduct(e) {
    e.preventDefault()
    try {
      if (!form.sku || !form.name) {
        alert('SKU and Name are required')
        return
      }
      await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          price_cents: parseInt(form.price_cents) || 0,
          category_id: form.category_id ? parseInt(form.category_id) : null,
          warranty_months: parseInt(form.warranty_months) || 0,
          inventory: parseInt(form.inventory) || 0,
        }),
      })
      alert('Siemens MAGNETOM Alumina 1.5T MRI Scanner created successfully!')
      setForm({ sku: '', name: '', description: '', price_cents: 48000000, category_id: '', is_refurbished: false, warranty_months: 24, inventory: 3 })
      setView('products')
    } catch (err) {
      alert('Create product failed: ' + err.message)
    }
  }

  async function adjustInventory(id, delta) {
    try {
      await apiFetch(`/api/products/${id}/inventory`, {
        method: 'PUT',
        body: JSON.stringify({ delta }),
      })
      fetchProducts()
      fetchStats()
    } catch (e) {
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

  const lowStockCount = products.filter(p => (p.inventory || 0) <= 5).length

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-50 border-b transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
              +
            </div>
            <div>
              <span className={`font-black text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>Med<span className={darkMode ? 'text-cyan-400' : 'text-cyan-600'}>Equip</span></span>
              <span className={`text-xs font-bold px-2.5 py-0.5 ml-2 rounded-full border ${darkMode ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-cyan-50 text-cyan-800 border-cyan-200'}`}>
                Enterprise Operations Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'}`}
              title="Toggle Theme"
            >
              {darkMode ? <span>🌙 Dark</span> : <span>☀️ Light</span>}
            </button>

            {token ? (
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold hidden sm:inline ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>● Admin Session Active</span>
                <button
                  onClick={logout}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${darkMode ? 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('login')}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
        {token && (
          <div className={`flex flex-wrap items-center gap-2 mb-8 p-2 rounded-xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                view === 'dashboard' ? 'bg-cyan-600 text-white shadow-sm' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              📊 Overview Metrics
            </button>
            <button
              onClick={() => setView('products')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                view === 'products' ? 'bg-cyan-600 text-white shadow-sm' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              📦 Equipment Inventory ({products.length})
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                view === 'create' ? 'bg-cyan-600 text-white shadow-sm' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              + Create Product Listing
            </button>
            <button
              onClick={() => setView('orders')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                view === 'orders' ? 'bg-cyan-600 text-white shadow-sm' : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              🛒 Hospital Orders ({orders.length})
            </button>
          </div>
        )}

        {/* LOGIN VIEW */}
        {(!token || view === 'login') && (
          <div className="max-w-md mx-auto py-12">
            <form onSubmit={handleLoginSubmit} className={`border p-8 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-2xl font-black mb-1">MedEquip Admin Sign In</h2>
              <p className={`text-xs mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Authenticate with administrative credentials.</p>

              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Admin Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
                >
                  Sign In to Console
                </button>

                {/* Quick Auto-Fill / One-Click Login Options */}
                <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className={`text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Verified Enterprise Accounts:</div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => performLogin('ayush@medequip.com', 'AyushPass123!')}
                      className={`w-full py-2 text-xs font-bold rounded-lg border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-cyan-800 hover:bg-slate-200'}`}
                    >
                      👤 Log In as Ayush Kumar (ayush@medequip.com)
                    </button>
                    <button
                      type="button"
                      onClick={() => performLogin('admin@medequip.com', 'AdminPass123!')}
                      className={`w-full py-2 text-xs font-bold rounded-lg border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
                    >
                      🔑 Log In as Executive Admin (admin@medequip.com)
                    </button>
                  </div>
                </div>
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
                onClick={() => { fetchStats(); fetchProducts(); fetchOrders(); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
                🔄 Refresh Stats
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active Devices</div>
                <div className="text-3xl font-black mt-2">{stats.total_products || products.length}</div>
                <div className="text-xs text-emerald-500 font-bold mt-1">Certified Hardware</div>
              </div>

              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total B2B Orders</div>
                <div className="text-3xl font-black mt-2">{stats.total_orders || orders.length}</div>
                <div className="text-xs text-cyan-500 font-bold mt-1">Hospital POs</div>
              </div>

              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gross Revenue</div>
                <div className="text-3xl font-black text-emerald-500 mt-2">{formatCurrency(stats.total_revenue_cents)}</div>
                <div className={`text-xs font-semibold mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cleared Payments</div>
              </div>

              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pending Fulfillment</div>
                <div className="text-3xl font-black text-amber-500 mt-2">{stats.pending_orders}</div>
                <div className="text-xs text-amber-500 font-bold mt-1">Awaiting Shipment</div>
              </div>

              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Low-Stock Alerts</div>
                <div className="text-3xl font-black text-rose-500 mt-2">{lowStockCount}</div>
                <div className="text-xs text-rose-500 font-bold mt-1">Stock ≤ 5 Units</div>
              </div>
            </div>

            {/* Operations Quick Actions */}
            <div className={`border p-6 rounded-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-lg font-bold mb-4">Quick Operations Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setView('create')}
                  className="px-5 py-3 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                >
                  + Add New Equipment Listing
                </button>
                <button
                  onClick={() => setView('products')}
                  className={`px-5 py-3 text-xs font-bold rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'}`}
                >
                  📦 Manage Equipment Stock
                </button>
                <button
                  onClick={() => setView('orders')}
                  className={`px-5 py-3 text-xs font-bold rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'}`}
                >
                  🛒 Fulfill Hospital Orders
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
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${darkMode ? 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900' : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'}`}
                  >
                    🗑 Clear All Catalog Items
                  </button>
                )}
                <button
                  onClick={() => setView('create')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm flex-shrink-0"
                >
                  + Add Equipment Listing
                </button>
              </div>
            </div>

            {/* Inventory Search & Filters */}
            <div className={`p-4 rounded-xl border flex flex-wrap items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Filter by SKU or Name..."
                  value={prodQuery}
                  onChange={e => setProdQuery(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <select
                  value={selectedCat}
                  onChange={e => setSelectedCat(e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
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
                  className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="all">All Conditions</option>
                  <option value="new">New Only</option>
                  <option value="refurbished">Refurbished Only</option>
                </select>
              </div>

              {(prodQuery || selectedCat || condFilter !== 'all') && (
                <button
                  onClick={() => { setProdQuery(''); setSelectedCat(''); setCondFilter('all'); }}
                  className="text-xs font-bold text-cyan-500 hover:text-cyan-400"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-12 text-center text-slate-500 font-semibold animate-pulse">Loading equipment inventory...</div>
            ) : (
              <div className={`overflow-x-auto border rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs uppercase font-bold border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Equipment Name</th>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">Condition</th>
                      <th className="px-6 py-4">Market Price</th>
                      <th className="px-6 py-4">Stock Level</th>
                      <th className="px-6 py-4 text-right">Inventory Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                        <td className={`px-6 py-4 font-mono text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.id}</td>
                        <td className="px-6 py-4 font-bold">{p.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-cyan-500 font-bold">{p.sku}</td>
                        <td className="px-6 py-4">
                          {p.is_refurbished ? (
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded border ${darkMode ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>Refurbished</span>
                          ) : (
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded border ${darkMode ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>New</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-500">{formatCurrency(p.price_cents)}</td>
                        <td className="px-6 py-4 font-bold">
                          <span className={`px-2.5 py-1 rounded text-xs border ${p.inventory <= 5 ? (darkMode ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200') : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800')}`}>
                            {p.inventory} units
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => adjustInventory(p.id, 5)}
                            className={`px-2.5 py-1 text-xs font-bold rounded border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'}`}
                          >
                            +5 Stock
                          </button>
                          <button
                            onClick={() => adjustInventory(p.id, -1)}
                            className={`px-2.5 py-1 text-xs font-bold rounded border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'}`}
                          >
                            -1 Stock
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className={`px-2.5 py-1 text-xs font-bold rounded border transition-colors ${darkMode ? 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900' : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'}`}
                          >
                            Delete
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

        {/* CREATE PRODUCT FORM */}
        {token && view === 'create' && (
          <div className={`max-w-2xl mx-auto border p-8 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black">Create New Medical Equipment Listing</h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Prices are configured in Cents ($100.00 USD = 10000 cents).</p>
              </div>
              <button
                type="button"
                onClick={autoFillMarketProduct}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                ⚡ Auto-Fill Real Siemens MRI ($480k)
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
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
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
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                <textarea
                  rows="3"
                  placeholder="High-field 1.5 Tesla magnetic resonance imaging system with BioMatrix Technology, 70 cm wide bore, Turbo Suite acceleration, and Deep Resolve AI reconstruction."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-medium focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Market Price (Cents) <span className="text-cyan-500 font-mono font-bold block">{formatCurrency(form.price_cents)}</span>
                  </label>
                  <input
                    type="number"
                    value={form.price_cents}
                    onChange={(e) => setForm({ ...form, price_cents: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Warranty (Months)</label>
                  <input
                    type="number"
                    value={form.warranty_months}
                    onChange={(e) => setForm({ ...form, warranty_months: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Initial Stock</label>
                  <input
                    type="number"
                    value={form.inventory}
                    onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
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
                className="w-full py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
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
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Track placed customer orders and update shipment fulfillment status.</p>
              </div>

              {/* Status Filter Tabs */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {['all', 'pending', 'processing', 'shipped', 'delivered'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all ${orderStatusFilter === st ? 'bg-cyan-600 text-white shadow-sm' : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 font-semibold animate-pulse">Loading hospital orders...</div>
            ) : (
              <div className={`overflow-x-auto border rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left text-sm">
                  <thead className={`text-xs uppercase font-bold border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer Email</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Placed Date</th>
                      <th className="px-6 py-4 text-right">Fulfillment Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4 font-mono font-bold">#{o.id}</td>
                        <td className={`px-6 py-4 text-xs font-mono font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{o.user_email || `User #${o.user_id}`}</td>
                        <td className="px-6 py-4 font-bold text-emerald-500">{formatCurrency(o.total_cents)}</td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-cyan-500">
                          {o.payment_method === 'hospital_po' ? 'Hospital PO' : 'Demo Credit Card'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded uppercase border ${o.status === 'delivered' ? (darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300') : (darkMode ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300')}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {o.status !== 'processing' && o.status !== 'shipped' && o.status !== 'delivered' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'processing')}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                            >
                              Mark Processing
                            </button>
                          )}
                          {o.status !== 'shipped' && o.status !== 'delivered' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'shipped')}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                            >
                              Mark Shipped
                            </button>
                          )}
                          {o.status !== 'delivered' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'delivered')}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                            >
                              Mark Delivered
                            </button>
                          )}
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

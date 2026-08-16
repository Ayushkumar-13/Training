import { useEffect, useState } from 'react'
import ProductCard from '../../components/ProductCard'
import SkeletonCard from '../../components/SkeletonCard'
import ScrollReveal from '../../components/ScrollReveal'
import ScrollRevealText from '../../components/ScrollRevealText'
import { fetchJSON, clearAuthToken } from '../../lib/api'
import { useTheme } from '../../lib/ThemeContext'

export default function Catalog() {
  const { darkMode } = useTheme()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Radio Filters
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all') // 'all', 'new', 'refurbished'

  useEffect(() => {
    fetchJSON('/api/categories')
      .then(cats => setCategories(Array.isArray(cats) ? cats : []))
      .catch(console.error)

    fetchJSON('/api/wishlist')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data || [])
        setWishlistIds(list.map(i => i.id || i.product_id))
      })
      .catch(() => [])
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    let url = `/api/products?sort=newest`
    fetchJSON(url)
      .then(data => {
        if (mounted) {
          const list = Array.isArray(data) ? data : (data.data || [])
          setProducts(list)
        }
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  async function addToCart(id) {
    try {
      await fetchJSON('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: id, quantity: 1 })
      })
      alert('Product added to MedEquip cart!')
    } catch (err) {
      if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token')) {
        clearAuthToken()
        if (confirm('You are not signed in or your session has expired. Would you like to log in now?')) {
          window.location.href = '/login'
        }
      } else {
        alert(err.message || 'Failed to add item to cart.')
      }
    }
  }

  async function addToWishlist(id, nextState) {
    try {
      const isCurrentlyInWishlist = wishlistIds.includes(id)
      if (nextState === false || isCurrentlyInWishlist) {
        await fetchJSON(`/api/wishlist/${id}`, { method: 'DELETE' })
        setWishlistIds(prev => prev.filter(wId => wId !== id))
      } else {
        await fetchJSON('/api/wishlist', {
          method: 'POST',
          body: JSON.stringify({ product_id: id })
        })
        setWishlistIds(prev => [...prev, id])
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token')) {
        clearAuthToken()
        if (confirm('You are not signed in or your session has expired. Would you like to log in now?')) {
          window.location.href = '/login'
        }
      } else {
        alert(err.message || 'Failed to update wishlist.')
      }
      throw err
    }
  }

  // Extract manufacturer brand name from product name
  function getBrandName(p) {
    const name = (p.name || '').toLowerCase()
    if (name.includes('siemens')) return 'Siemens'
    if (name.includes('ge')) return 'GE Healthcare'
    if (name.includes('philips')) return 'Philips'
    if (name.includes('mindray')) return 'Mindray'
    if (name.includes('hamilton')) return 'Hamilton Medical'
    if (name.includes('b. braun') || name.includes('braun')) return 'B. Braun'
    if (name.includes('getinge') || name.includes('maquet')) return 'Getinge Maquet'
    if (name.includes('dräger') || name.includes('drager')) return 'Dräger'
    if (name.includes('medtronic')) return 'Medtronic'
    return p.category_name || 'Certified Brand'
  }

  // Available brands derived from current dataset
  const availableBrands = [
    { id: 'all', label: 'All Brands' },
    { id: 'ge-healthcare', label: 'GE Healthcare' },
    { id: 'philips', label: 'Philips' },
    { id: 'siemens', label: 'Siemens' },
    { id: 'mindray', label: 'Mindray' },
    { id: 'hamilton', label: 'Hamilton' },
    { id: 'b-braun', label: 'B. Braun' },
    { id: 'getinge', label: 'Getinge Maquet' },
    { id: 'drager', label: 'Dräger' },
    { id: 'medtronic', label: 'Medtronic' },
  ]

  // Filter products based on search query, category, brand, and condition
  const filteredProducts = products.filter(p => {
    // Search Query
    if (query.trim()) {
      const q = query.toLowerCase()
      const matchName = p.name ? p.name.toLowerCase().includes(q) : false
      const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false
      const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false
      if (!matchName && !matchSku && !matchDesc) return false
    }

    // Category Filter
    if (selectedCategory !== 'all') {
      if (p.category_id !== parseInt(selectedCategory) && p.category_slug !== selectedCategory) {
        return false
      }
    }

    // Brand Filter
    if (selectedBrand !== 'all') {
      const pName = (p.name || '').toLowerCase()
      if (selectedBrand === 'ge-healthcare' && !pName.includes('ge') && !pName.includes('general electric')) return false
      if (selectedBrand === 'philips' && !pName.includes('philips')) return false
      if (selectedBrand === 'siemens' && !pName.includes('siemens')) return false
      if (selectedBrand === 'mindray' && !pName.includes('mindray')) return false
      if (selectedBrand === 'hamilton' && !pName.includes('hamilton')) return false
      if (selectedBrand === 'b-braun' && !pName.includes('braun')) return false
      if (selectedBrand === 'getinge' && !pName.includes('getinge') && !pName.includes('maquet')) return false
      if (selectedBrand === 'drager' && !pName.includes('dräger') && !pName.includes('drager')) return false
      if (selectedBrand === 'medtronic' && !pName.includes('medtronic')) return false
    }

    // Condition Filter
    if (conditionFilter === 'new' && p.is_refurbished) return false
    if (conditionFilter === 'refurbished' && !p.is_refurbished) return false

    return true
  })

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Title Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Equipment Catalog</h1>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Browse certified diagnostic imaging, patient monitoring, and surgical equipment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Showing <span className="text-cyan-500 font-black">{filteredProducts.length}</span> devices
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Sticky Left Sidebar Radio Filters */}
          <aside className={`lg:col-span-1 border p-6 rounded-2xl shadow-sm sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            
            {/* Search Input */}
            <div className="mb-6">
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Search Catalog
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. MRI, Monitor, Pump..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Radio Group (Pulled dynamically from backend DB) */}
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-cyan-600 dark:text-cyan-400">Category</h3>
              <div className="space-y-2 text-xs font-semibold">
                <label className="flex items-center gap-2.5 cursor-pointer hover:text-cyan-500 transition-colors">
                  <input
                    type="radio"
                    name="category_filter"
                    checked={selectedCategory === 'all'}
                    onChange={() => setSelectedCategory('all')}
                    className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className={selectedCategory === 'all' ? 'font-bold text-cyan-600 dark:text-cyan-400' : (darkMode ? 'text-slate-300' : 'text-slate-700')}>All Categories</span>
                </label>

                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer hover:text-cyan-500 transition-colors">
                    <input
                      type="radio"
                      name="category_filter"
                      checked={selectedCategory === String(cat.id) || selectedCategory === cat.slug}
                      onChange={() => setSelectedCategory(String(cat.id))}
                      className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={selectedCategory === String(cat.id) || selectedCategory === cat.slug ? 'font-bold text-cyan-600 dark:text-cyan-400' : (darkMode ? 'text-slate-300' : 'text-slate-700')}>
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Radio Group */}
            <div className="mb-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-cyan-600 dark:text-cyan-400">Brand</h3>
              <div className="space-y-2 text-xs font-semibold">
                {availableBrands.map(brand => (
                  <label key={brand.id} className="flex items-center gap-2.5 cursor-pointer hover:text-cyan-500 transition-colors">
                    <input
                      type="radio"
                      name="brand_filter"
                      checked={selectedBrand === brand.id}
                      onChange={() => setSelectedBrand(brand.id)}
                      className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={selectedBrand === brand.id ? 'font-bold text-cyan-600 dark:text-cyan-400' : (darkMode ? 'text-slate-300' : 'text-slate-700')}>
                      {brand.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condition Radio Group */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-cyan-600 dark:text-cyan-400">Condition</h3>
              <div className="space-y-2 text-xs font-semibold">
                {[
                  { id: 'all', label: 'All Conditions' },
                  { id: 'new', label: 'New' },
                  { id: 'refurbished', label: 'Refurbished' },
                ].map(cond => (
                  <label key={cond.id} className="flex items-center gap-2.5 cursor-pointer hover:text-cyan-500 transition-colors">
                    <input
                      type="radio"
                      name="condition_filter"
                      checked={conditionFilter === cond.id}
                      onChange={() => setConditionFilter(cond.id)}
                      className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={conditionFilter === cond.id ? 'font-bold text-cyan-600 dark:text-cyan-400' : (darkMode ? 'text-slate-300' : 'text-slate-700')}>
                      {cond.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            {(selectedCategory !== 'all' || selectedBrand !== 'all' || conditionFilter !== 'all' || query) && (
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedBrand('all'); setConditionFilter('all'); setQuery(''); }}
                className={`w-full mt-6 py-2 text-xs font-bold rounded-lg border transition-all ${darkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}`}
              >
                Reset All Filters
              </button>
            )}
          </aside>

          {/* Catalog View Panel */}
          <section className="lg:col-span-3 space-y-6">
            
            {/* View Layout Toggle Bar */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold">
                Showing <span className="text-cyan-500 font-extrabold">{filteredProducts.length}</span> products
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600')}`}
                  title="Grid View Layout"
                >
                  🎛 Grid View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600')}`}
                  title="List View Layout"
                >
                  ☰ List View
                </button>
              </div>
            </div>

            {/* Equipment Grid / List */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={`border p-12 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold">No medical equipment matches your selected filter criteria</h3>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Try resetting category or brand selection filters.</p>
                <button
                  onClick={() => { setSelectedCategory('all'); setSelectedBrand('all'); setConditionFilter('all'); setQuery(''); }}
                  className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-cyan-600 text-white shadow-sm hover:bg-cyan-500 transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p, idx) => (
                  <ScrollReveal key={p.id} animation="fade-up" delay={(idx % 6) * 90}>
                    <ProductCard
                      product={p}
                      isWishlisted={wishlistIds.includes(p.id)}
                      onAddToCart={addToCart}
                      onWishlist={addToWishlist}
                    />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              /* List View Mode */
              <div className="space-y-4">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={(e) => {
                      if (!e.target.closest('button')) {
                        window.location.href = `/products/${p.id}`
                      }
                    }}
                    className={`border p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6 cursor-pointer hover:shadow-md transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                  >
                    <div className="w-36 h-28 bg-slate-100 dark:bg-slate-950 rounded-xl p-2 flex items-center justify-center flex-shrink-0">
                      <img
                        src={p.image_url || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{getBrandName(p)}</div>
                      <h3 className="font-bold text-lg hover:text-cyan-500 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{p.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0 space-y-2">
                      <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">${((p.price_cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p.id); }}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                      >
                        + Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

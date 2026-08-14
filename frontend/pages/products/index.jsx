import { useEffect, useState } from 'react'
import ProductCard from '../../components/ProductCard'
import SkeletonCard from '../../components/SkeletonCard'
import { fetchJSON } from '../../lib/api'
import { useTheme } from '../../lib/ThemeContext'

export default function Catalog() {
  const { darkMode } = useTheme()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [conditionFilter, setConditionFilter] = useState('all') // 'all', 'new', 'refurbished'
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    fetchJSON('/api/categories')
      .then(cats => setCategories(Array.isArray(cats) ? cats : []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    let url = `/api/products?sort=${sort}`
    if (query.trim()) url += `&q=${encodeURIComponent(query.trim())}`
    if (selectedCategory) url += `&category_slug=${encodeURIComponent(selectedCategory)}`
    if (conditionFilter === 'refurbished') url += `&is_refurbished=true`
    if (conditionFilter === 'new') url += `&is_refurbished=false`
    if (minPrice) url += `&min_price_cents=${parseInt(minPrice) * 100}`
    if (maxPrice) url += `&max_price_cents=${parseInt(maxPrice) * 100}`

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
  }, [query, selectedCategory, conditionFilter, minPrice, maxPrice, sort])

  function resetAllFilters() {
    setQuery('')
    setSelectedCategory('')
    setConditionFilter('all')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
  }

  async function addToCart(id) {
    try {
      await fetchJSON('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: id, quantity: 1 })
      })
      alert('Product added to MedEquip cart!')
    } catch (err) {
      alert('Please log in to add items to cart.')
    }
  }

  async function addToWishlist(id) {
    try {
      await fetchJSON('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ product_id: id })
      })
      alert('Added to MedEquip wishlist!')
    } catch (err) {
      alert('Please log in to manage your wishlist.')
    }
  }

  const activeFiltersCount = (query ? 1 : 0) + (selectedCategory ? 1 : 0) + (conditionFilter !== 'all' ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Equipment Catalog</h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Inspect certified medical-grade diagnostic, monitoring, and life support systems.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Showing <span className={darkMode ? 'text-cyan-400' : 'text-cyan-700'}>{products.length}</span> devices
            </span>

            <div className="flex items-center gap-2">
              <label className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Sort:</label>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border shadow-sm focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-800'}`}
              >
                <option value="newest">Newest Additions</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <aside className={`lg:col-span-1 border p-6 rounded-2xl shadow-sm h-fit ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider">Filter Catalog</h2>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400">
                  {activeFiltersCount} Active
                </span>
              )}
            </div>

            <div className="space-y-6">
              {/* Search Query */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Search Query</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. X-Ray, Pump, Monitor..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Equipment Condition Segmented Selector */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Equipment Condition</label>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setConditionFilter('all')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${conditionFilter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setConditionFilter('new')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${conditionFilter === 'new' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    New
                  </button>
                  <button
                    onClick={() => setConditionFilter('refurbished')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${conditionFilter === 'refurbished' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Refurbished
                  </button>
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Price Range ($ USD)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                  <input
                    type="number"
                    placeholder="Max $"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
              </div>

              {/* Reset Action */}
              <button
                onClick={resetAllFilters}
                className={`w-full py-2.5 text-xs font-bold rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}
              >
                Reset All Filters
              </button>
            </div>
          </aside>

          {/* Catalog Grid */}
          <section className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className={`border p-12 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold">No medical equipment matches your filter criteria</h3>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Try adjusting query terms, price bounds, or resetting category parameters.</p>
                <button
                  onClick={resetAllFilters}
                  className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-cyan-600 text-white shadow-sm hover:bg-cyan-500 transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={addToCart} onWishlist={addToWishlist} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

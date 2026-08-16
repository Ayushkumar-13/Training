import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import SkeletonCard from '../components/SkeletonCard'
import ScrollReveal from '../components/ScrollReveal'
import ScrollRevealText from '../components/ScrollRevealText'
import { fetchJSON, clearAuthToken } from '../lib/api'
import { useTheme } from '../lib/ThemeContext'

export default function Home() {
  const { darkMode } = useTheme()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetchJSON('/api/products?limit=6'),
      fetchJSON('/api/categories').catch(() => []),
      fetchJSON('/api/wishlist').catch(() => [])
    ])
      .then(([prods, cats, wish]) => {
        if (mounted) {
          const list = Array.isArray(prods) ? prods : (prods.data || [])
          setProducts(list)
          setCategories(Array.isArray(cats) ? cats : [])
          const wList = Array.isArray(wish) ? wish : (wish.data || [])
          setWishlistIds(wList.map(item => item.id || item.product_id))
        }
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

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

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Hero Banner */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gradient-to-b from-slate-100 via-cyan-50/40 to-slate-50 border-slate-200 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <ScrollReveal animation="fade-down" delay={100}>
              <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border ${darkMode ? 'bg-cyan-950 border-cyan-800 text-cyan-400' : 'bg-cyan-100 border-cyan-300 text-cyan-800'}`}>
                MedEquip Systems • Enterprise Healthcare Procurement
              </div>
            </ScrollReveal>

            <ScrollRevealText
              as="h1"
              text="Hospital-Grade Equipment. Guaranteed Precision."
              className={`text-4xl sm:text-5xl font-black tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}
              delay={200}
            />

            <ScrollReveal animation="fade-up" delay={400}>
              <p className={`mt-4 text-base leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                MedEquip supplies certified diagnostic, ICU, respiratory, and surgical equipment with full compliance warranties and rapid clinical dispatch.
              </p>
            </ScrollReveal>

            {/* Quick Search Bar */}
            <ScrollReveal animation="fade-up" delay={500}>
              <form onSubmit={handleSearchSubmit} className="mt-8 flex gap-2 max-w-lg">
                <input
                  type="text"
                  placeholder="Search equipment (e.g. X-Ray, Pump, Monitor)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full px-4 py-3 text-sm rounded-xl border focus:outline-none shadow-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                />
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all flex-shrink-0"
                >
                  Search
                </button>
              </form>
            </ScrollReveal>

            {/* Category Quick Pills */}
            <ScrollReveal animation="fade-up" delay={600}>
              <div className="mt-6 flex flex-wrap gap-2">
                {categories.slice(0, 4).map(cat => (
                  <a
                    key={cat.id}
                    href={`/products?category_id=${cat.id}`}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'}`}
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal animation="fade-left" delay={300}>
            <div className="relative">
              <div className={`w-full h-80 rounded-2xl border p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group cursor-pointer ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-300'}`} onClick={() => window.location.href = '/products'}>
                <img
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
                  alt="Medical Equipment"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`relative z-10 p-5 rounded-xl border backdrop-blur-sm ${darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'}`}>
                  <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Featured Device</span>
                  <h3 className="text-xl font-bold mt-1">Multi-Parameter ICU Patient Monitor PM-500</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>ECG, SpO2, NIBP, Respiration, Temp module with 12-month clinical warranty.</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Medical Equipment Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScrollReveal animation="fade-up" delay={100} className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black tracking-tight">Browse Clinical Categories</h2>
          <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>High-performance medical systems tailored for hospitals, clinics, and emergency centers.</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.slice(0, 5).map((cat, idx) => (
            <ScrollReveal key={cat.id || idx} animation="fade-up" delay={150 + idx * 100}>
              <a
                href={`/products?category_id=${cat.id}`}
                className={`block p-6 rounded-2xl border transition-all duration-200 group hover:-translate-y-1 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-cyan-700' : 'bg-white border-slate-200 hover:border-cyan-500 shadow-sm hover:shadow-md'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                  {idx === 0 ? '📡' : idx === 1 ? '🩺' : idx === 2 ? '💉' : idx === 3 ? '🔬' : '🫁'}
                </div>
                <h3 className="font-bold text-base line-clamp-1">{cat.name}</h3>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Certified Systems</p>
              </a>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className={`py-12 border-y transition-colors duration-200 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <ScrollReveal animation="fade-up" delay={100}>
            <div className={`p-6 rounded-2xl border h-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center font-bold text-xl mb-3 border ${darkMode ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-cyan-100 text-cyan-800 border-cyan-200'}`}>✓</div>
              <h4 className="font-bold">ISO 13485 & FDA Compliant</h4>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>All refurbished and new equipment undergo strict biomedical quality checks.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={250}>
            <div className={`p-6 rounded-2xl border h-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center font-bold text-xl mb-3 border ${darkMode ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>🛡</div>
              <h4 className="font-bold">Full Warranty Coverage</h4>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>12 to 36 months comprehensive manufacturer & dealer warranty on all items.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={400}>
            <div className={`p-6 rounded-2xl border h-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center font-bold text-xl mb-3 border ${darkMode ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>⚡</div>
              <h4 className="font-bold">Hospital PO Support</h4>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Direct support for institutional procurement and credit card demo checkout.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScrollReveal animation="fade-down" delay={100} className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Featured Equipment</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Explore top-rated clinical diagnostic and monitoring hardware.</p>
          </div>
          <a href="/products" className="text-sm font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
            View Full Catalog →
          </a>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((p, idx) => (
              <ScrollReveal key={p.id} animation="fade-up" delay={100 + (idx % 3) * 150}>
                <ProductCard product={p} isWishlisted={wishlistIds.includes(p.id)} onAddToCart={addToCart} onWishlist={addToWishlist} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* Hospital Partner Metrics */}
      <section className={`py-16 border-t ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <ScrollReveal animation="zoom-in" delay={100}>
            <div className="text-3xl sm:text-4xl font-black text-cyan-500">500+</div>
            <div className={`text-xs font-bold uppercase mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Partner Hospitals</div>
          </ScrollReveal>
          <ScrollReveal animation="zoom-in" delay={200}>
            <div className="text-3xl sm:text-4xl font-black text-emerald-500">99.9%</div>
            <div className={`text-xs font-bold uppercase mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Calibration Uptime</div>
          </ScrollReveal>
          <ScrollReveal animation="zoom-in" delay={300}>
            <div className="text-3xl sm:text-4xl font-black text-cyan-500">24/7</div>
            <div className={`text-xs font-bold uppercase mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Biomedical Support</div>
          </ScrollReveal>
          <ScrollReveal animation="zoom-in" delay={400}>
            <div className="text-3xl sm:text-4xl font-black text-emerald-500">36 Mo</div>
            <div className={`text-xs font-bold uppercase mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Max Warranty</div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  )
}
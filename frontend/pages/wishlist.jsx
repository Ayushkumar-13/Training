import { useEffect, useState } from 'react'
import SkeletonCard from '../components/SkeletonCard'
import { fetchJSON, formatPrice } from '../lib/api'
import { useTheme } from '../lib/ThemeContext'

export default function Wishlist() {
  const { darkMode } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWishlist()
  }, [])

  function loadWishlist() {
    setLoading(true)
    fetchJSON('/api/wishlist')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data || [])
        setItems(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  async function removeWishlist(productId) {
    try {
      await fetchJSON(`/api/wishlist/${productId}`, { method: 'DELETE' })
      loadWishlist()
    } catch (err) {
      alert('Failed to remove item from wishlist')
    }
  }

  async function moveToCart(productId) {
    try {
      await fetchJSON('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      })
      await fetchJSON(`/api/wishlist/${productId}`, { method: 'DELETE' })
      alert('Moved equipment to shopping cart!')
      loadWishlist()
    } catch (err) {
      alert('Failed to move item to cart')
    }
  }

  async function moveAllToCart() {
    if (items.length === 0) return
    try {
      for (const item of items) {
        const pid = item.id || item.product_id
        await fetchJSON('/api/cart/items', {
          method: 'POST',
          body: JSON.stringify({ product_id: pid, quantity: 1 })
        })
        await fetchJSON(`/api/wishlist/${pid}`, { method: 'DELETE' })
      }
      alert('All wishlist items moved to shopping cart!')
      loadWishlist()
    } catch (err) {
      alert('Failed to move items to cart')
    }
  }

  const totalBudgetCents = items.reduce((sum, item) => sum + (item.price_cents || 0), 0)

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header & Summary Bar */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Saved Equipment Wishlist</h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Review and manage clinical systems saved for facility procurement.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Est. Budget Value</div>
                <div className="text-xl font-black text-cyan-500">{formatPrice(totalBudgetCents)}</div>
              </div>
              <button
                onClick={moveAllToCart}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
              >
                Move All to Cart 🛒
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={`border p-12 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="w-16 h-16 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 flex items-center justify-center font-bold text-3xl mx-auto mb-4">
              ♥
            </div>
            <h3 className="text-xl font-bold mb-2">Your wishlist is currently empty</h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Save diagnostic, monitoring, and surgical equipment from our catalog to review later.</p>
            <a href="/products" className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md inline-block transition-all">
              Explore Equipment Catalog
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(item => {
              const pid = item.id || item.product_id
              return (
                <div
                  key={pid}
                  className={`border rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div className="flex gap-4 mb-4">
                      <div className={`w-24 h-24 rounded-xl border p-2 flex items-center justify-center flex-shrink-0 overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        <img
                          src={item.product_image || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=300&q=80"}
                          alt={item.name}
                          className="max-h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-xs font-mono font-bold text-cyan-500">SKU: {item.sku || `SKU-${pid}`}</span>
                        </div>
                        <h3 className="text-lg font-bold line-clamp-1">
                          <a href={`/products/${pid}`} className="hover:text-cyan-500 transition-colors">
                            {item.name || `Medical Item #${pid}`}
                          </a>
                        </h3>
                        <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.description || "Certified medical-grade equipment for hospital deployment."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price & Actions Footer */}
                  <div className={`pt-4 border-t flex items-center justify-between gap-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div>
                      <div className="text-xl font-black">{formatPrice(item.price_cents)}</div>
                      <div className={`text-xs font-bold ${item.inventory > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {item.inventory > 0 ? 'In Stock' : 'Available on Order'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveToCart(pid)}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all flex items-center gap-1"
                      >
                        <span>Move to Cart</span> 🛒
                      </button>
                      <button
                        onClick={() => removeWishlist(pid)}
                        className={`p-2 text-xs font-bold rounded-xl border transition-all ${darkMode ? 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
                        title="Remove from Wishlist"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

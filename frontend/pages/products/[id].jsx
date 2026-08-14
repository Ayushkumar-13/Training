import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { fetchJSON, formatPrice } from '../../lib/api'
import { useTheme } from '../../lib/ThemeContext'

export default function ProductPage() {
  const { darkMode } = useTheme()
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!id) return
    let mounted = true
    fetchJSON(`/api/products/${id}`)
      .then(data => {
        if (mounted) setProduct(data)
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  async function addToCart() {
    try {
      await fetchJSON('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity })
      })
      alert('Product added to MedEquip cart!')
    } catch (err) {
      alert('Please log in to add items to cart.')
    }
  }

  async function addToWishlist() {
    try {
      await fetchJSON('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id })
      })
      alert('Added to MedEquip wishlist!')
    } catch (err) {
      alert('Please log in to manage your wishlist.')
    }
  }

  if (loading || !product) {
    return (
      <main className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className={`p-8 rounded-2xl border animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`h-96 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className="space-y-4">
              <div className={`h-4 w-1/4 rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-8 w-3/4 rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-20 w-full rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-12 w-full rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <a href="/products" className="text-xs font-bold text-cyan-500 hover:text-cyan-400 mb-6 inline-block">
          ← Back to Equipment Catalog
        </a>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 border p-8 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className={`h-96 rounded-xl border p-6 flex items-center justify-center overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <img
                src={product.images && product.images.length > 0 ? product.images[0].url : (product.product_image || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80")}
                alt={product.name}
                className="max-h-full object-contain"
              />
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-cyan-500">SKU: {product.sku}</span>
                {product.is_refurbished ? (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${darkMode ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>Refurbished</span>
                ) : (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${darkMode ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>Brand New</span>
                )}
                {product.warranty_months > 0 && (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${darkMode ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300' : 'bg-cyan-100 text-cyan-800 border-cyan-300'}`}>
                    {product.warranty_months} Months Warranty
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-black">{product.name}</h1>
              <p className={`mt-4 leading-relaxed text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{product.description}</p>

              <div className={`mt-6 p-5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className="text-3xl font-black">{formatPrice(product.price_cents, product.currency)}</div>
                  <div className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Category: {product.category_name || 'Medical Equipment'}</div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${product.inventory > 0 ? (darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300') : (darkMode ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300')}`}>
                  {product.inventory > 0 ? `In Stock (${product.inventory} units)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className={`mt-8 space-y-4 pt-6 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={product.inventory || 10}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-20 px-3 py-2 text-sm rounded-lg border font-bold text-center ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={addToCart}
                  disabled={product.inventory <= 0}
                  className="py-3.5 px-6 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-md transition-all"
                >
                  Add to Shopping Cart
                </button>
                <button
                  onClick={addToWishlist}
                  className={`py-3.5 px-6 text-sm font-bold rounded-xl border transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}
                >
                  Add to Wishlist ♥
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Table */}
        {product.specifications && product.specifications.length > 0 && (
          <div className={`mt-12 border p-8 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-lg font-bold mb-4">Technical Specifications</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className={`text-xs font-bold uppercase border-b ${darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  <tr>
                    <th className="px-4 py-3">Specification</th>
                    <th className="px-4 py-3">Value</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                  {product.specifications.map(s => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-bold">{s.key}</td>
                      <td className={`px-4 py-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

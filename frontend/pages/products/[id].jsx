import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { fetchJSON, formatPrice, clearAuthToken } from '../../lib/api'
import { useTheme } from '../../lib/ThemeContext'

export default function ProductPage() {
  const { darkMode } = useTheme()
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    setNotFound(false)

    fetchJSON(`/api/products/${id}`)
      .then(data => {
        if (mounted) {
          if (!data || data.error || !data.id) {
            setNotFound(true)
          } else {
            setProduct(data)
            setActiveImageIndex(0)
          }
        }
      })
      .catch(() => {
        if (mounted) setNotFound(true)
      })
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
      if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('jwt')) {
        clearAuthToken()
        if (confirm('Your session has expired or is invalid. Would you like to sign in now?')) {
          window.location.href = '/login'
        }
      } else {
        alert(err.message || 'Failed to add item to cart.')
      }
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
      if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('jwt')) {
        clearAuthToken()
        if (confirm('Your session has expired or is invalid. Would you like to sign in now?')) {
          window.location.href = '/login'
        }
      } else {
        alert(err.message || 'Failed to add item to wishlist.')
      }
    }
  }

  if (loading) {
    return (
      <main className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className={`p-8 rounded-2xl border animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`h-96 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className="space-y-4">
              <div className={`h-4 w-1/4 rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-8 w-3/4 rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-20 w-full rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (notFound || !product) {
    return (
      <main className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className={`p-12 rounded-2xl border max-w-lg mx-auto shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="text-5xl mb-4">🩺</div>
            <h2 className="text-2xl font-black mb-2">Equipment Item Not Found</h2>
            <p className={`text-xs mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              The requested medical device item (ID: {id}) does not exist in the active database or has been deleted.
            </p>
            <a href="/products" className="px-6 py-3 text-xs font-bold rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 shadow-md transition-all inline-block">
              ← Return to Equipment Catalog
            </a>
          </div>
        </div>
      </main>
    )
  }

  // Construct gallery images array (main image + 3 multi-angle perspective previews)
  const defaultMain = product.image_url || (product.images && product.images.length > 0 ? product.images[0].url : "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80")
  
  const galleryImages = [
    defaultMain,
    defaultMain,
    defaultMain,
    defaultMain
  ]

  const currentMainImage = galleryImages[activeImageIndex] || defaultMain

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <a href="/products" className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline mb-6 inline-block">
          ← Back to Equipment Catalog
        </a>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 border p-8 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          
          {/* Left Column: Interactive Main Image + Multi-Image Thumbnails Gallery */}
          <div className="space-y-6">
            {/* Large Main Image Preview with Previous/Next Chevron Controls */}
            <div className={`relative h-[420px] w-full rounded-2xl border p-6 flex items-center justify-center overflow-hidden transition-all duration-300 group ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
              
              {/* Previous Image Button (<) */}
              <button
                type="button"
                onClick={() => setActiveImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white flex items-center justify-center font-black text-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-500 transition-all z-20"
                title="Previous Image"
              >
                ‹
              </button>

              {/* Main Image */}
              <img
                src={currentMainImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-all duration-300"
              />

              {/* Next Image Button (>) */}
              <button
                type="button"
                onClick={() => setActiveImageIndex(prev => (prev + 1) % galleryImages.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white flex items-center justify-center font-black text-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-500 transition-all z-20"
                title="Next Image"
              >
                ›
              </button>
            </div>

            {/* Interactive Thumbnail Gallery Below Main Image */}
            <div className="grid grid-cols-4 gap-4">
              {galleryImages.map((imgUrl, idx) => {
                const isActive = activeImageIndex === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all p-2 flex items-center justify-center ${
                      isActive
                        ? 'border-cyan-500 ring-2 ring-cyan-500/50 shadow-md bg-white dark:bg-slate-900'
                        : (darkMode ? 'border-slate-800 bg-slate-950 hover:border-slate-700' : 'border-slate-200 bg-slate-100 hover:border-slate-300')
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className={`max-h-full max-w-full object-contain transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Product Details & Purchase Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">SKU: {product.sku}</span>
                {product.is_refurbished ? (
                  <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-md bg-amber-950/80 border border-amber-800 text-amber-300">Refurbished</span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-300">New</span>
                )}
                {product.warranty_months > 0 && (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                    {product.warranty_months} Months Warranty
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-black">{product.name}</h1>
              <p className={`mt-4 leading-relaxed text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{product.description}</p>

              <div className={`mt-6 p-5 rounded-2xl border flex items-center justify-between ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400">
                    {formatPrice(product.price_cents, product.currency)}
                  </div>
                  <div className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Category: {product.category_name || 'Turnkey Medical Equipment'}
                  </div>
                </div>
                <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${product.inventory > 0 ? (darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300') : (darkMode ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300')}`}>
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
                  Add to Cart
                </button>
                <button
                  onClick={addToWishlist}
                  className={`py-3.5 px-6 text-sm font-bold rounded-xl border transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}
                >
                  ♡ Add to Wishlist
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
                  {product.specifications.map((s, i) => (
                    <tr key={i}>
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

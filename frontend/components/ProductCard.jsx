import React, { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext'

export default function ProductCard({ product, isWishlisted = false, onAddToCart, onWishlist }) {
  const { darkMode } = useTheme()
  const [inWishlist, setInWishlist] = useState(isWishlisted || product.is_wishlisted || false)

  useEffect(() => {
    setInWishlist(isWishlisted || product.is_wishlisted || false)
  }, [isWishlisted, product.is_wishlisted])

  const formattedPrice = (product.price_cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: product.currency || 'USD',
  })

  function handleCardClick(e) {
    // If user clicked add to cart or wishlist button, don't trigger page navigation
    if (e.target.closest('button')) return
    window.location.href = `/products/${product.id}`
  }

  async function handleWishlistClick(e) {
    e.stopPropagation()
    const nextState = !inWishlist
    setInWishlist(nextState) // Instant optimistic UI update
    if (onWishlist) {
      try {
        await onWishlist(product.id, nextState)
      } catch (err) {
        setInWishlist(!nextState) // Revert on failure
      }
    }
  }

  const isStockAvailable = product.inventory > 0

  return (
    <article
      onClick={handleCardClick}
      className={`group relative rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 h-full flex flex-col justify-between cursor-pointer overflow-hidden ${
        darkMode
          ? 'bg-[#101726]/90 border-slate-800/80 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 text-slate-100'
          : 'bg-white border-slate-200/90 hover:border-cyan-500/40 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 text-slate-900'
      }`}
    >
      <div>
        {/* Product Image Frame */}
        <div className={`relative h-52 flex items-center justify-center p-6 border-b overflow-hidden ${
          darkMode ? 'bg-gradient-to-b from-slate-950 to-slate-900/80 border-slate-800/80' : 'bg-gradient-to-b from-slate-50 to-slate-100/60 border-slate-200/70'
        }`}>
          <img
            src={product.image_url || product.product_image || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80"}
            alt={product.name}
            className="h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Top-Left Status Pills */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {product.is_refurbished ? (
              <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg border backdrop-blur-md bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400">
                Refurbished
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg border backdrop-blur-md bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                New
              </span>
            )}
            {product.warranty_months > 0 && (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border backdrop-blur-md bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                {product.warranty_months} Mo Warranty
              </span>
            )}
          </div>

          {/* Top-Right Quick Wishlist Button (Dynamic Color State) */}
          <button
            onClick={handleWishlistClick}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-all duration-300 z-10 ${
              inWishlist
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/40 scale-105'
                : darkMode
                ? 'bg-slate-900/80 border-slate-700 text-slate-400 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-800'
                : 'bg-white/80 border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
            }`}
            title={inWishlist ? "In Wishlist" : "Add to Wishlist"}
          >
            ♥
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1.5 line-clamp-1">
              {product.category_name || "Certified Equipment"}
            </div>
            <h3 className={`text-base font-bold leading-snug line-clamp-2 h-11 flex items-start group-hover:text-cyan-500 transition-colors ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {product.name}
            </h3>
            <p className="text-xs mt-2 line-clamp-2 leading-relaxed h-9 overflow-hidden text-slate-500 dark:text-slate-400">
              {product.description || "Certified medical-grade equipment suitable for hospital and clinical deployment."}
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-5 pt-0">
        <div className={`flex items-center justify-between mb-4 pt-3.5 border-t ${
          darkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div>
            <div className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {formattedPrice}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Excl. Tax & Shipping
            </div>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${
            isStockAvailable
              ? (darkMode ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
              : (darkMode ? 'bg-rose-950/60 text-rose-400 border-rose-800/80' : 'bg-rose-50 text-rose-700 border-rose-200')
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isStockAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {isStockAvailable ? `In Stock (${product.inventory})` : 'Out of Stock'}
          </div>
        </div>

        {/* Action Button Group */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(product.id); }}
            disabled={!isStockAvailable}
            className="w-full py-2.5 px-3 text-xs font-extrabold rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 text-white shadow-md shadow-cyan-600/20 hover:shadow-cyan-500/40 transition-all transform active:scale-98"
          >
            + Add to Cart
          </button>
          <button
            onClick={handleWishlistClick}
            className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
              inWishlist
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-600/20'
                : darkMode
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/80'
                : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-slate-300/80'
            }`}
          >
            {inWishlist ? 'Saved ♥' : 'Wishlist ♥'}
          </button>
        </div>
      </div>
    </article>
  )
}

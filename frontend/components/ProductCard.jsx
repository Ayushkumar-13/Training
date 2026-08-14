import React from 'react'
import { useTheme } from '../lib/ThemeContext'

export default function ProductCard({ product, onAddToCart, onWishlist }) {
  const { darkMode } = useTheme()

  const formattedPrice = (product.price_cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: product.currency || 'USD',
  })

  return (
    <article className={`group border rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${darkMode ? 'bg-slate-900 border-slate-800 shadow-lg text-slate-100' : 'bg-white border-slate-200 shadow-sm text-slate-900'}`}>
      <div>
        <div className={`relative h-48 flex items-center justify-center p-4 border-b overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <img
            src={product.product_image || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80"}
            alt={product.name}
            className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.is_refurbished ? (
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${darkMode ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-800'}`}>
                Refurbished
              </span>
            ) : (
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${darkMode ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-800'}`}>
                New
              </span>
            )}
            {product.warranty_months > 0 && (
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${darkMode ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300' : 'bg-cyan-100 border-cyan-300 text-cyan-800'}`}>
                {product.warranty_months} Mo Warranty
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="text-xs font-mono text-cyan-500 font-bold mb-1">SKU: {product.sku}</div>
          <h3 className={`text-lg font-bold hover:text-cyan-400 transition-colors line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <a href={`/products/${product.id}`}>{product.name}</a>
          </h3>
          <p className={`text-xs mt-2 line-clamp-2 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {product.description || "Certified medical-grade equipment suitable for hospital and clinical deployment."}
          </p>
        </div>
      </div>

      <div className="p-5 pt-0">
        <div className={`flex items-center justify-between mb-4 pt-3 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formattedPrice}</div>
            <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Excl. Tax & Shipping</div>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${product.inventory > 0 ? (darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : (darkMode ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200')}`}>
            {product.inventory > 0 ? `In Stock (${product.inventory})` : 'Out of Stock'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAddToCart && onAddToCart(product.id)}
            disabled={product.inventory <= 0}
            className="w-full py-2.5 px-3 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-sm transition-all"
          >
            Add to Cart
          </button>
          <button
            onClick={() => onWishlist && onWishlist(product.id)}
            className={`w-full py-2.5 px-3 text-xs font-semibold rounded-lg border transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}
          >
            Wishlist ♥
          </button>
        </div>
      </div>
    </article>
  )
}

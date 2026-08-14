import { useEffect, useState } from 'react'
import { fetchJSON, formatPrice } from '../lib/api'
import { useTheme } from '../lib/ThemeContext'

export default function Cart() {
  const { darkMode } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  function loadCart() {
    setLoading(true)
    fetchJSON('/api/cart')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.items || (res.data ? res.data.items : []))
        setItems(list || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  async function removeItem(productId) {
    try {
      await fetchJSON(`/api/cart/items/${productId}`, { method: 'DELETE' })
      loadCart()
    } catch (err) {
      alert('Failed to remove item')
    }
  }

  const totalCents = items.reduce((sum, item) => sum + (item.unit_price_cents * item.quantity), 0)

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-black mb-2">Medical Equipment Cart</h1>
        <p className={`text-sm mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Review items selected for your clinical facility.</p>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className={`h-24 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={`border p-12 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Browse our medical equipment catalog to add items.</p>
            <a href="/products" className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md inline-block">
              Browse Equipment Catalog
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.id} className={`border p-5 rounded-xl flex items-center justify-between gap-4 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg border flex items-center justify-center p-2 overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <img src={item.product_image || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=300&q=80"} alt={item.product_name} className="max-h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">{item.product_name || `Product #${item.product_id}`}</h4>
                      <div className="text-xs text-cyan-500 font-mono font-bold mt-0.5">SKU: {item.product_sku || 'N/A'}</div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Quantity: <span className="font-bold">{item.quantity}</span></div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black">{formatPrice(item.unit_price_cents * item.quantity)}</div>
                    <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{formatPrice(item.unit_price_cents)} each</div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-400 mt-2 block ml-auto"
                    >
                      Remove Item
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Box */}
            <div className={`border p-6 rounded-2xl h-fit shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>
              <div className={`space-y-3 text-sm border-b pb-4 mb-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex justify-between">
                  <span>Equipment Subtotal</span>
                  <span className="font-bold">{formatPrice(totalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clinical Shipping</span>
                  <span className="text-emerald-500 font-bold">FREE (Standard)</span>
                </div>
                <div className="flex justify-between">
                  <span>Warranty Included</span>
                  <span className="text-cyan-500 font-bold">12-36 Months</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-bold">Estimated Total</span>
                <span className="text-2xl font-black text-cyan-500">{formatPrice(totalCents)}</span>
              </div>

              <a
                href="/checkout"
                className="w-full py-3.5 px-4 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md text-center block transition-all"
              >
                Proceed to Checkout →
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

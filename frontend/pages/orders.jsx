import { useEffect, useState } from 'react'
import { fetchJSON, formatPrice } from '../lib/api'
import { useTheme } from '../lib/ThemeContext'

export default function Orders() {
  const { darkMode } = useTheme()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJSON('/api/orders')
      .then(res => setOrders(Array.isArray(res) ? res : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function getStatusBadge(status) {
    switch (status) {
      case 'delivered':
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>Delivered</span>
      case 'shipped':
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${darkMode ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-cyan-100 text-cyan-800 border-cyan-300'}`}>Shipped</span>
      case 'processing':
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${darkMode ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>Processing</span>
      default:
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>Pending</span>
    }
  }

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-black mb-2">Order History & Tracking</h1>
        <p className={`text-sm mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>View fulfillment status of equipment purchases.</p>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className={`h-28 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className={`border p-12 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xl font-bold mb-2">No orders found</h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>You haven't placed any medical equipment orders yet.</p>
            <a href="/products" className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 text-white inline-block">Browse Catalog</a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(o => (
              <div key={o.id} className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div>
                    <div className="text-xs font-mono font-bold text-cyan-500">ORDER IDENTIFIER</div>
                    <div className="text-xl font-bold">#{o.id}</div>
                    <div className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Placed on {new Date(o.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(o.status)}
                    <div className="text-right">
                      <div className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL</div>
                      <div className="text-xl font-black">{formatPrice(o.total_cents)}</div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-4 space-y-3">
                  {o.items && o.items.map(it => (
                    <div key={it.id} className="flex justify-between items-center text-sm py-1">
                      <div>
                        <span className="font-bold">{it.product_name || `Product #${it.product_id}`}</span>
                        <span className={`text-xs ml-2 font-mono font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({it.product_sku || 'N/A'})</span>
                        <span className="text-xs text-cyan-500 ml-3 font-bold">Qty: {it.quantity}</span>
                      </div>
                      <span className="font-bold">{formatPrice(it.unit_cents * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

import { useEffect, useState } from 'react'
import SkeletonCard from '../components/SkeletonCard'
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
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${darkMode ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-100 text-indigo-800 border-indigo-300'}`}>Shipped In-Transit</span>
      case 'processing':
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${darkMode ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-cyan-100 text-cyan-800 border-cyan-300'}`}>Processing QC</span>
      default:
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${darkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>Order Confirmed</span>
    }
  }

  function getPaymentBadge(method) {
    if (method === 'cod') {
      return <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-md bg-amber-950/80 border border-amber-800 text-amber-300">💵 Cash on Delivery (COD)</span>
    }
    if (method === 'hospital_po') {
      return <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-300">🏥 Hospital PO Net 30</span>
    }
    return <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-md bg-cyan-950/80 border border-cyan-800 text-cyan-300">💳 Online Gateway</span>
  }

  function getStepProgress(status) {
    switch (status) {
      case 'delivered': return 4
      case 'shipped': return 3
      case 'processing': return 2
      default: return 1
    }
  }

  function getEstimatedDeliveryDate(createdAt) {
    const date = createdAt ? new Date(createdAt) : new Date()
    date.setDate(date.getDate() + 4)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const totalSpentCents = orders.reduce((sum, o) => sum + (o.total_cents || 0), 0)
  const activeCount = orders.filter(o => o.status !== 'delivered').length

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header & Metrics Bar */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Hospital Order Tracking</h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Monitor clinical equipment fulfillment status, delivery addresses, and payment methods.
            </p>
          </div>

          {orders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Orders</div>
                <div className="text-lg font-black mt-0.5">{orders.length}</div>
              </div>
              <div className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active Shipments</div>
                <div className="text-lg font-black text-cyan-500 mt-0.5">{activeCount}</div>
              </div>
              <div className={`p-3 rounded-xl border text-center col-span-2 sm:col-span-1 ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Amount</div>
                <div className="text-lg font-black text-emerald-500 mt-0.5">{formatPrice(totalSpentCents)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className={`border p-12 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="w-16 h-16 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 flex items-center justify-center font-bold text-3xl mx-auto mb-4">
              🚚
            </div>
            <h3 className="text-xl font-bold mb-2">No order history found</h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>You haven't placed any medical equipment procurement orders yet.</p>
            <a href="/products" className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md inline-block transition-all">
              Explore Equipment Catalog
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map(o => {
              const currentStep = getStepProgress(o.status)
              const estDelivery = getEstimatedDeliveryDate(o.created_at)

              return (
                <div
                  key={o.id}
                  className={`border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}
                >
                  {/* Order Top Meta */}
                  <div className={`flex flex-wrap items-center justify-between gap-4 pb-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black">Order #{o.id}</span>
                        {getStatusBadge(o.status)}
                        {getPaymentBadge(o.payment_method)}
                      </div>
                      <div className={`text-xs mt-2 space-y-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div>
                          <span>Placed: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{new Date(o.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                          <span>🚚 Expected Delivery:</span>
                          <span className="underline">{estDelivery}</span>
                        </div>
                        {o.shipping_address && (
                          <div>
                            📍 Destination: <strong className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{o.shipping_address}{o.city ? `, ${o.city}` : ''}{o.state ? `, ${o.state}` : ''} {o.postal_code}</strong>
                          </div>
                        )}
                        {o.phone && (
                          <div>
                            📞 Contact Phone: <strong className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{o.phone}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL AMOUNT</div>
                      <div className="text-2xl font-black text-emerald-500">{formatPrice(o.total_cents)}</div>
                    </div>
                  </div>

                  {/* 4-Step Fulfillment Tracker */}
                  <div className="py-6 border-b dark:border-slate-800 border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider mb-4 text-slate-500">Fulfillment Status Tracker</div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className={`p-2.5 rounded-xl border font-bold transition-all ${currentStep >= 1 ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800 dark:bg-cyan-950 dark:border-cyan-800' : (darkMode ? 'bg-slate-950 text-slate-600 border-slate-900' : 'bg-slate-100 text-slate-400 border-slate-200')}`}>
                        1. Order Authorized
                      </div>
                      <div className={`p-2.5 rounded-xl border font-bold transition-all ${currentStep >= 2 ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800 dark:bg-cyan-950 dark:border-cyan-800' : (darkMode ? 'bg-slate-950 text-slate-600 border-slate-900' : 'bg-slate-100 text-slate-400 border-slate-200')}`}>
                        2. Calibration & QC
                      </div>
                      <div className={`p-2.5 rounded-xl border font-bold transition-all ${currentStep >= 3 ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800 dark:bg-indigo-950 dark:border-indigo-800' : (darkMode ? 'bg-slate-950 text-slate-600 border-slate-900' : 'bg-slate-100 text-slate-400 border-slate-200')}`}>
                        3. Clinical Dispatch
                      </div>
                      <div className={`p-2.5 rounded-xl border font-bold transition-all ${currentStep >= 4 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 dark:bg-emerald-950 dark:border-emerald-800' : (darkMode ? 'bg-slate-950 text-slate-600 border-slate-900' : 'bg-slate-100 text-slate-400 border-slate-200')}`}>
                        4. Facility Delivered
                      </div>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="pt-6">
                    <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">Ordered Clinical Systems ({o.items ? o.items.length : 0})</div>
                    <div className="space-y-3">
                      {o.items && o.items.map(it => (
                        <div
                          key={it.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${darkMode ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg border p-1 flex items-center justify-center overflow-hidden flex-shrink-0 ${darkMode ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'}`}>
                              <img
                                src={it.product_image || "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=200&q=80"}
                                alt={it.product_name}
                                className="max-h-full object-contain"
                              />
                            </div>
                            <div>
                              <a href={`/products/${it.product_id}`} className="font-bold text-sm hover:text-cyan-500 transition-colors line-clamp-1">
                                {it.product_name || `Equipment #${it.product_id}`}
                              </a>
                              <div className="text-xs text-cyan-500 font-mono font-bold mt-0.5">
                                SKU: {it.product_sku || 'N/A'} • Qty: {it.quantity}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-sm">{formatPrice(it.unit_cents * it.quantity)}</div>
                            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatPrice(it.unit_cents)} each</div>
                          </div>
                        </div>
                      ))}
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

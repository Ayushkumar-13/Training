import { useEffect, useState } from 'react'
import { fetchJSON, formatPrice } from '../lib/api'
import { useTheme } from '../lib/ThemeContext'

export default function Checkout() {
  const { darkMode } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('demo_credit_card')
  const [shippingAddress, setShippingAddress] = useState('Central Hospital, Dept of Critical Care, 100 Medical Plaza, CA')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderComplete, setOrderComplete] = useState(null)

  useEffect(() => {
    fetchJSON('/api/cart')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.items || (res.data ? res.data.items : []))
        setItems(list || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalCents = items.reduce((sum, item) => sum + (item.unit_price_cents * item.quantity), 0)

  async function handlePlaceOrder(e) {
    e.preventDefault()
    setPlacingOrder(true)

    try {
      const res = await fetchJSON('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
        })
      })
      setOrderComplete(res.order_id)
    } catch (err) {
      alert('Checkout Failed: ' + err.message)
    } finally {
      setPlacingOrder(false)
    }
  }

  if (orderComplete) {
    return (
      <main className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center font-bold text-3xl mx-auto mb-4">
            ✓
          </div>
          <h1 className="text-3xl font-black">Order Confirmed!</h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Order <span className="font-mono text-cyan-400 font-bold">#{orderComplete}</span> has been created successfully.</p>
          <p className="text-xs text-slate-500 mt-1">Demo payment record inserted and inventory decremented atomically.</p>

          <div className="mt-8 flex justify-center gap-4">
            <a href="/orders" className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md">
              Track Order Status
            </a>
            <a href="/products" className={`px-6 py-3 text-sm font-bold rounded-xl border ${darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}>
              Return to Catalog
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-black mb-2">Checkout & Payment</h1>
        <p className={`text-sm mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Complete your medical equipment order with demo payment processing.</p>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-semibold">Preparing checkout...</div>
        ) : items.length === 0 ? (
          <div className={`border p-12 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
            <a href="/products" className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 text-white inline-block mt-4">Browse Catalog</a>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Steps */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
                  Facility Shipping Address
                </h3>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Destination Address / Hospital Wing</label>
                  <textarea
                    rows="3"
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    required
                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
              </div>

              {/* Demo Payment Choice */}
              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
                  Payment Gateway Selection
                </h3>

                <div className="space-y-3">
                  <label className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'demo_credit_card' ? (darkMode ? 'bg-cyan-950/60 border-cyan-700' : 'bg-cyan-50 border-cyan-600') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="demo_credit_card"
                        checked={paymentMethod === 'demo_credit_card'}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="font-bold text-sm">Demo Credit Card</div>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Simulates instant online card payment clearing</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold">4242 •••• •••• 4242</span>
                  </label>

                  <label className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'hospital_po' ? (darkMode ? 'bg-cyan-950/60 border-cyan-700' : 'bg-cyan-50 border-cyan-600') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="hospital_po"
                        checked={paymentMethod === 'hospital_po'}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="font-bold text-sm">Hospital Purchase Order (PO)</div>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Institutional B2B credit billing for healthcare providers</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">PO-2026-MED</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Total & Pay */}
            <div className={`border p-6 rounded-2xl h-fit shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-bold mb-4">Order Items ({items.length})</h3>

              <div className={`space-y-3 border-b pb-4 mb-4 max-h-60 overflow-y-auto ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                {items.map(it => (
                  <div key={it.id} className="flex justify-between text-xs">
                    <span className={`line-clamp-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{it.product_name || `Product #${it.product_id}`} (x{it.quantity})</span>
                    <span className="font-bold">{formatPrice(it.unit_price_cents * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-bold">Total Amount</span>
                <span className="text-2xl font-black text-cyan-500">{formatPrice(totalCents)}</span>
              </div>

              <button
                type="submit"
                disabled={placingOrder}
                className="w-full py-4 text-sm font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition-all"
              >
                {placingOrder ? 'Processing Payment...' : 'Authorize & Place Order →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

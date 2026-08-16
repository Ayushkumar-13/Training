import { useEffect, useState } from 'react'
import { fetchJSON, formatPrice, clearAuthToken } from '../lib/api'
import { useTheme } from '../lib/ThemeContext'

export default function Checkout() {
  const { darkMode } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('online')
  
  // Real-world Shipping & Delivery Address state
  const [streetAddress, setStreetAddress] = useState('St. Jude Hospital, Dept of Critical Care, 100 Medical Plaza')
  const [city, setCity] = useState('Los Angeles')
  const [state, setState] = useState('California')
  const [postalCode, setPostalCode] = useState('90001')
  const [phone, setPhone] = useState('+1 (555) 234-5678')

  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderComplete, setOrderComplete] = useState(null)

  useEffect(() => {
    fetchJSON('/api/cart')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.items || (res.data ? res.data.items : []))
        setItems(list || [])
      })
      .catch(err => {
        if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token')) {
          clearAuthToken()
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const totalCents = items.reduce((sum, item) => sum + ((item.unit_price_cents || item.unit_cents || 0) * item.quantity), 0)

  async function handlePlaceOrder(e) {
    e.preventDefault()

    if (!items || items.length === 0) {
      alert('Your cart is empty. Please add medical equipment before placing an order.')
      window.location.href = '/products'
      return
    }

    setPlacingOrder(true)

    try {
      const res = await fetchJSON('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          payment_method: paymentMethod,
          shipping_address: streetAddress,
          city,
          state,
          postal_code: postalCode,
          phone,
        })
      })
      const createdOrderId = res.order_id || (res.data && res.data.order_id) || res.id || 1
      setOrderComplete(createdOrderId)
    } catch (err) {
      if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token')) {
        clearAuthToken()
        if (confirm('Your session has expired. Would you like to log in now?')) {
          window.location.href = '/login'
        }
      } else {
        alert('Order Error: ' + (err.message || 'Failed to place order.'))
      }
    } finally {
      setPlacingOrder(false)
    }
  }

  if (orderComplete) {
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 4)
    const formattedDeliveryDate = estimatedDelivery.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    return (
      <main className={`min-h-screen ${darkMode ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center font-bold text-3xl mx-auto mb-4 shadow-lg shadow-emerald-950/50">
            ✓
          </div>
          <h1 className="text-3xl font-black">Order Placed Successfully!</h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Order <span className="font-mono text-cyan-400 font-bold">#{orderComplete}</span> has been confirmed and scheduled for express clinical delivery.
          </p>

          <div className={`mt-6 p-5 rounded-2xl border max-w-md mx-auto text-left text-xs space-y-3 shadow-md ${darkMode ? 'bg-[#101726] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            {/* Expected Delivery Date Highlight Banner */}
            <div className={`p-3.5 rounded-xl border flex items-center gap-3.5 ${darkMode ? 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-900'}`}>
              <span className="text-2xl">🚚</span>
              <div>
                <div className="font-extrabold text-[11px] uppercase tracking-wider text-cyan-400">Expected Delivery Date</div>
                <div className="text-sm font-black mt-0.5">{formattedDeliveryDate}</div>
              </div>
            </div>

            <div><span className="font-bold">Payment Method:</span> {paymentMethod === 'cod' ? '💵 Cash on Delivery (COD)' : paymentMethod === 'online' ? '💳 Online Card Payment' : '🏥 Hospital PO Net 30 Credit'}</div>
            <div><span className="font-bold">Shipping Address:</span> {streetAddress}, {city}, {state} {postalCode}</div>
            <div><span className="font-bold">Contact Phone:</span> {phone}</div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <a href="/orders" className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all">
              Track Order Status
            </a>
            <a href="/products" className={`px-6 py-3 text-sm font-bold rounded-xl border transition-all ${darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'}`}>
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
        <h1 className="text-3xl font-black mb-2">Checkout & Procurement Delivery</h1>
        <p className={`text-sm mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Specify delivery destination address and choose your payment method.</p>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-semibold">Preparing checkout...</div>
        ) : items.length === 0 ? (
          <div className={`border p-12 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
            <a href="/products" className="px-6 py-3 text-sm font-bold rounded-xl bg-cyan-600 text-white inline-block mt-4">Browse Equipment Catalog</a>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Steps */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Step 1: Delivery Address Form */}
              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
                  Delivery & Shipping Address
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Street Address / Hospital Wing / Dept</label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={e => setStreetAddress(e.target.value)}
                      required
                      placeholder="e.g. 100 Medical Plaza, Critical Care Dept"
                      className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        required
                        className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>State / Province</label>
                      <input
                        type="text"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        required
                        className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Postal Code / PIN</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        required
                        className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Recipient Contact Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      placeholder="+1 (555) 000-0000"
                      className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Real-World Payment Methods */}
              <div className={`border p-6 rounded-2xl shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
                  Select Payment Option
                </h3>

                <div className="space-y-3">
                  {/* Option 1: Online Payment */}
                  <label className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'online' ? (darkMode ? 'bg-cyan-950/60 border-cyan-700' : 'bg-cyan-50 border-cyan-600') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="font-bold text-sm">💳 Online Payment (Credit / Debit Card / Net Banking)</div>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Instant digital payment gateway authorization</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold">Online Gateway</span>
                  </label>

                  {/* Option 2: Cash on Delivery (COD) */}
                  <label className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'cod' ? (darkMode ? 'bg-cyan-950/60 border-cyan-700' : 'bg-cyan-50 border-cyan-600') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="font-bold text-sm">💵 Cash on Delivery (COD) / Pay on Delivery</div>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pay in cash or demand draft upon freight arrival & inspection</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-400 font-bold">COD / Pay on Delivery</span>
                  </label>

                  {/* Option 3: Hospital PO Credit Billing */}
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
                        <div className="font-bold text-sm">🏥 Hospital Purchase Order (PO) - Net 30 Credit</div>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>B2B institutional invoice terms for healthcare facilities</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">PO Net 30</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order */}
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

              <div className="space-y-2 text-xs mb-6">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Subtotal</span>
                  <span className="font-bold">{formatPrice(totalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Biomedical Delivery Freight</span>
                  <span className="font-bold text-emerald-500">FREE</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t dark:border-slate-800 border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-cyan-500 text-xl font-black">{formatPrice(totalCents)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={placingOrder || items.length === 0}
                className="w-full py-4 text-base font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {placingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

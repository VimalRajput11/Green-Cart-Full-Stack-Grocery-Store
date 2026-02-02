import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

const MyOrders = () => {
  const [myOrders, setMyOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { currency, axios, user, confirmAction } = useAppContext();
  const [loading, setLoading] = useState(true);

  const fetchMyOrders = async () => {
    try {
      const { data } = await axios.get('/api/order/user');
      if (data.success) {
        setMyOrders(data.orders);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    confirmAction(
      "Remove Order",
      "Are you sure you want to remove this order from your history?",
      async () => {
        try {
          const { data } = await axios.delete(`/api/order/user/${orderId}`);
          if (data.success) {
            fetchMyOrders();
          }
        } catch (error) {
          console.log(error);
        }
      },
      'danger'
    );
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();

      const interval = setInterval(() => {
        fetchMyOrders();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-500 mt-1">Check the status of recent orders.</p>
        </div>
        {myOrders.some(o => ['Delivered', 'Cancelled'].includes(o.status)) && (
          <button
            onClick={() => {
              confirmAction(
                "Clear History",
                "Are you sure you want to clear all completed/cancelled orders from your history?",
                async () => {
                  const itemsToClear = myOrders.filter(o => ['Delivered', 'Cancelled'].includes(o.status));
                  for (const o of itemsToClear) {
                    await axios.delete(`/api/order/user/${o._id}`);
                  }
                  fetchMyOrders();
                }
              );
            }}
            className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full border border-red-100 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Clear All History
          </button>
        )}
      </div>

      {/* Empty State */}
      {myOrders.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
          <img src={assets.box_icon} className="w-20 h-20 mx-auto opacity-20 mb-6 grayscale" alt="No orders" />
          <h3 className="text-xl font-bold text-gray-700">No orders yet</h3>
          <p className="text-gray-500 mt-2">Looks like you haven't made your first purchase.</p>
          <a href="/" className="inline-block mt-6 bg-primary text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition transform">
            Start Shopping
          </a>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-8">
        {myOrders.map((order) => (
          <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-300">

            {/* Order Header / Top Bar */}
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <img src={assets.parcel_icon} className="w-6 h-6 opacity-70" alt="parcel" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-bold text-gray-800 font-mono text-lg">#{order._id.slice(-6).toUpperCase()}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Date Placed</p>
                  <p className="text-sm font-medium text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Amount</p>
                  <p className="text-sm font-bold text-primary">{currency}{order.amount}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${order.status === 'Delivered' ? 'bg-green-100 text-green-700 border-green-200' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-blue-100 text-blue-700 border-blue-200 animate-pulse'
                  }`}>
                  {order.status}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Tracker */}
              <div className="mb-8 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10 w-full overflow-x-auto pb-4 no-scrollbar gap-4 px-2">
                  {['Order Placed', 'Picked', 'Out for Delivery', 'Arriving', 'Reached Location', 'Delivered'].map((step, idx) => {
                    const currentStepMap = {
                      'Order Placed': 0, 'Picked': 1, 'Out for Delivery': 2,
                      'Arriving': 3, 'Reached Location': 4, 'Delivered': 5, 'Cancelled': -1
                    };
                    const currentIdx = currentStepMap[order.status] ?? 0;
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step} className="flex flex-col items-center min-w-[80px] relative">
                        {/* Circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 text-xs font-bold z-20 ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-300'
                          } ${isCurrent ? 'scale-110 shadow-lg ring-2 ring-green-200' : ''}`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        {/* Label */}
                        <p className={`text-[10px] sm:text-xs mt-2 font-medium text-center whitespace-nowrap ${isCompleted ? 'text-green-700' : 'text-gray-400'}`}>{step}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Connecting Line - Simplified for reliability */}
                <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 -z-0">
                  <div
                    className="h-full bg-green-500 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (Math.max(0, ['Order Placed', 'Picked', 'Out for Delivery', 'Arriving', 'Reached Location', 'Delivered'].indexOf(order.status)) / 5) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Items List */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Items Ordered</h3>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                      <div className="w-20 h-20 bg-white rounded-lg p-2 border border-gray-200 shrink-0">
                        <img src={item.product?.image?.[0] || assets.box_icon} className="w-full h-full object-contain" alt={item.product?.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">{item.product?.name || "Product"}</h4>
                        <p className="text-sm text-gray-500 mb-1">{item.product?.category}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">Qty: {item.quantity}</span>
                          {item.product?.weight && <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">{item.product.weight}</span>}
                          <span className="font-semibold text-primary">{currency}{item.amount || (item.product.offerPrice * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sidebar: Action & Agent */}
                <div className="flex flex-col gap-6">
                  {/* Payment Info */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Info</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Method</span>
                      <span className="font-medium text-gray-800">{order.paymentType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Agent Card */}
                  {order.assignedTo ? (
                    <div className={`p-5 rounded-xl border relative overflow-hidden group ${order.status === 'Delivered'
                      ? 'bg-green-50 border-green-100'
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
                      }`}>
                      <div className="relative z-10">
                        <h4 className={`font-bold text-sm mb-1 ${order.status === 'Delivered' ? 'text-green-800' : 'text-blue-900'
                          }`}>
                          {order.status === 'Delivered' ? 'Order Delivered' :
                            order.status === 'Picked' ? 'Order Picked Up' :
                              order.status === 'Out for Delivery' ? 'Out for Delivery' :
                                order.status === 'Arriving' ? 'Arriving Soon' :
                                  order.status === 'Reached Location' ? 'Agent Reached Location' :
                                    'Driver Assigned'}
                        </h4>
                        <p className={`text-xs mb-4 ${order.status === 'Delivered' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                          {order.status === 'Delivered'
                            ? 'Delivered by your partner.'
                            : 'Your delivery partner is on the way.'}
                        </p>

                        <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg backdrop-blur-sm border border-white/50">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${order.status === 'Delivered' ? 'bg-green-600' : 'bg-blue-600'
                            }`}>
                            {order.assignedTo.name?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{order.assignedTo.name}</p>
                            <p className="text-xs text-gray-500">Delivery Partner</p>
                          </div>
                        </div>
                      </div>
                      {order.status !== 'Delivered' && (
                        <img src="https://cdn-icons-png.flaticon.com/512/2830/2830305.png" className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12" alt="" />
                      )}
                    </div>
                  ) : (
                    order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 border-dashed">
                        <p className="text-yellow-800 font-medium text-sm flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>
                          Looking for a driver...
                        </p>
                      </div>
                    )
                  )}

                  {/* Actions Column */}
                  <div className="flex flex-col gap-3">
                    {order.status === 'Delivered' && (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full py-3 bg-white border-2 border-green-500 text-green-600 font-bold rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Download Invoice
                      </button>
                    )}

                    {['Delivered', 'Cancelled'].includes(order.status) && (
                      <button
                        onClick={() => deleteOrder(order._id)}
                        className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Remove from History
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 print:shadow-none print:w-full print:max-h-full print:rounded-none">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Tax Invoice</h2>
                <p className="text-sm text-gray-500">Order #{selectedOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
            </div>

            <div className="p-8 print:p-8" id="invoice-content">
              {/* Invoice Header */}
              <div className="flex justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-green-600 mb-2">Green Cart</h1>
                  <p className="text-sm text-gray-500">123 Green Street, Tech City</p>
                  <p className="text-sm text-gray-500">support@greencart.com</p>
                  <p className="text-sm text-gray-500">GSTIN: 29ABCDE1234F1Z5</p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-gray-700">INVOICE</h3>
                  <p className="text-sm text-gray-500 mt-1">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Status: <span className="text-green-600 font-medium">Paid</span></p>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 print:bg-white print:border-gray-200">
                <h3 className="font-bold text-gray-700 text-xs uppercase mb-3">Bill To:</h3>
                <p className="font-bold text-gray-800">{selectedOrder.address.firstName} {selectedOrder.address.lastName}</p>
                <p className="text-sm text-gray-600">{selectedOrder.address.street}</p>
                <p className="text-sm text-gray-600">{selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.zipcode}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedOrder.address.phone}</p>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                <thead className="border-b-2 border-gray-100 bg-gray-50 print:bg-white">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Description</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 print:divide-gray-200">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 px-4 text-sm font-medium text-gray-800">{item.product?.name || "Product"}</td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">{currency}{item.product?.offerPrice || 0}</td>
                      <td className="py-4 px-4 text-sm font-bold text-gray-800 text-right">{currency}{item.product?.offerPrice ? (item.product.offerPrice * item.quantity) : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end border-t border-gray-100 pt-6">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{currency}{selectedOrder.amount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (Included)</span>
                    <span>{currency}0.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery Charges</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3 text-xl font-bold text-gray-900">
                    <span>Total Paid</span>
                    <span>{currency}{selectedOrder.amount}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <p className="text-xs text-gray-400">Thank you for shopping with Green Cart!</p>
                <p className="text-xs text-gray-400 mt-1">This is a computer-generated invoice.</p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl print:hidden">
              <button onClick={() => setSelectedOrder(null)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">Close</button>
              <button onClick={() => window.print()} className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg hover:shadow-green-500/30 flex items-center gap-2 font-bold transition transform hover:-translate-y-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;

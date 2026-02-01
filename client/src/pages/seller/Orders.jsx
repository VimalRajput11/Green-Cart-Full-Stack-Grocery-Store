import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import toast from 'react-hot-toast';

const Orders = () => {
  const { currency, axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch order data
  const fetchOrders = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const { data } = await axios.get('/api/order/seller');
      if (data.success) {
        // Backend already uses .sort({ createdAt: -1 }), so newest are first
        setOrders(data.orders);
        if (isManualRefresh) toast.success('Orders refreshed');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (!isManualRefresh) console.error("Failed to fetch orders:", error.message);
      else toast.error(error.message);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get('/api/agents');
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error("Failed to load agents");
    }
  };

  // Update order Status (for manual overrides if needed)
  const updateStatus = async (orderId, newStatus) => {
    try {
      const { data } = await axios.post('/api/order/status', { orderId, status: newStatus });
      if (data.success) {
        await fetchOrders();
        toast.success("Status Updated");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteAllDelivered = async () => {
    if (!window.confirm("Are you sure you want to delete ALL delivered orders? This action cannot be undone.")) return;

    try {
      const { data } = await axios.delete('/api/order/delete-delivered');
      if (data.success) {
        toast.success(data.message);
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAgents();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchOrders(false); // Silent refresh
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredOrders = filterStatus === 'All'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  if (loading) return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
            <p className="text-gray-500 text-sm">Track and manage customer orders efficiently.</p>
          </div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 transition text-sm font-medium shadow-sm disabled:opacity-50"
          >
            <img
              src={assets.refresh_icon}
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              alt=""
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm gap-1 min-w-max">
            {['All', 'Order Placed', 'Picked', 'Delivered', 'Cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition whitespace-nowrap ${filterStatus === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Delivered Button */}
        <button
          onClick={deleteAllDelivered}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition text-sm font-medium w-full sm:w-auto"
          title="Delete all delivered orders"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Delivered
        </button>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <img src={assets.order_icon} className="w-16 h-16 mx-auto opacity-20 filter grayscale" alt="" />
            <p className="mt-4 text-gray-500 font-medium">No orders found in this category.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-full border border-gray-200 shadow-sm">
                    <img src={assets.box_icon} className="w-6 h-6" alt="" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Order #{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                    order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</p>
                    <p className="font-bold text-lg text-gray-800">{currency}{order.amount}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Products */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items Ordered</h3>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                      <div className="w-14 h-14 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden p-1">
                        {(() => {
                          // Default placeholder image if product image is missing
                          const placeholderImage = 'https://via.placeholder.com/150/4CAF50/FFFFFF?text=Product';
                          const imageUrl = item.product?.image?.[0] || placeholderImage;

                          return (
                            <img
                              src={imageUrl}
                              className="w-full h-full object-contain"
                              alt={item.product?.name || 'Product'}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = placeholderImage;
                              }}
                            />
                          );
                        })()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm line-clamp-1">{item.product?.name || "Product Unavailable"}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-600 text-sm">
                        {currency}{item.product?.offerPrice ? (item.product.offerPrice * item.quantity) : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Customer & Delivery Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer Details</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-800">{order.address?.firstName} {order.address?.lastName}</p>
                      <p>{order.address?.street}</p>
                      <p>{order.address?.city}, {order.address?.state} {order.address?.zipcode}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">{order.address?.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Delivery Partner</h3>
                    {order.assignedTo ? (() => {
                      const agentId = typeof order.assignedTo === 'string' ? order.assignedTo : order.assignedTo._id;
                      const agent = agents.find(a => a._id === agentId);
                      return (
                        <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-100">
                          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xs">
                            {agent?.name?.[0] || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{agent?.name || 'Assigned Agent'}</p>
                            <p className="text-xs text-green-600">{agent?.phone || 'Contact Info'}</p>
                          </div>
                        </div>
                      )
                    })() : (
                      <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-700 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        Waiting for agent assignment...
                      </div>
                    )}
                  </div>

                  {/* Payment Status */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment Info</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium">{order.paymentType}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-bold ${order.isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                        {order.isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex gap-2 justify-end">
                    {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this order?')) {
                            updateStatus(order._id, 'Cancelled');
                          }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-200 transition"
                      >
                        Cancel Order
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 bg-white shadow-sm"
                      title="View Invoice"
                    >
                      <img src={assets.order_icon} className="w-5 h-5 opacity-60" alt="" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Invoice</h2>
                <p className="text-sm text-gray-500">Order #{selectedOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
            </div>

            <div className="p-8">
              <div className="flex justify-between mb-8">
                <div>
                  <img src={assets.logo} className="w-24 mb-2" alt="logo" />
                  <p className="text-sm text-gray-500">123 Green Street, Tech City</p>
                  <p className="text-sm text-gray-500">support@greencart.com</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Status: {selectedOrder.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-gray-700 text-sm uppercase mb-2">Bill To:</h3>
                  <p className="font-medium">{selectedOrder.address?.firstName} {selectedOrder.address?.lastName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.address?.street}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.address?.city}, {selectedOrder.address?.state}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.address?.phone}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-gray-700 text-sm uppercase mb-2">Payment:</h3>
                  <p className="font-medium">{selectedOrder.paymentType}</p>
                  <p className={`text-sm font-bold ${selectedOrder.isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                    {selectedOrder.isPaid ? 'PAID' : 'PENDING'}
                  </p>
                </div>
              </div>

              <table className="w-full mb-8">
                <thead className="border-b-2 border-gray-100">
                  <tr>
                    <th className="text-left py-2 text-sm font-semibold text-gray-600">Item</th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-600">Qty</th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-600">Price</th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-sm text-gray-800">{item.product?.name || "Product Unavailable"}</td>
                      <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="py-3 text-sm text-gray-600 text-right">
                        {currency}{item.product?.offerPrice || 0}
                      </td>
                      <td className="py-3 text-sm font-medium text-gray-800 text-right">
                        {currency}{item.product?.offerPrice ? (item.product.offerPrice * item.quantity) : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <div className="w-48">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{currency}{selectedOrder.amount}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium">{currency}0.00</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span>{currency}{selectedOrder.amount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Close</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull shadow-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

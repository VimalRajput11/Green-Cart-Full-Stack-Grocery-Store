import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import toast from 'react-hot-toast';

const Orders = () => {
  const { currency, axios, confirmAction } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    confirmAction(
      "Clear History",
      "Are you sure you want to clear all delivered orders from your view? This will not affect your revenue statistics.",
      async () => {
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
      }
    );
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

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-8 bg-[#fcfcfc] min-h-screen">
      <div className="flex flex-col gap-8 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight tracking-[-0.04em]">Order Management</h1>
            <p className="text-gray-400 font-semibold mt-1 text-sm">Track and manage customer orders efficiently.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-900 rounded-2xl border border-gray-100 font-bold transition-all text-xs uppercase tracking-widest shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <img
                src={assets.refresh_icon}
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                alt=""
              />
              {refreshing ? 'Syncing...' : 'Sync Orders'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            {/* Filter Tabs */}
            <div className="w-full lg:w-auto overflow-x-auto no-scrollbar">
              <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1.5 min-w-max">
                {['All', 'Order Placed', 'Picked', 'Delivered', 'Cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${filterStatus === status
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative group w-full md:w-80">
              <img src={assets.search_icon} className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20 group-focus-within:opacity-50 transition-opacity" alt="" />
              <input
                type="text"
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 rounded-2xl border border-gray-100 bg-white focus:outline-none focus:ring-8 focus:ring-green-500/5 focus:border-green-500/20 transition-all font-semibold text-gray-900 placeholder:text-gray-300 text-xs shadow-sm"
              />
            </div>
          </div>

          {/* Clear Delivered Button */}
          <button
            onClick={deleteAllDelivered}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 rounded-[1.25rem] border border-red-100 hover:bg-red-500 hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest w-full lg:w-auto shadow-sm"
            title="Delete all delivered orders"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" /></svg>
            Purge History
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <img src={assets.order_icon} className="w-20 h-20 mx-auto opacity-10 grayscale mb-6" alt="" />
            <h4 className="text-gray-900 font-bold text-xl uppercase tracking-[0.1em]">No Logs Found</h4>
            <p className="mt-2 text-gray-400 font-semibold text-sm">There are no orders in this category yet.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-[2rem] border border-gray-100/60 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50/40 px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="bg-white w-12 h-12 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V21H3V8M1 3H23V8H1V3ZM10 12H14" /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-lg font-bold text-gray-900 tracking-tight">Order #{order._id.slice(-6).toUpperCase()}</p>
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest 
                        ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-orange-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Payload</p>
                    <p className="font-bold text-3xl text-gray-900 leading-none">{currency}{order.amount}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Products */}
                <div className="lg:col-span-2">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Manifest Items</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-5 p-4 rounded-2xl border border-gray-50 bg-gray-50/20 group/item hover:bg-white hover:shadow-md hover:border-gray-100 transition-all">
                        <div className="w-16 h-16 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-2 shadow-sm">
                          <img
                            src={item.product?.image?.[0] || 'https://via.placeholder.com/150/4CAF50/FFFFFF?text=Product'}
                            className="w-full h-full object-contain"
                            alt={item.product?.name}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-base leading-tight truncate">{item.product?.name || "Product Unavailable"}</p>
                          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1">Quantity: {item.quantity} {item.product?.weight && `• ${item.product.weight}`}</p>
                        </div>
                        <p className="font-bold text-gray-800 text-lg">
                          {currency}{item.product?.offerPrice ? (item.product.offerPrice * item.quantity).toLocaleString() : '??'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Stack */}
                <div className="flex flex-col gap-10">
                  {/* Delivery Info */}
                  <div className="bg-gray-50/50 p-6 rounded-[1.5rem] border border-gray-50">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Recipient Identity</h3>
                    <div className="space-y-2">
                      <p className="text-base font-bold text-gray-900">{order.address?.firstName} {order.address?.lastName}</p>
                      <p className="text-sm font-semibold text-gray-500 leading-relaxed">{order.address?.street}, {order.address?.city}, {order.address?.state}</p>
                      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border border-blue-100 shadow-sm mt-3">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        {order.address?.phone}
                      </div>
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div>
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Assigned Partner</h3>
                    {order.assignedTo ? (() => {
                      const agentId = typeof order.assignedTo === 'string' ? order.assignedTo : order.assignedTo._id;
                      const agent = agents.find(a => a._id === agentId);
                      return (
                        <div className="flex items-center gap-5 bg-green-50/50 p-5 rounded-2xl border border-green-100/50">
                          <div className="w-12 h-12 rounded-2xl bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm shadow-sm">
                            {agent?.name?.[0] || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">{agent?.name || 'Assigned Agent'}</p>
                            <p className="text-[11px] font-semibold text-green-700 uppercase tracking-widest">{agent?.phone || 'Contact Info'}</p>
                          </div>
                        </div>
                      )
                    })() : (
                      <div className="p-5 bg-[#fff8e1] border border-[#ffecb3] rounded-2xl text-[#827717] text-xs font-black uppercase tracking-widest flex items-center gap-3">
                        <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-sm"></span>
                        Awaiting Assignment
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="flex items-end justify-between border-t border-gray-100 pt-8 mt-auto">
                    <div>
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Protocol</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900 font-bold text-sm uppercase">{order.paymentType}</span>
                        <span className={`px-3 py-1 rounded-md text-[9px] font-bold tracking-widest uppercase shadow-sm ${order.isPaid ? 'bg-green-600 text-white' : 'bg-[#ff9800] text-white'}`}>
                          {order.isPaid ? 'Cleared' : 'Due'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                        <button
                          onClick={() => {
                            confirmAction(
                              "Cancel Order",
                              "Are you sure you want to cancel this order? This action cannot be undone.",
                              () => updateStatus(order._id, 'Cancelled'),
                              'danger'
                            );
                          }}
                          className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Abort Order"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-12 h-12 flex items-center justify-center bg-white text-gray-900 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all shadow-sm group-hover:border-green-300"
                        title="View Protocol"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300 border border-white/20">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Order Protocol</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Transaction Log #{selectedOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
              >✕</button>
            </div>

            <div className="p-10 overflow-y-auto no-scrollbar">
              <div className="flex justify-between mb-12">
                <div className="flex flex-col gap-2">
                  <img className="h-10 w-fit" src={assets.logo} alt="logo" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2 leading-relaxed">Central Distribution Hub<br />Sector 12, Logistics Park<br />support@greencart.it</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4 ${selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-orange-700'}`}>
                    {selectedOrder.status}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em]">Date Of Entry</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="p-6 bg-gray-50/50 rounded-2xl">
                  <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-4">Destination</h3>
                  <p className="text-base font-bold text-gray-900">{selectedOrder.address?.firstName} {selectedOrder.address?.lastName}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-2 leading-relaxed uppercase">{selectedOrder.address?.street}<br />{selectedOrder.address?.city}, {selectedOrder.address?.state}</p>
                  <p className="text-[10px] font-bold text-green-600 mt-4 tracking-wider uppercase">{selectedOrder.address?.phone}</p>
                </div>
                <div className="p-6 bg-gray-50/50 rounded-2xl text-right flex flex-col items-end">
                  <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-4">Protocol Details</h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Clearing Type</p>
                  <p className="text-base font-bold text-gray-900 uppercase mb-4">{selectedOrder.paymentType}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-base font-bold uppercase ${selectedOrder.isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                    {selectedOrder.isPaid ? 'Cleared ✓' : 'Awaiting Payment'}
                  </p>
                </div>
              </div>

              <div className="mb-12">
                <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-6">Inventory Items</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left pb-4 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Description</th>
                      <th className="text-center pb-4 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Qty</th>
                      <th className="text-right pb-4 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Rate</th>
                      <th className="text-right pb-4 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-5 text-sm font-bold text-gray-900 uppercase tracking-tight">{item.product?.name || "Product Unavailable"}</td>
                        <td className="py-5 text-xs font-bold text-gray-500 text-center">{item.quantity}</td>
                        <td className="py-5 text-xs font-bold text-gray-500 text-right">{currency}{item.product?.offerPrice?.toLocaleString() || 0}</td>
                        <td className="py-5 text-sm font-bold text-gray-900 text-right">
                          {currency}{item.product?.offerPrice ? (item.product.offerPrice * item.quantity).toLocaleString() : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-8 border-t border-gray-100">
                <div className="w-full max-w-[240px] space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Payload Value</span>
                    <span className="text-sm font-bold text-gray-900">{currency}{(selectedOrder.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Logistics Surcharge</span>
                    <span className="text-sm font-bold text-gray-300">{currency}0.00</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-900 pt-4 mt-2">
                    <span className="text-[13px] font-bold text-gray-900 uppercase tracking-[0.1em]">Total Net</span>
                    <span className="text-2xl font-bold text-gray-900">{currency}{selectedOrder.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-4 rounded-b-[2.5rem]">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
              >Dismiss</button>
              <button
                onClick={() => window.print()}
                className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-gray-200 hover:bg-black transition-all transform hover:-translate-y-1 active:translate-y-0"
              >Print Protocol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

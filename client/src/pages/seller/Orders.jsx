import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import toast from 'react-hot-toast';
import { STATUS, STATUS_STYLE, PRE_PICKUP, IN_TRANSIT, ACTIVE, shortId, timeAgo } from '../../utils/orderStatus';
import { optimizeImg } from '../../utils/image';

const MAX_LOAD = 3;

const FILTERS = [
  { key: 'All', match: () => true },
  { key: 'New', match: (o) => o.status === STATUS.PLACED },
  { key: 'Packed', match: (o) => o.status === STATUS.PACKED },
  { key: 'In Transit', match: (o) => IN_TRANSIT.includes(o.status) },
  { key: 'Delivered', match: (o) => o.status === STATUS.DELIVERED },
  { key: 'Failed', match: (o) => o.status === STATUS.FAILED },
  { key: 'Cancelled', match: (o) => o.status === STATUS.CANCELLED },
  { key: 'Refunds', match: (o) => o.refundStatus === 'Pending' },
];

const Orders = () => {
  const { currency, axios, confirmAction } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [riderPick, setRiderPick] = useState({});
  const [openTimeline, setOpenTimeline] = useState({});

  const fetchOrders = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      const { data } = await axios.get('/api/order/seller');
      if (data.success) {
        setOrders(data.orders);
        if (manual) toast.success('Orders refreshed');
      }
    } catch (error) {
      if (manual) toast.error(error.message);
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get('/api/agents');
      if (data.success) setAgents(data.agents);
    } catch { /* non-fatal */ }
  };

  const refreshAll = () => Promise.all([fetchOrders(), fetchAgents()]);

  const act = async (orderId, request, okMsg) => {
    setBusyId(orderId);
    try {
      const { data } = await request();
      if (data.success) toast.success(okMsg || data.message);
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusyId(null);
    }
  };

  const markPacked = (id) => act(id, () => axios.post('/api/order/status', { orderId: id, status: STATUS.PACKED }), 'Marked packed');
  const assign = (id) => {
    const agentId = riderPick[id];
    if (!agentId) return toast.error('Choose a rider first');
    act(id, () => axios.post('/api/agents/assign', { orderId: id, agentId }));
  };
  const unassign = (id) => act(id, () => axios.post('/api/agents/unassign', { orderId: id }));
  const markRefunded = (id) => act(id, () => axios.post(`/api/order/${id}/refunded`));
  const cancel = (order) => {
    const reason = window.prompt('Reason for cancelling this order (shown to the customer):', 'Item unavailable');
    if (reason === null) return;
    act(order._id, () => axios.post('/api/order/status', { orderId: order._id, status: STATUS.CANCELLED, reason }));
  };

  const clearCompleted = () => {
    confirmAction(
      'Clear History',
      'Hide all delivered, failed and cancelled orders from this list? Revenue statistics are not affected.',
      async () => {
        try {
          const { data } = await axios.delete('/api/order/delete-delivered');
          if (data.success) { toast.success(data.message); fetchOrders(); }
        } catch (error) {
          toast.error(error.response?.data?.message || error.message);
        }
      }
    );
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const eligibleRiders = useMemo(
    () => agents.filter((a) => !a.isBlocked && a.status !== 'Inactive' && (a.stats?.activeOrders ?? 0) < MAX_LOAD),
    [agents]
  );

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, orders.filter(f.match).length])), [orders]);

  const filteredOrders = orders.filter((order) => {
    const f = FILTERS.find((x) => x.key === filter);
    const term = searchTerm.trim().toLowerCase();
    const haystack = `${order._id} ${order.address?.firstName || ''} ${order.address?.lastName || ''} ${order.address?.phone || ''}`.toLowerCase();
    return f.match(order) && (!term || haystack.includes(term));
  });

  if (loading) return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#fcfcfc] min-h-screen">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-[-0.04em]">Order Management</h1>
            <p className="text-gray-400 font-semibold mt-1 text-sm">Pack, dispatch and track every order.</p>
          </div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-2xl border border-gray-100 font-bold transition-all text-xs uppercase tracking-widest shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <img src={assets.refresh_icon} className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} alt="" />
            {refreshing ? 'Syncing...' : 'Sync Orders'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar">
            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1 min-w-max">
              {FILTERS.map(({ key }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${filter === key ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  {key}
                  {counts[key] > 0 && <span className={`px-1.5 rounded-md ${filter === key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{counts[key]}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative group w-full sm:w-72">
              <img src={assets.search_icon} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" alt="" />
              <input
                type="text"
                placeholder="Order ID, customer or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white focus:outline-none focus:border-green-500/40 font-semibold text-gray-900 placeholder:text-gray-300 text-xs shadow-sm"
              />
            </div>
            <button
              onClick={clearCompleted}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 hover:bg-red-500 hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest shadow-sm"
            >
              Clear Completed
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {eligibleRiders.length} rider{eligibleRiders.length === 1 ? '' : 's'} online and free to take orders
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <img src={assets.order_icon} className="w-16 h-16 mx-auto opacity-10 grayscale mb-4" alt="" />
            <h4 className="text-gray-900 font-bold text-lg uppercase tracking-[0.1em]">No orders here</h4>
            <p className="mt-1 text-gray-400 font-semibold text-sm">Nothing matches this filter yet.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const busy = busyId === order._id;
            const rider = order.assignedTo;
            const prePickup = PRE_PICKUP.includes(order.status);
            return (
              <div key={order._id} className="bg-white rounded-[2rem] border border-gray-100/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50/40 px-6 md:px-8 py-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-lg font-bold text-gray-900 tracking-tight">Order #{shortId(order._id)}</p>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${STATUS_STYLE[order.status]}`}>{order.status}</span>
                      {order.refundStatus === 'Pending' && <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white">Refund pending</span>}
                      {order.refundStatus === 'Refunded' && <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600">Refunded</span>}
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleString()} · {timeAgo(order.createdAt)}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{order.paymentType} · {order.isPaid ? 'Paid' : 'Due'}</p>
                    <p className="font-bold text-2xl text-gray-900 leading-none">{currency}{order.amount}</p>
                  </div>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Items */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Items to pack</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl border border-gray-50 bg-gray-50/30">
                            <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                              <img src={optimizeImg(item.product?.image?.[0], 120) || assets.box_icon} className="w-full h-full object-contain" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{item.product?.name || 'Product unavailable'}</p>
                              <p className="text-[11px] text-gray-400 font-semibold">{item.product?.weight || ''}</p>
                            </div>
                            <p className="font-bold text-gray-800">× {item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    {order.timeline?.length > 0 && (
                      <div>
                        <button onClick={() => setOpenTimeline((s) => ({ ...s, [order._id]: !s[order._id] }))} className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] hover:text-gray-700">
                          Timeline ({order.timeline.length}) {openTimeline[order._id] ? '▴' : '▾'}
                        </button>
                        {openTimeline[order._id] && (
                          <ol className="mt-3 border-l-2 border-gray-100 ml-1 space-y-3">
                            {order.timeline.map((t, i) => (
                              <li key={i} className="pl-4 relative">
                                <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-green-500" />
                                <p className="text-sm font-semibold text-gray-800">{t.status} <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">· {t.by}</span></p>
                                <p className="text-xs text-gray-400">{new Date(t.at).toLocaleString()}{t.note ? ` — ${t.note}` : ''}</p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}

                    {(order.cancelReason || order.failReason) && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        {order.status === STATUS.FAILED ? 'Delivery failed: ' : 'Cancelled: '}{order.failReason || order.cancelReason}
                      </p>
                    )}
                  </div>

                  {/* Ops column */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-gray-50/50 p-5 rounded-[1.5rem] border border-gray-50">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Deliver to</h3>
                      <p className="text-base font-bold text-gray-900">{order.address?.firstName} {order.address?.lastName}</p>
                      <p className="text-sm font-semibold text-gray-500 leading-relaxed">{order.address?.street}, {order.address?.city}, {order.address?.state}</p>
                      <a href={`tel:${order.address?.phone}`} className="inline-block mt-2 text-xs font-bold text-blue-700">{order.address?.phone}</a>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Delivery partner</h3>
                      {rider ? (
                        <div className="flex items-center gap-4 bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
                          <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center text-green-800 font-bold text-sm uppercase">{rider.name?.slice(0, 2)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{rider.name}</p>
                            <p className="text-[11px] font-semibold text-green-700">{rider.phone}{rider.vehicleNumber ? ` · ${rider.vehicleNumber}` : ''}</p>
                          </div>
                          {prePickup && (
                            <button disabled={busy} onClick={() => unassign(order._id)} className="text-[10px] font-bold uppercase text-gray-400 hover:text-red-600">Remove</button>
                          )}
                        </div>
                      ) : ACTIVE.includes(order.status) ? (
                        <div className="p-4 bg-[#fff8e1] border border-[#ffecb3] rounded-2xl text-[#827717] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                          Waiting for a rider
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">—</p>
                      )}

                      {prePickup && (
                        <div className="flex gap-2 mt-3">
                          <select
                            value={riderPick[order._id] || ''}
                            onChange={(e) => setRiderPick((s) => ({ ...s, [order._id]: e.target.value }))}
                            className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-green-500"
                            aria-label="Choose rider"
                          >
                            <option value="">{rider ? 'Reassign to…' : 'Assign rider…'}</option>
                            {eligibleRiders.filter((a) => a._id !== rider?._id).map((a) => (
                              <option key={a._id} value={a._id}>{a.name} · {a.stats?.activeOrders || 0}/{MAX_LOAD} active</option>
                            ))}
                          </select>
                          <button disabled={busy} onClick={() => assign(order._id)} className="px-4 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50">Assign</button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-5 mt-auto">
                      {order.status === STATUS.PLACED && (
                        <button disabled={busy} onClick={() => markPacked(order._id)} className="flex-1 py-3 rounded-2xl bg-green-600 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-green-500/20 disabled:opacity-50">
                          {busy ? 'Saving…' : 'Mark Packed'}
                        </button>
                      )}
                      {order.refundStatus === 'Pending' && (
                        <button disabled={busy} onClick={() => markRefunded(order._id)} className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50">Mark Refunded</button>
                      )}
                      {ACTIVE.includes(order.status) && (
                        <button
                          disabled={busy}
                          onClick={() => cancel(order)}
                          className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl border border-red-100 hover:bg-red-500 hover:text-white transition-all"
                          title="Cancel order"
                          aria-label="Cancel order"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-12 h-12 flex items-center justify-center bg-white text-gray-900 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all"
                        title="View invoice"
                        aria-label="View invoice"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (() => {
        const subtotal = selectedOrder.items.reduce((s, it) => s + (it.product?.offerPrice || 0) * it.quantity, 0);
        const fee = Math.max(0, Math.round((selectedOrder.amount - subtotal) * 100) / 100);
        return (
          <div className="fixed inset-0 bg-gray-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tax Invoice</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Order #{shortId(selectedOrder._id)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400" aria-label="Close">✕</button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto no-scrollbar">
                <div className="flex justify-between mb-8">
                  <img className="h-9 w-fit" src={assets.logo} alt="GreenCart" />
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em]">Date</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="p-5 bg-gray-50/50 rounded-2xl">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Bill to</h3>
                    <p className="text-base font-bold text-gray-900">{selectedOrder.address?.firstName} {selectedOrder.address?.lastName}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1 leading-relaxed">{selectedOrder.address?.street}<br />{selectedOrder.address?.city}, {selectedOrder.address?.state}</p>
                    <p className="text-xs font-bold text-green-600 mt-2">{selectedOrder.address?.phone}</p>
                  </div>
                  <div className="p-5 bg-gray-50/50 rounded-2xl sm:text-right">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Payment</h3>
                    <p className="text-base font-bold text-gray-900">{selectedOrder.paymentType}{selectedOrder.collectionMethod ? ` (${selectedOrder.collectionMethod.toUpperCase()})` : ''}</p>
                    <p className={`text-sm font-bold mt-1 ${selectedOrder.isPaid ? 'text-green-600' : 'text-orange-500'}`}>{selectedOrder.isPaid ? 'Paid' : 'Awaiting payment'}</p>
                  </div>
                </div>

                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left pb-3 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Item</th>
                      <th className="text-center pb-3 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Qty</th>
                      <th className="text-right pb-3 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Rate</th>
                      <th className="text-right pb-3 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4 text-sm font-semibold text-gray-900">{item.product?.name || 'Product unavailable'}</td>
                        <td className="py-4 text-xs font-bold text-gray-500 text-center">{item.quantity}</td>
                        <td className="py-4 text-xs font-bold text-gray-500 text-right">{currency}{item.product?.offerPrice || 0}</td>
                        <td className="py-4 text-sm font-bold text-gray-900 text-right">{currency}{(item.product?.offerPrice || 0) * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <div className="w-full max-w-[260px] space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-bold text-gray-900">{currency}{subtotal}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Handling fee (2%)</span><span className="font-bold text-gray-900">{currency}{fee}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span className="font-bold text-green-600">Free</span></div>
                    <div className="flex justify-between border-t border-gray-900 pt-3 mt-2">
                      <span className="text-sm font-bold text-gray-900 uppercase">Total</span>
                      <span className="text-xl font-bold text-gray-900">{currency}{selectedOrder.amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900">Close</button>
                <button onClick={() => window.print()} className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">Print</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Orders;

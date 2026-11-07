import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import toast from 'react-hot-toast';
import { STATUS, STATUS_STYLE, PRE_PICKUP, IN_TRANSIT, ACTIVE, shortId, timeAgo } from '../../utils/orderStatus';
import { optimizeImg } from '../../utils/image';
import { Page, PageHeader, Card, Badge, Avatar, Button, EmptyState, Spinner, SearchInput, Segmented, Icon, inputCls } from '../../components/Seller/ui';

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

  if (loading) return <Spinner className="h-[80vh]" />;

  const sectionLabel = 'text-xs font-medium text-slate-500 mb-2.5';

  return (
    <Page>
      <PageHeader
        title="Orders"
        subtitle="Pack, dispatch and track every order."
        actions={<>
          <Button variant="secondary" icon="refresh" iconClass={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} disabled={refreshing} onClick={() => fetchOrders(true)}>
            {refreshing ? 'Syncing…' : 'Refresh'}
          </Button>
          <Button variant="danger-soft" icon="trash" onClick={clearCompleted}>Clear completed</Button>
        </>}
      />

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0">
          <Segmented options={FILTERS.map(({ key }) => ({ key, count: counts[key] }))} value={filter} onChange={setFilter} />
        </div>
        <SearchInput className="w-full lg:w-80 shrink-0" placeholder="Search order ID, customer or phone" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="flex items-center gap-2.5 text-sm text-slate-600">
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
        </span>
        <span><span className="font-semibold text-slate-900">{eligibleRiders.length}</span> rider{eligibleRiders.length === 1 ? '' : 's'} online and free to take orders</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">{filteredOrders.length} shown</span>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card><EmptyState icon="orders" title="No orders here" text="Nothing matches this filter yet." /></Card>
        ) : (
          filteredOrders.map((order) => {
            const busy = busyId === order._id;
            const rider = order.assignedTo;
            const prePickup = PRE_PICKUP.includes(order.status);
            const units = order.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <article key={order._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-slate-300/80 transition-all overflow-hidden">
                {/* Header */}
                <header className="px-5 md:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">Order #{shortId(order._id)}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[order.status]}`}>{order.status}</span>
                      {order.refundStatus === 'Pending' && <Badge tone="red" dot>Refund pending</Badge>}
                      {order.refundStatus === 'Refunded' && <Badge tone="slate">Refunded</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()} · {timeAgo(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:text-right">
                    <Badge tone={order.isPaid ? 'green' : 'amber'}>{order.paymentType} · {order.isPaid ? 'Paid' : 'Due'}</Badge>
                    <p className="text-xl font-semibold text-slate-900 tabular-nums">{currency}{order.amount}</p>
                  </div>
                </header>

                <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Items */}
                  <div className="lg:col-span-2 space-y-5">
                    <div>
                      <p className={sectionLabel}>Items to pack · {units}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl ring-1 ring-inset ring-slate-100 bg-slate-50/60">
                            <div className="w-11 h-11 bg-white rounded-lg ring-1 ring-slate-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                              <img src={optimizeImg(item.product?.image?.[0], 120) || assets.box_icon} className="w-full h-full object-contain" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 text-sm truncate">{item.product?.name || 'Product unavailable'}</p>
                              <p className="text-xs text-slate-500">{item.product?.weight || ''}</p>
                            </div>
                            <span className="text-sm font-semibold text-slate-700 bg-white ring-1 ring-slate-200 rounded-lg px-2 py-0.5 tabular-nums">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    {order.timeline?.length > 0 && (
                      <div>
                        <button onClick={() => setOpenTimeline((s) => ({ ...s, [order._id]: !s[order._id] }))} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900">
                          Timeline ({order.timeline.length})
                          <Icon name="chevronDown" className={`w-3.5 h-3.5 transition-transform ${openTimeline[order._id] ? 'rotate-180' : ''}`} strokeWidth={2.2} />
                        </button>
                        {openTimeline[order._id] && (
                          <ol className="mt-3 border-l-2 border-slate-100 ml-1.5 space-y-3">
                            {order.timeline.map((t, i) => (
                              <li key={i} className="pl-4 relative">
                                <span className={`absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${i === order.timeline.length - 1 ? 'bg-green-500' : 'bg-slate-300'}`} />
                                <p className="text-sm font-medium text-slate-800">{t.status} <span className="text-xs text-slate-400 font-normal">· {t.by}</span></p>
                                <p className="text-xs text-slate-500">{new Date(t.at).toLocaleString()}{t.note ? ` — ${t.note}` : ''}</p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}

                    {(order.cancelReason || order.failReason) && (
                      <p className="flex items-start gap-2 text-sm text-red-800 bg-red-50 ring-1 ring-inset ring-red-200 rounded-xl px-4 py-3">
                        <Icon name="alert" className="w-4 h-4 mt-0.5 text-red-600" />
                        <span>{order.status === STATUS.FAILED ? 'Delivery failed: ' : 'Cancelled: '}{order.failReason || order.cancelReason}</span>
                      </p>
                    )}
                  </div>

                  {/* Ops column */}
                  <div className="flex flex-col gap-5 lg:border-l lg:border-slate-100 lg:pl-6">
                    <div>
                      <p className={sectionLabel}>Deliver to</p>
                      <p className="text-sm font-semibold text-slate-900">{order.address?.firstName} {order.address?.lastName}</p>
                      <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{order.address?.street}, {order.address?.city}, {order.address?.state}</p>
                      <a href={`tel:${order.address?.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-green-700 hover:text-green-800">
                        <Icon name="phone" className="w-3.5 h-3.5" strokeWidth={2} />{order.address?.phone}
                      </a>
                    </div>

                    <div>
                      <p className={sectionLabel}>Delivery partner</p>
                      {rider ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50/60 ring-1 ring-inset ring-green-100">
                          <Avatar name={rider.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">{rider.name}</p>
                            <p className="text-xs text-green-700">{rider.phone}{rider.vehicleNumber ? ` · ${rider.vehicleNumber}` : ''}</p>
                          </div>
                          {prePickup && (
                            <button disabled={busy} onClick={() => unassign(order._id)} className="text-xs font-semibold text-slate-400 hover:text-red-600 disabled:opacity-50">Remove</button>
                          )}
                        </div>
                      ) : ACTIVE.includes(order.status) ? (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 ring-1 ring-inset ring-amber-200 text-amber-800 text-sm font-medium">
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          Waiting for a rider
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">—</p>
                      )}

                      {prePickup && (
                        <div className="flex gap-2 mt-2.5">
                          <select
                            value={riderPick[order._id] || ''}
                            onChange={(e) => setRiderPick((s) => ({ ...s, [order._id]: e.target.value }))}
                            className={`${inputCls} flex-1 min-w-0 cursor-pointer`}
                            aria-label="Choose rider"
                          >
                            <option value="">{rider ? 'Reassign to…' : 'Assign rider…'}</option>
                            {eligibleRiders.filter((a) => a._id !== rider?._id).map((a) => (
                              <option key={a._id} value={a._id}>{a.name} · {a.stats?.activeOrders || 0}/{MAX_LOAD} active</option>
                            ))}
                          </select>
                          <Button variant="dark" disabled={busy} onClick={() => assign(order._id)}>Assign</Button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 mt-auto border-t border-slate-100">
                      {order.status === STATUS.PLACED && (
                        <Button className="flex-1" icon="check" loading={busy} onClick={() => markPacked(order._id)}>Mark packed</Button>
                      )}
                      {order.refundStatus === 'Pending' && (
                        <Button className="flex-1" variant="danger" disabled={busy} onClick={() => markRefunded(order._id)}>Mark refunded</Button>
                      )}
                      {ACTIVE.includes(order.status) && (
                        <Button variant="danger-soft" size="icon" icon="close" disabled={busy} onClick={() => cancel(order)} title="Cancel order" aria-label="Cancel order" />
                      )}
                      <Button variant="secondary" size="icon" icon="doc" onClick={() => setSelectedOrder(order)} title="View invoice" aria-label="View invoice"
                        className={order.status === STATUS.PLACED || order.refundStatus === 'Pending' ? '' : 'ml-auto'} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (() => {
        const subtotal = selectedOrder.items.reduce((s, it) => s + (it.product?.offerPrice || 0) * it.quantity, 0);
        const fee = Math.max(0, Math.round((selectedOrder.amount - subtotal) * 100) / 100);
        return (
          <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Tax invoice</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Order #{shortId(selectedOrder._id)}</p>
                </div>
                <Button variant="ghost" size="icon" icon="close" onClick={() => setSelectedOrder(null)} aria-label="Close" />
              </div>

              <div className="p-6 md:p-8 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-start mb-8">
                  <img className="h-9 w-fit" src={assets.logo} alt="GreenCart" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl ring-1 ring-inset ring-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Bill to</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedOrder.address?.firstName} {selectedOrder.address?.lastName}</p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{selectedOrder.address?.street}<br />{selectedOrder.address?.city}, {selectedOrder.address?.state}</p>
                    <p className="text-sm font-medium text-green-700 mt-1.5">{selectedOrder.address?.phone}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl ring-1 ring-inset ring-slate-100 sm:text-right">
                    <p className="text-xs text-slate-500 mb-2">Payment</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedOrder.paymentType}{selectedOrder.collectionMethod ? ` (${selectedOrder.collectionMethod.toUpperCase()})` : ''}</p>
                    <p className={`text-sm font-semibold mt-1 ${selectedOrder.isPaid ? 'text-green-700' : 'text-orange-600'}`}>{selectedOrder.isPaid ? 'Paid' : 'Awaiting payment'}</p>
                  </div>
                </div>

                <table className="w-full mb-6 text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="text-left pb-2.5 font-medium">Item</th>
                      <th className="text-center pb-2.5 font-medium">Qty</th>
                      <th className="text-right pb-2.5 font-medium">Rate</th>
                      <th className="text-right pb-2.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-medium text-slate-900">{item.product?.name || 'Product unavailable'}</td>
                        <td className="py-3 text-slate-500 text-center tabular-nums">{item.quantity}</td>
                        <td className="py-3 text-slate-500 text-right tabular-nums">{currency}{item.product?.offerPrice || 0}</td>
                        <td className="py-3 font-semibold text-slate-900 text-right tabular-nums">{currency}{(item.product?.offerPrice || 0) * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-5 border-t border-slate-100">
                  <div className="w-full max-w-[260px] space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-900 tabular-nums">{currency}{subtotal}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Handling fee (2%)</span><span className="font-medium text-slate-900 tabular-nums">{currency}{fee}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="font-medium text-green-700">Free</span></div>
                    <div className="flex justify-between items-baseline border-t border-slate-200 pt-3 mt-2">
                      <span className="font-semibold text-slate-900">Total</span>
                      <span className="text-xl font-semibold text-slate-900 tabular-nums">{currency}{selectedOrder.amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Close</Button>
                <Button variant="dark" icon="printer" onClick={() => window.print()}>Print</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </Page>
  );
};

export default Orders;

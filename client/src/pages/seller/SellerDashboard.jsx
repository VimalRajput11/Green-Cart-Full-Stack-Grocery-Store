import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import { STATUS, STATUS_STYLE, PRE_PICKUP, IN_TRANSIT, shortId } from '../../utils/orderStatus';
import { optimizeImg } from '../../utils/image';

const POLL_MS = 15000;
const PACK_SLA_MIN = 10; // new orders should be packed within this many minutes

const dayKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const minutesSince = (d) => Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
const STALE_MIN = 24 * 60; // orders older than a day are treated as stale, not urgent
const ageLabel = (m, date) => (m < 60 ? `${m}m` : m < STALE_MIN ? `${Math.floor(m / 60)}h ${m % 60}m` : new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const Card = ({ title, action, children, className = '' }) => (
  <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);

const Kpi = ({ label, value, sub, tone = 'text-gray-900', icon, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
    </div>
    <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${accent}`}>{icon}</span>
  </div>
);

const Icon = ({ d }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
);

const SellerDashboard = () => {
  const { currency, axios, products } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    try {
      const [o, a] = await Promise.all([axios.get('/api/order/seller'), axios.get('/api/agents')]);
      if (o.data.success) setOrders(o.data.orders);
      if (a.data.success) setAgents(a.data.agents);
    } catch { /* keep last data */ } finally {
      setLoaded(true);
    }
  }, [axios]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    const clock = setInterval(() => tick((n) => n + 1), 30000); // refresh "age" labels
    return () => { clearInterval(t); clearInterval(clock); };
  }, [load]);

  const markPacked = async (id) => {
    setBusyId(id);
    try {
      const { data } = await axios.post('/api/order/status', { orderId: id, status: STATUS.PACKED });
      if (data.success) toast.success('Marked packed');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update');
    } finally {
      setBusyId(null);
    }
  };

  const m = useMemo(() => {
    const today = dayKey(Date.now());
    const yesterday = dayKey(Date.now() - 86400000);
    const live = orders.filter((o) => o.status !== STATUS.CANCELLED);
    const sumBy = (list) => list.reduce((s, o) => s + (o.amount || 0), 0);

    const todayOrders = live.filter((o) => dayKey(o.createdAt) === today);
    const yOrders = live.filter((o) => dayKey(o.createdAt) === yesterday);
    const revToday = sumBy(todayOrders);
    const revYesterday = sumBy(yOrders);
    const change = revYesterday > 0 ? Math.round(((revToday - revYesterday) / revYesterday) * 100) : null;

    // Fresh orders first (oldest first = most urgent), stale ones (over a day old) at the end
    const placed = orders.filter((o) => o.status === STATUS.PLACED);
    const byAge = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
    const freshToPack = placed.filter((o) => minutesSince(o.createdAt) < STALE_MIN).sort(byAge);
    const staleToPack = placed.filter((o) => minutesSince(o.createdAt) >= STALE_MIN).sort((a, b) => byAge(b, a));
    const toPack = [...freshToPack, ...staleToPack];
    const needRider = orders.filter((o) => PRE_PICKUP.includes(o.status) && !o.assignedTo);
    const awaitingPickup = orders.filter((o) => o.status === STATUS.PACKED && o.assignedTo);
    const inTransit = orders.filter((o) => IN_TRANSIT.includes(o.status));
    const deliveredToday = orders.filter((o) => o.status === STATUS.DELIVERED && dayKey(o.deliveredAt || o.updatedAt) === today);
    const failed = orders.filter((o) => o.status === STATUS.FAILED && dayKey(o.updatedAt) === today);
    const refunds = orders.filter((o) => o.refundStatus === 'Pending');
    const overdue = freshToPack.filter((o) => minutesSince(o.createdAt) > PACK_SLA_MIN);

    // Last 7 days revenue
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const key = dayKey(d);
      const list = live.filter((o) => dayKey(o.createdAt) === key);
      return { key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), revenue: sumBy(list), count: list.length };
    });
    const weekRevenue = days.reduce((s, d) => s + d.revenue, 0);
    const weekOrders = days.reduce((s, d) => s + d.count, 0);

    // Top sellers (last 30 days, by units)
    const since = Date.now() - 30 * 86400000;
    const units = new Map();
    for (const o of live) {
      if (new Date(o.createdAt).getTime() < since) continue;
      for (const it of o.items) {
        const p = it.product;
        if (!p?._id) continue;
        const cur = units.get(p._id) || { product: p, qty: 0 };
        cur.qty += it.quantity;
        units.set(p._id, cur);
      }
    }
    const topSellers = [...units.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

    const outOfStock = products.filter((p) => p.stock <= 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5).sort((a, b) => a.stock - b.stock);

    const online = agents.filter((a) => !a.isBlocked && a.status !== 'Inactive');
    const busy = agents.filter((a) => a.status === 'On Delivery');
    const cashWithRiders = agents.reduce((s, a) => s + (a.stats?.cashInHand || 0), 0);

    return {
      revToday, change, todayOrders, toPack, needRider, awaitingPickup, inTransit, deliveredToday, failed, refunds, overdue,
      days, weekRevenue, weekOrders, topSellers, outOfStock, lowStock, online, busy, cashWithRiders,
      staleToPack,
      needsAction: toPack.length + needRider.filter((o) => o.status === STATUS.PACKED).length + refunds.length,
    };
  }, [orders, agents, products]);

  if (!loaded) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600" />
      </div>
    );
  }

  const maxRev = Math.max(1, ...m.days.map((d) => d.revenue));
  const pipeline = [
    { label: 'New', value: m.toPack.length, cls: 'bg-amber-500', filter: 'New' },
    { label: 'Needs rider', value: m.needRider.length, cls: 'bg-orange-500', filter: 'Packed' },
    { label: 'Awaiting pickup', value: m.awaitingPickup.length, cls: 'bg-sky-500', filter: 'Packed' },
    { label: 'In transit', value: m.inTransit.length, cls: 'bg-violet-500', filter: 'In Transit' },
    { label: 'Delivered today', value: m.deliveredToday.length, cls: 'bg-green-600', filter: 'Delivered' },
    { label: 'Failed today', value: m.failed.length, cls: 'bg-red-500', filter: 'Failed' },
  ];
  const pipeMax = Math.max(1, ...pipeline.map((p) => p.value));

  return (
    <div className="p-4 md:p-8 bg-[#f7f8fa] min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Store overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live · updates every 15s
          </span>
          <button onClick={() => navigate('/seller/orders')} className="text-sm font-semibold bg-gray-900 text-white rounded-xl px-4 py-2 hover:bg-black">
            Open orders
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <Kpi
          label="Revenue today"
          value={`${currency}${Math.round(m.revToday).toLocaleString()}`}
          sub={m.change === null ? 'No sales yesterday to compare' : `${m.change >= 0 ? '▲' : '▼'} ${Math.abs(m.change)}% vs yesterday`}
          tone="text-gray-900"
          accent="bg-green-50 text-green-700"
          icon={<Icon d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.6 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.4-2.6-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <Kpi
          label="Orders today"
          value={m.todayOrders.length}
          sub={`${m.deliveredToday.length} delivered · ${m.inTransit.length} on the way`}
          accent="bg-sky-50 text-sky-700"
          icon={<Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}
        />
        <Kpi
          label="Needs your action"
          value={m.needsAction}
          sub={m.overdue.length ? `${m.overdue.length} waiting over ${PACK_SLA_MIN} min` : 'Packing on time'}
          tone={m.overdue.length ? 'text-red-600' : 'text-gray-900'}
          accent={m.overdue.length ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}
          icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <Kpi
          label="Riders online"
          value={`${m.online.length}/${agents.length}`}
          sub={`${m.busy.length} on delivery · ${currency}${m.cashWithRiders} cash held`}
          accent="bg-violet-50 text-violet-700"
          icon={<Icon d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h2m8 0h2m-2 0H9m10 0h1a1 1 0 001-1v-3.65a1 1 0 00-.22-.62l-3.48-4.35A1 1 0 0016.52 6H13M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Action queue */}
        <Card
          className="xl:col-span-2"
          title={`To pack · ${m.toPack.length}`}
          action={<button onClick={() => navigate('/seller/orders')} className="text-xs font-semibold text-green-700 hover:underline">All orders</button>}
        >
          {m.toPack.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-gray-500">No new orders waiting. 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {m.toPack.slice(0, 6).map((o) => {
                const age = minutesSince(o.createdAt);
                const stale = age >= STALE_MIN;
                const late = !stale && age > PACK_SLA_MIN;
                const units = o.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <li key={o._id} className={`flex items-center gap-3 px-5 py-3 ${stale ? 'bg-gray-50/60' : ''}`}>
                    <span
                      title={`Placed ${new Date(o.createdAt).toLocaleString()}`}
                      className={`w-16 shrink-0 text-center text-xs font-bold rounded-lg py-1 ${stale ? 'bg-gray-200 text-gray-500' : late ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}
                    >
                      {ageLabel(age, o.createdAt)}
                    </span>
                    {/* fixed width so order details line up whatever the item count */}
                    <div className="hidden sm:block relative w-[72px] h-9 shrink-0">
                      {o.items.slice(0, o.items.length > 3 ? 2 : 3).map((it, i) => (
                        <img key={i} src={optimizeImg(it.product?.image?.[0], 80)} alt="" style={{ left: `${i * 18}px` }} className="absolute top-0 w-9 h-9 rounded-full border-2 border-white bg-gray-50 object-contain" />
                      ))}
                      {o.items.length > 3 && (
                        <span className="absolute top-0 left-[36px] w-9 h-9 rounded-full border-2 border-white bg-gray-100 text-[10px] font-bold text-gray-600 flex items-center justify-center">+{o.items.length - 2}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">#{shortId(o._id)} · {o.address?.firstName} {o.address?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{plural(units, 'item')} · {currency}{o.amount} · {o.paymentType === 'COD' ? 'Cash on delivery' : 'Paid online'}</p>
                    </div>
                    <button
                      disabled={busyId === o._id}
                      onClick={() => markPacked(o._id)}
                      className="shrink-0 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
                    >
                      {busyId === o._id ? '…' : 'Mark packed'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {m.toPack.length > 6 && (
            <button onClick={() => navigate('/seller/orders')} className="mx-5 mt-1 text-xs font-semibold text-green-700 hover:underline">
              + {m.toPack.length - 6} more to pack
            </button>
          )}
          {m.staleToPack.length > 0 && (
            <div className={`mx-5 mt-3 ${m.needRider.length ? "" : "mb-5"} flex items-center justify-between gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3`}>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{plural(m.staleToPack.length, 'order')}</span> older than a day still not packed. Pack them or cancel with a reason.
              </p>
              <button onClick={() => navigate('/seller/orders')} className="shrink-0 text-xs font-bold text-gray-800 underline">Review</button>
            </div>
          )}
          {m.needRider.length > 0 && (
            <div className="mx-5 mb-5 mt-3 flex items-center justify-between gap-3 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
              <p className="text-sm text-orange-800"><span className="font-bold">{plural(m.needRider.length, 'order')}</span> waiting for a rider{m.online.length === 0 ? ' — no riders online' : ''}</p>
              <button onClick={() => navigate('/seller/orders')} className="text-xs font-bold text-orange-800 underline">Assign</button>
            </div>
          )}
        </Card>

        {/* Pipeline */}
        <Card title="Live pipeline">
          <ul className="px-5 pb-5 space-y-3">
            {pipeline.map((p) => (
              <li key={p.label}>
                <button onClick={() => navigate('/seller/orders')} className="w-full text-left group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 group-hover:text-gray-900">{p.label}</span>
                    <span className="font-bold text-gray-900">{p.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${p.cls}`} style={{ width: `${(p.value / pipeMax) * 100}%` }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {m.refunds.length > 0 && (
            <div className="mx-5 mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <span className="font-bold">{m.refunds.length}</span> refund{m.refunds.length > 1 ? 's' : ''} pending
            </div>
          )}
        </Card>

        {/* Revenue chart */}
        <Card
          className="xl:col-span-2"
          title="Last 7 days"
          action={<span className="text-xs text-gray-500">{currency}{Math.round(m.weekRevenue).toLocaleString()} · {m.weekOrders} orders</span>}
        >
          <div className="px-5 pb-5">
            <div className="h-44 flex items-end gap-2 sm:gap-4">
              {m.days.map((d, i) => (
                <div key={d.key} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group">
                  <span className="text-[10px] font-semibold text-gray-500 opacity-0 group-hover:opacity-100 transition">{currency}{Math.round(d.revenue)}</span>
                  <div
                    className={`w-full max-w-[44px] rounded-t-lg ${i === 6 ? 'bg-green-600' : 'bg-green-200 group-hover:bg-green-300'} transition-colors`}
                    style={{ height: `${Math.max(3, (d.revenue / maxRev) * 100)}%` }}
                    title={`${d.label}: ${currency}${Math.round(d.revenue)} from ${d.count} orders`}
                  />
                  <span className={`text-xs ${i === 6 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{i === 6 ? 'Today' : d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Fleet */}
        <Card
          title="Delivery fleet"
          action={<button onClick={() => navigate('/seller/agents')} className="text-xs font-semibold text-green-700 hover:underline">Manage</button>}
        >
          {agents.length === 0 ? (
            <div className="px-5 pb-5 text-sm text-gray-500">
              No riders yet.{' '}
              <button onClick={() => navigate('/seller/agents')} className="font-semibold text-green-700 underline">Add a rider</button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {[...agents]
                .sort((a, b) => (b.status !== 'Inactive') - (a.status !== 'Inactive') || (b.stats?.activeOrders || 0) - (a.stats?.activeOrders || 0))
                .slice(0, 5)
                .map((a) => {
                  const on = !a.isBlocked && a.status !== 'Inactive';
                  return (
                    <li key={a._id} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="relative">
                        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center uppercase">{a.name.slice(0, 2)}</span>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${a.isBlocked ? 'bg-red-500' : a.status === 'On Delivery' ? 'bg-violet-500' : on ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.isBlocked ? 'Blocked' : a.status === 'On Delivery' ? `${a.stats?.activeOrders || 0} active` : on ? 'Available' : 'Offline'} · {a.stats?.todayDeliveries || 0} today</p>
                      </div>
                      {(a.stats?.cashInHand || 0) > 0 && <span className="text-xs font-bold text-orange-600">{currency}{a.stats.cashInHand}</span>}
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>

        {/* Recent orders */}
        <Card
          className="xl:col-span-2 overflow-hidden"
          title="Recent orders"
          action={<button onClick={() => navigate('/seller/orders')} className="text-xs font-semibold text-green-700 hover:underline">View all</button>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-y border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-2.5 font-semibold">Order</th>
                  <th className="px-3 py-2.5 font-semibold">Customer</th>
                  <th className="hidden sm:table-cell px-3 py-2.5 font-semibold">Rider</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 8).map((o) => (
                  <tr key={o._id} onClick={() => navigate('/seller/orders')} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">#{shortId(o._id)}</p>
                      <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{o.address?.firstName} {o.address?.lastName}</td>
                    <td className="hidden sm:table-cell px-3 py-3 text-gray-500 whitespace-nowrap">{o.assignedTo?.name || '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{currency}{o.amount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block whitespace-nowrap text-[11px] font-bold px-2 py-0.5 rounded-md border ${STATUS_STYLE[o.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-gray-400">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Inventory + top sellers */}
        <div className="space-y-4 md:space-y-6">
          <Card
            title="Inventory alerts"
            action={<button onClick={() => navigate('/seller/product-list')} className="text-xs font-semibold text-green-700 hover:underline">Products</button>}
          >
            <div className="px-5 pb-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-red-50 px-3 py-2">
                <p className="text-xs text-red-700">Out of stock</p>
                <p className="text-lg font-bold text-red-700">{m.outOfStock.length}</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-700">Low (&lt; 5)</p>
                <p className="text-lg font-bold text-amber-700">{m.lowStock.length}</p>
              </div>
            </div>
            <ul className="px-5 pb-4 pt-2 space-y-2">
              {[...m.outOfStock, ...m.lowStock].slice(0, 5).map((p) => (
                <li key={p._id} className="flex items-center gap-3">
                  <img src={optimizeImg(p.image?.[0], 80)} alt="" className="w-8 h-8 rounded-lg bg-gray-50 object-contain" />
                  <span className="flex-1 min-w-0 text-sm text-gray-700 truncate">{p.name}</span>
                  <span className={`text-xs font-bold ${p.stock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.stock <= 0 ? 'Out' : `${p.stock} left`}</span>
                </li>
              ))}
              {m.outOfStock.length + m.lowStock.length === 0 && <li className="text-sm text-gray-500">All products well stocked.</li>}
            </ul>
          </Card>

          <Card title="Top sellers · 30 days">
            <ul className="px-5 pb-4 space-y-2">
              {m.topSellers.length === 0 && <li className="text-sm text-gray-500">No sales in the last 30 days.</li>}
              {m.topSellers.map(({ product, qty }, i) => (
                <li key={product._id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                  <img src={optimizeImg(product.image?.[0], 80)} alt="" className="w-8 h-8 rounded-lg bg-gray-50 object-contain" />
                  <span className="flex-1 min-w-0 text-sm text-gray-700 truncate">{product.name}</span>
                  <span className="text-xs font-bold text-gray-900">{qty} sold</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;

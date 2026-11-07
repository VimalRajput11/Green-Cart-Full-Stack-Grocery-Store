import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import { STATUS, STATUS_STYLE, PRE_PICKUP, IN_TRANSIT, shortId } from '../../utils/orderStatus';
import { optimizeImg } from '../../utils/image';
import { Page, PageHeader, Card, StatCard, Badge, Avatar, Button, EmptyState, Spinner, LivePill, Icon } from '../../components/Seller/ui';

const POLL_MS = 15000;
const PACK_SLA_MIN = 10; // new orders should be packed within this many minutes

const dayKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const minutesSince = (d) => Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
const STALE_MIN = 24 * 60; // orders older than a day are treated as stale, not urgent
const ageLabel = (m, date) => (m < 60 ? `${m}m` : m < STALE_MIN ? `${Math.floor(m / 60)}h ${m % 60}m` : new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

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

  if (!loaded) return <Spinner className="h-[70vh]" />;

  const maxRev = Math.max(1, ...m.days.map((d) => d.revenue));
  const pipeline = [
    { label: 'New', value: m.toPack.length, bar: 'bg-amber-500' },
    { label: 'Needs rider', value: m.needRider.length, bar: 'bg-orange-500' },
    { label: 'Awaiting pickup', value: m.awaitingPickup.length, bar: 'bg-sky-500' },
    { label: 'In transit', value: m.inTransit.length, bar: 'bg-violet-500' },
    { label: 'Delivered today', value: m.deliveredToday.length, bar: 'bg-green-600' },
    { label: 'Failed today', value: m.failed.length, bar: 'bg-red-500' },
  ];
  const pipeMax = Math.max(1, ...pipeline.map((p) => p.value));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const linkBtn = (label, to) => (
    <button onClick={() => navigate(to)} className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800">
      {label} <Icon name="chevronRight" className="w-3.5 h-3.5" strokeWidth={2.2} />
    </button>
  );

  return (
    <Page>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`${greeting} 👋`}
        subtitle="Here's what's happening in your store right now."
        actions={<>
          <LivePill>Live · every 15s</LivePill>
          <Button variant="dark" icon="orders" onClick={() => navigate('/seller/orders')}>Open orders</Button>
        </>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Revenue today"
          value={`${currency}${Math.round(m.revToday).toLocaleString()}`}
          hint={m.change === null ? 'No sales yesterday to compare' : `${m.change >= 0 ? '▲' : '▼'} ${Math.abs(m.change)}% vs yesterday`}
          hintClass={m.change === null ? 'text-slate-500' : m.change >= 0 ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}
          icon="money"
          tone="green"
        />
        <StatCard
          label="Orders today"
          value={m.todayOrders.length}
          hint={`${m.deliveredToday.length} delivered · ${m.inTransit.length} on the way`}
          icon="orders"
          tone="sky"
        />
        <StatCard
          label="Needs your action"
          value={m.needsAction}
          hint={m.overdue.length ? `${m.overdue.length} waiting over ${PACK_SLA_MIN} min` : 'Packing on time'}
          valueClass={m.overdue.length ? 'text-red-600' : 'text-slate-900'}
          hintClass={m.overdue.length ? 'text-red-600 font-medium' : 'text-slate-500'}
          icon="clock"
          tone={m.overdue.length ? 'red' : 'amber'}
        />
        <StatCard
          label="Riders online"
          value={<>{m.online.length}<span className="text-slate-400 text-lg font-medium">/{agents.length}</span></>}
          hint={`${m.busy.length} on delivery · ${currency}${m.cashWithRiders} cash held`}
          icon="truck"
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Packing queue */}
        <Card
          className="xl:col-span-2"
          title={<span className="flex items-center gap-2">Packing queue <Badge tone={m.toPack.length ? 'amber' : 'slate'}>{m.toPack.length}</Badge></span>}
          subtitle={`Pack new orders within ${PACK_SLA_MIN} minutes`}
          action={linkBtn('All orders', '/seller/orders')}
        >
          {m.toPack.length === 0 ? (
            <EmptyState icon="check" title="All caught up" text="No new orders waiting to be packed." />
          ) : (
            <ul className="border-t border-slate-100 divide-y divide-slate-100">
              {m.toPack.slice(0, 6).map((o) => {
                const age = minutesSince(o.createdAt);
                const stale = age >= STALE_MIN;
                const late = !stale && age > PACK_SLA_MIN;
                const units = o.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <li key={o._id} className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70 ${stale ? 'bg-slate-50/60' : ''}`}>
                    <span
                      title={`Placed ${new Date(o.createdAt).toLocaleString()}`}
                      className={`w-[68px] shrink-0 inline-flex items-center justify-center gap-1 text-xs font-semibold rounded-lg py-1.5 ring-1 ring-inset tabular-nums ${stale ? 'bg-slate-100 text-slate-500 ring-slate-500/10' : late ? 'bg-red-50 text-red-700 ring-red-600/15' : 'bg-green-50 text-green-700 ring-green-600/15'}`}
                    >
                      {!stale && <Icon name="clock" className="w-3 h-3" strokeWidth={2.2} />}
                      {ageLabel(age, o.createdAt)}
                    </span>
                    {/* fixed width so order details line up whatever the item count */}
                    <div className="hidden sm:block relative w-[76px] h-9 shrink-0">
                      {o.items.slice(0, o.items.length > 3 ? 2 : 3).map((it, i) => (
                        <img key={i} src={optimizeImg(it.product?.image?.[0], 80)} alt="" style={{ left: `${i * 20}px` }} className="absolute top-0 w-9 h-9 rounded-full ring-2 ring-white bg-slate-50 object-contain p-0.5" />
                      ))}
                      {o.items.length > 3 && (
                        <span className="absolute top-0 left-[40px] w-9 h-9 rounded-full ring-2 ring-white bg-slate-100 text-[10px] font-semibold text-slate-600 flex items-center justify-center">+{o.items.length - 2}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        <span className="text-slate-400 font-medium">#{shortId(o._id)}</span> · {o.address?.firstName} {o.address?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{plural(units, 'item')} · {currency}{o.amount} · {o.paymentType === 'COD' ? 'Cash on delivery' : 'Paid online'}</p>
                    </div>
                    <Button size="sm" icon="check" loading={busyId === o._id} onClick={() => markPacked(o._id)}>
                      <span className="hidden sm:inline">Mark packed</span><span className="sm:hidden">Packed</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {(m.toPack.length > 6 || m.staleToPack.length > 0 || m.needRider.length > 0) && (
            <div className="px-5 pb-5 pt-3 space-y-2.5 border-t border-slate-100">
              {m.toPack.length > 6 && (
                <button onClick={() => navigate('/seller/orders')} className="text-xs font-semibold text-green-700 hover:text-green-800">
                  + {m.toPack.length - 6} more to pack
                </button>
              )}
              {m.staleToPack.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-200 px-4 py-3">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">{plural(m.staleToPack.length, 'order')}</span> older than a day still not packed. Pack them or cancel with a reason.
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/seller/orders')}>Review</Button>
                </div>
              )}
              {m.needRider.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-orange-50 ring-1 ring-inset ring-orange-200 px-4 py-3">
                  <p className="text-sm text-orange-900 flex items-center gap-2">
                    <Icon name="truck" className="w-4 h-4 text-orange-600" />
                    <span><span className="font-semibold">{plural(m.needRider.length, 'order')}</span> waiting for a rider{m.online.length === 0 ? ' — no riders online' : ''}</span>
                  </p>
                  <Button size="sm" variant="warning" onClick={() => navigate('/seller/orders')}>Assign</Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Pipeline */}
        <Card title="Live pipeline" subtitle="Orders by stage right now" action={linkBtn('Orders', '/seller/orders')}>
          <ul className="px-5 pb-5 space-y-3.5">
            {pipeline.map((p) => (
              <li key={p.label}>
                <button onClick={() => navigate('/seller/orders')} className="w-full text-left group">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900">
                      <span className={`w-2 h-2 rounded-full ${p.bar}`} />{p.label}
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">{p.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${p.bar} transition-all duration-500`} style={{ width: `${(p.value / pipeMax) * 100}%` }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {m.refunds.length > 0 && (
            <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-red-50 ring-1 ring-inset ring-red-200 px-4 py-3 text-sm text-red-800">
              <Icon name="alert" className="w-4 h-4 text-red-600" />
              <span><span className="font-semibold">{m.refunds.length}</span> refund{m.refunds.length > 1 ? 's' : ''} pending</span>
            </div>
          )}
        </Card>

        {/* Revenue chart */}
        <Card
          className="xl:col-span-2"
          title="Revenue · last 7 days"
          subtitle={`${m.weekOrders} orders this week`}
          action={<span className="text-xl font-semibold text-slate-900 tabular-nums">{currency}{Math.round(m.weekRevenue).toLocaleString()}</span>}
        >
          <div className="px-5 pb-5">
            <div className="relative h-52">
              {/* gridlines */}
              <div className="absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((i) => <div key={i} className="border-t border-dashed border-slate-100" />)}
              </div>
              <div className="relative h-full flex items-end gap-2 sm:gap-4">
                {m.days.map((d, i) => {
                  const today = i === 6;
                  return (
                    <div key={d.key} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group">
                      <span className={`text-[11px] font-semibold tabular-nums transition ${today ? 'text-green-700' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}>
                        {currency}{Math.round(d.revenue).toLocaleString()}
                      </span>
                      <div className="w-full max-w-[48px] flex-1 flex items-end">
                        <div
                          className={`w-full rounded-lg transition-all duration-500 ${today ? 'bg-gradient-to-t from-green-600 to-emerald-400 shadow-md shadow-green-600/20' : 'bg-slate-200 group-hover:bg-green-300'}`}
                          style={{ height: `${Math.max(3, (d.revenue / maxRev) * 100)}%` }}
                          title={`${d.label}: ${currency}${Math.round(d.revenue)} from ${d.count} orders`}
                        />
                      </div>
                      <span className={`text-xs ${today ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{today ? 'Today' : d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Fleet */}
        <Card title="Delivery fleet" subtitle={`${m.online.length} online · ${m.busy.length} on delivery`} action={linkBtn('Manage', '/seller/agents')}>
          {agents.length === 0 ? (
            <EmptyState icon="truck" title="No riders yet" text="Add a delivery partner to start dispatching."
              action={<Button size="sm" icon="plus" onClick={() => navigate('/seller/agents')}>Add a rider</Button>} />
          ) : (
            <ul className="px-2 pb-3">
              {[...agents]
                .sort((a, b) => (b.status !== 'Inactive') - (a.status !== 'Inactive') || (b.stats?.activeOrders || 0) - (a.stats?.activeOrders || 0))
                .slice(0, 5)
                .map((a) => {
                  const on = !a.isBlocked && a.status !== 'Inactive';
                  return (
                    <li key={a._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
                      <span className="relative">
                        <Avatar name={a.name} size="sm" tone={a.isBlocked ? 'red' : on ? 'green' : 'slate'} />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${a.isBlocked ? 'bg-red-500' : a.status === 'On Delivery' ? 'bg-violet-500' : on ? 'bg-green-500' : 'bg-slate-300'}`} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.isBlocked ? 'Blocked' : a.status === 'On Delivery' ? `${a.stats?.activeOrders || 0} active` : on ? 'Available' : 'Offline'} · {a.stats?.todayDeliveries || 0} today</p>
                      </div>
                      {(a.stats?.cashInHand || 0) > 0 && <Badge tone="orange">{currency}{a.stats.cashInHand}</Badge>}
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>

        {/* Recent orders */}
        <Card className="xl:col-span-2 overflow-hidden" title="Recent orders" subtitle="Latest activity across your store" action={linkBtn('View all', '/seller/orders')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-y border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-2.5 font-medium">Order</th>
                  <th className="px-3 py-2.5 font-medium">Customer</th>
                  <th className="hidden sm:table-cell px-3 py-2.5 font-medium">Rider</th>
                  <th className="px-3 py-2.5 font-medium text-right">Amount</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 8).map((o) => (
                  <tr key={o._id} onClick={() => navigate('/seller/orders')} className="hover:bg-slate-50/70 cursor-pointer transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">#{shortId(o._id)}</p>
                      <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{o.address?.firstName} {o.address?.lastName}</td>
                    <td className="hidden sm:table-cell px-3 py-3 text-slate-500 whitespace-nowrap">{o.assignedTo?.name || '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums">{currency}{o.amount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block whitespace-nowrap text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[o.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <EmptyState icon="orders" title="No orders yet" text="New orders will show up here as they come in." />}
          </div>
        </Card>

        {/* Inventory + top sellers */}
        <div className="space-y-4 md:space-y-6">
          <Card title="Inventory alerts" action={linkBtn('Products', '/seller/product-list')}>
            <div className="px-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-red-50 ring-1 ring-inset ring-red-100 px-3.5 py-2.5">
                <p className="text-xs font-medium text-red-700">Out of stock</p>
                <p className="text-xl font-semibold text-red-700 tabular-nums">{m.outOfStock.length}</p>
              </div>
              <div className="rounded-xl bg-amber-50 ring-1 ring-inset ring-amber-100 px-3.5 py-2.5">
                <p className="text-xs font-medium text-amber-700">Low (&lt; 5)</p>
                <p className="text-xl font-semibold text-amber-700 tabular-nums">{m.lowStock.length}</p>
              </div>
            </div>
            <ul className="px-5 pb-5 pt-3 space-y-2.5">
              {[...m.outOfStock, ...m.lowStock].slice(0, 5).map((p) => (
                <li key={p._id} className="flex items-center gap-3">
                  <img src={optimizeImg(p.image?.[0], 80)} alt="" className="w-9 h-9 rounded-lg bg-slate-50 ring-1 ring-slate-100 object-contain p-0.5" />
                  <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">{p.name}</span>
                  <Badge tone={p.stock <= 0 ? 'red' : 'amber'}>{p.stock <= 0 ? 'Out' : `${p.stock} left`}</Badge>
                </li>
              ))}
              {m.outOfStock.length + m.lowStock.length === 0 && (
                <li className="flex items-center gap-2 text-sm text-slate-500"><Icon name="check" className="w-4 h-4 text-green-600" /> All products well stocked.</li>
              )}
            </ul>
          </Card>

          <Card title="Top sellers" subtitle="Last 30 days, by units">
            <ul className="px-5 pb-5 space-y-2.5">
              {m.topSellers.length === 0 && <li className="text-sm text-slate-500">No sales in the last 30 days.</li>}
              {m.topSellers.map(({ product, qty }, i) => (
                <li key={product._id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md text-[11px] font-semibold flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                  <img src={optimizeImg(product.image?.[0], 80)} alt="" className="w-9 h-9 rounded-lg bg-slate-50 ring-1 ring-slate-100 object-contain p-0.5" />
                  <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">{product.name}</span>
                  <span className="text-xs font-semibold text-slate-900 tabular-nums">{qty} sold</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Page>
  );
};

export default SellerDashboard;

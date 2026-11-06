import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import { STATUS, STATUS_STYLE, IN_TRANSIT, shortId, mapsLink, timeAgo } from '../../utils/orderStatus';

const POLL_MS = 15000;

const Stat = ({ label, value, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
    <p className={`text-lg font-bold mt-0.5 ${accent || 'text-gray-900'}`}>{value}</p>
  </div>
);

const Pill = ({ status }) => (
  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${STATUS_STYLE[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
    {status}
  </span>
);

const ItemsList = ({ items }) => (
  <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
    {items.map((it, i) => (
      <li key={i} className="flex items-center gap-3 px-3 py-2 bg-white">
        <img src={it.product?.image?.[0]} alt="" className="w-9 h-9 object-contain bg-gray-50 rounded" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{it.product?.name || 'Item'}</p>
          {it.product?.weight && <p className="text-[11px] text-gray-400">{it.product.weight}</p>}
        </div>
        <span className="text-sm font-bold text-gray-700">× {it.quantity}</span>
      </li>
    ))}
  </ul>
);

// ---------------------------------------------------------------------------

const CompleteModal = ({ order, onClose, onDone }) => {
  const { axios, currency } = useAppContext();
  const [otp, setOtp] = useState('');
  const [method, setMethod] = useState(order.isPaid ? null : 'cash');
  const [paid, setPaid] = useState(order.isPaid);
  const [busy, setBusy] = useState(false);

  const payByUpi = async () => {
    setBusy(true);
    try {
      const { data } = await axios.post(`/api/agents/orders/${order._id}/upi`);
      if (!data.success) throw new Error(data.message);
      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'GreenCart',
        description: `Order #${shortId(order._id)}`,
        order_id: data.order.id,
        prefill: { contact: order.address?.phone || '' },
        theme: { color: '#16a34a' },
        handler: async (response) => {
          try {
            const v = await axios.post(`/api/agents/orders/${order._id}/upi/verify`, response);
            if (v.data.success) { setPaid(true); toast.success(v.data.message); }
          } catch (e) {
            toast.error(e.response?.data?.message || 'Payment verification failed');
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not start UPI payment');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (otp.length !== 4) return toast.error('Enter the 4-digit OTP');
    setBusy(true);
    try {
      const { data } = await axios.post(`/api/agents/orders/${order._id}/complete`, {
        otp, collectionMethod: paid ? undefined : method,
      });
      if (data.success) { toast.success('Delivered!'); onDone(); }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not complete delivery');
    } finally {
      setBusy(false);
    }
  };

  const needsCash = !paid && method === 'cash';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <form onSubmit={submit} className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Complete delivery</h3>
          <button type="button" onClick={onClose} className="text-gray-400 text-xl leading-none px-2" aria-label="Close">×</button>
        </div>

        {/* Payment */}
        {paid ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-sm font-semibold text-green-800">
            ✓ Payment received{order.paymentType === 'Online' ? ' (prepaid online)' : ''}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Collect from customer</p>
            <p className="text-3xl font-bold text-gray-900">{currency}{order.amount}</p>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'upi'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-bold ${method === m ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}
                >
                  {m === 'cash' ? 'Cash' : 'UPI / Online'}
                </button>
              ))}
            </div>
            {method === 'upi' && (
              <button type="button" onClick={payByUpi} disabled={busy} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-60">
                Open UPI payment
              </button>
            )}
          </div>
        )}

        {/* OTP */}
        <div>
          <label htmlFor="otp" className="text-sm text-gray-500">Delivery OTP from customer</label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="mt-1 w-full text-center text-3xl tracking-[0.6em] font-bold border-2 border-gray-200 focus:border-green-600 rounded-2xl py-3 outline-none"
            placeholder="••••"
          />
          <p className="text-[11px] text-gray-400 mt-1">The customer sees this code in their GreenCart orders page.</p>
        </div>

        <button
          type="submit"
          disabled={busy || otp.length !== 4 || (!paid && method === 'upi')}
          className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold disabled:opacity-50"
        >
          {busy ? 'Please wait…' : needsCash ? `Cash collected · Mark delivered` : 'Mark delivered'}
        </button>
      </form>
    </div>
  );
};

const FailModal = ({ order, onClose, onDone }) => {
  const { axios } = useAppContext();
  const [reasons, setReasons] = useState([]);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get('/api/agents/fail-reasons').then(({ data }) => setReasons(data.reasons || [])).catch(() => { });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await axios.post(`/api/agents/orders/${order._id}/fail`, { reason, note });
      if (data.success) { toast.success(data.message); onDone(); }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <form onSubmit={submit} className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Delivery failed?</h3>
          <button type="button" onClick={onClose} className="text-gray-400 text-xl leading-none px-2" aria-label="Close">×</button>
        </div>
        <p className="text-sm text-gray-500">Try calling the customer first. If you still can't deliver, choose a reason and return the parcel to the store.</p>
        <div className="space-y-2">
          {reasons.map((r) => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer text-sm ${reason === r ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-orange-500" />
              {r}
            </label>
          ))}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add a note (optional)" className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-500" />
        <button disabled={!reason || busy} className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold disabled:opacity-50">
          {busy ? 'Please wait…' : 'Confirm failed delivery'}
        </button>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------

const ACTIONS = {
  [STATUS.PACKED]: { action: 'pickup', label: 'Confirm pickup from store', color: 'bg-indigo-600' },
  [STATUS.PICKED]: { action: 'start', label: 'Start delivery', color: 'bg-violet-600' },
  [STATUS.OUT]: { action: 'reached', label: "I've arrived at the location", color: 'bg-fuchsia-600' },
  [STATUS.ARRIVING]: { action: 'reached', label: "I've arrived at the location", color: 'bg-fuchsia-600' },
};

const TaskCard = ({ order, busy, onAdvance, onComplete, onFail, onReturn }) => {
  const { currency } = useAppContext();
  const [showItems, setShowItems] = useState(order.status === STATUS.PACKED);
  const a = order.address || {};
  const next = ACTIONS[order.status];
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-gray-900">#{shortId(order._id)}</span>
          <Pill status={order.status} />
        </div>
        <span className="text-[11px] text-gray-400">{timeAgo(order.acceptedAt || order.createdAt)}</span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="font-bold text-gray-900">{a.firstName} {a.lastName}</p>
          <p className="text-sm text-gray-500 leading-snug">{a.street}, {a.city}{a.zipcode ? ` - ${a.zipcode}` : ''}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a href={mapsLink(a)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Navigate
          </a>
          <a href={`tel:${a.phone}`} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Call customer
          </a>
        </div>

        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setShowItems((s) => !s)} className="text-gray-600 font-medium underline-offset-2 hover:underline">
            {itemCount} item{itemCount > 1 ? 's' : ''} {showItems ? '▴' : '▾'}
          </button>
          {order.isPaid ? (
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded">PREPAID</span>
          ) : (
            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">COLLECT {currency}{order.amount}</span>
          )}
        </div>
        {showItems && <ItemsList items={order.items} />}

        {/* Primary action */}
        {order.status === STATUS.PLACED && (
          <div className="py-3 rounded-2xl bg-amber-50 text-amber-800 text-sm font-semibold text-center">
            Store is packing this order…
          </div>
        )}
        {next && (
          <button
            disabled={busy}
            onClick={() => onAdvance(order._id, next.action)}
            className={`w-full py-3.5 rounded-2xl text-white font-bold ${next.color} disabled:opacity-60 active:scale-[0.99] transition`}
          >
            {busy ? 'Updating…' : next.label}
          </button>
        )}
        {order.status === STATUS.REACHED && (
          <button onClick={() => onComplete(order)} className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold active:scale-[0.99] transition">
            Complete delivery
          </button>
        )}

        {/* Secondary */}
        <div className="flex justify-center">
          {[STATUS.PLACED, STATUS.PACKED].includes(order.status) && (
            <button disabled={busy} onClick={() => onReturn(order._id)} className="text-xs font-semibold text-gray-400 hover:text-red-600">
              Can't take this order? Return it
            </button>
          )}
          {IN_TRANSIT.includes(order.status) && (
            <button onClick={() => onFail(order)} className="text-xs font-semibold text-gray-400 hover:text-orange-600">
              Unable to deliver?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PoolCard = ({ order, busy, disabled, onAccept }) => {
  const { currency } = useAppContext();
  const a = order.address || {};
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{a.street || 'Address'}, {a.city}</p>
          <p className="text-xs text-gray-400 mt-0.5">#{shortId(order._id)} · {itemCount} items · {timeAgo(order.createdAt)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-gray-900">{currency}{order.amount}</p>
          <p className={`text-[10px] font-bold ${order.isPaid ? 'text-green-600' : 'text-orange-600'}`}>{order.isPaid ? 'PREPAID' : 'COD'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Pill status={order.status} />
        <button
          onClick={() => onAccept(order._id)}
          disabled={busy || disabled}
          className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-bold disabled:opacity-50 active:scale-95 transition"
        >
          {busy ? 'Accepting…' : 'Accept'}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

const DeliveryAgentPage = () => {
  const { axios, currency } = useAppContext();
  const { setAgent } = useOutletContext();
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [failing, setFailing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/agents/me/dashboard');
      if (res.data.success) {
        setData(res.data);
        setAgent(res.data.agent);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) window.location.reload();
    }
  }, [axios, setAgent]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const run = async (id, fn, okMsg) => {
    setBusyId(id);
    try {
      const { data: r } = await fn();
      if (r.success) toast.success(okMsg || r.message);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const accept = (id) => run(id, () => axios.post('/api/agents/accept', { orderId: id }), 'Order accepted');
  const advance = (id, action) => run(id, () => axios.post(`/api/agents/orders/${id}/advance`, { action }));
  const giveBack = (id) => {
    if (!window.confirm('Return this order to the pool for another rider?')) return;
    run(id, () => axios.post(`/api/agents/orders/${id}/reject`));
  };

  if (!data) {
    return <div className="py-20 text-center text-gray-400 text-sm">Loading your tasks…</div>;
  }

  const { agent, stats, active, available, limits } = data;
  const online = agent.status !== 'Inactive';
  const full = active.length >= limits.maxActive;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500">Hi {agent.name.split(' ')[0]} 👋</p>
        <h1 className="text-xl font-bold text-gray-900">{online ? (active.length ? 'You have active deliveries' : 'Waiting for orders') : "You're offline"}</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Today" value={`${stats.todayDeliveries} orders`} />
        <Stat label="Earned" value={`${currency}${stats.todayEarnings}`} accent="text-green-700" />
        <Stat label="Cash in hand" value={`${currency}${stats.cashInHand}`} accent={stats.cashInHand > 0 ? 'text-orange-600' : 'text-gray-900'} />
      </div>

      {!online && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
          <p className="font-semibold text-gray-800">Go online to start receiving orders</p>
          <p className="text-sm text-gray-500 mt-1">Use the switch at the top right.</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Active · {active.length}/{limits.maxActive}</h2>
          {active.map((o) => (
            <TaskCard
              key={o._id}
              order={o}
              busy={busyId === o._id}
              onAdvance={advance}
              onComplete={setCompleting}
              onFail={setFailing}
              onReturn={giveBack}
            />
          ))}
        </section>
      )}

      {online && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">New orders · {available.length}</h2>
            <button onClick={load} className="text-xs font-semibold text-green-700">Refresh</button>
          </div>
          {full ? (
            <p className="text-sm text-gray-500 bg-white border border-gray-100 rounded-2xl p-4 text-center">You're at full load. Finish a delivery to take more.</p>
          ) : available.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
              <p className="text-sm text-gray-500">Looking for orders near you…</p>
            </div>
          ) : (
            available.map((o) => (
              <PoolCard key={o._id} order={o} busy={busyId === o._id} disabled={!!busyId} onAccept={accept} />
            ))
          )}
        </section>
      )}

      {completing && <CompleteModal order={completing} onClose={() => setCompleting(null)} onDone={() => { setCompleting(null); load(); }} />}
      {failing && <FailModal order={failing} onClose={() => setFailing(null)} onDone={() => { setFailing(null); load(); }} />}
    </div>
  );
};

export default DeliveryAgentPage;

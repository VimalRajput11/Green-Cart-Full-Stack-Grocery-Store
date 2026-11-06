import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import { STATUS, shortId } from '../../utils/orderStatus';

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
];

const DeliveredOrders = () => {
  const { axios, currency } = useAppContext();
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get(`/api/agents/me/history?days=${days}`);
      if (res.data.success) setData(res.data);
    } catch {
      toast.error('Could not load history');
    }
  };

  useEffect(() => { setData(null); load(); }, [days]);

  const remove = async (id) => {
    if (!window.confirm('Remove this order from your history?')) return;
    try {
      const { data: r } = await axios.delete(`/api/agents/order/${id}`);
      if (r.success) { toast.success(r.message); load(); }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove');
    }
  };

  const orders = data?.orders || [];
  const delivered = orders.filter((o) => o.status === STATUS.DELIVERED);
  const earned = delivered.reduce((s, o) => s + (o.riderPayout || 0), 0);
  const cashCollected = delivered.filter((o) => o.collectionMethod === 'cash').reduce((s, o) => s + o.amount, 0);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Earnings</h1>

      {data?.stats?.cashInHand > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Cash to deposit at store</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{currency}{data.stats.cashInHand}</p>
          <p className="text-xs text-orange-700/80 mt-1">From {data.stats.cashOrders} COD order(s). Hand it to the store manager to settle.</p>
        </div>
      )}

      <div className="flex bg-white border border-gray-100 rounded-xl p-1">
        {RANGES.map((r) => (
          <button key={r.days} onClick={() => setDays(r.days)} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${days === r.days ? 'bg-green-600 text-white' : 'text-gray-500'}`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Earned</p>
          <p className="text-lg font-bold text-green-700">{currency}{earned}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Delivered</p>
          <p className="text-lg font-bold text-gray-900">{delivered.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Cash taken</p>
          <p className="text-lg font-bold text-gray-900">{currency}{cashCollected}</p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Trips</h2>
        {!data ? (
          <p className="text-center text-sm text-gray-400 py-10">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">No trips in this period.</p>
        ) : (
          orders.map((o) => (
            <div key={o._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-gray-900">#{shortId(o._id)}</span>
                  {o.status === STATUS.DELIVERED ? (
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">DELIVERED</span>
                  ) : (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">FAILED</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{o.address?.street}, {o.address?.city}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(o.deliveredAt || o.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  {o.collectionMethod && ` · ${o.collectionMethod.toUpperCase()} ${currency}${o.amount}${o.collectionMethod === 'cash' ? (o.codSettled ? ' (settled)' : ' (to deposit)') : ''}`}
                </p>
                {o.failReason && <p className="text-[11px] text-orange-600 mt-0.5">{o.failReason}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-green-700">{o.riderPayout ? `+${currency}${o.riderPayout}` : '—'}</p>
                <button onClick={() => remove(o._id)} className="text-[11px] text-gray-300 hover:text-red-500 mt-2">Remove</button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default DeliveredOrders;

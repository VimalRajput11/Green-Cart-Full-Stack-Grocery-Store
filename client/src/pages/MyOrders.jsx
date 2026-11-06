import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import {
  STATUS, TRACK_STEPS, stepIndex, STATUS_STYLE, CUSTOMER_HEADLINE, PRE_PICKUP, ACTIVE, FINAL, shortId,
} from '../utils/orderStatus';

const Tracker = ({ status }) => {
  const current = stepIndex(status);
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="Order progress">
      {TRACK_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.key} className="flex flex-col items-center text-center gap-1.5">
            <span className={`h-1.5 w-full rounded-full ${done ? 'bg-green-600' : 'bg-gray-200'} ${i === current && status !== STATUS.DELIVERED ? 'animate-pulse' : ''}`} />
            <span className={`text-[10px] sm:text-xs font-medium leading-tight ${done ? 'text-green-700' : 'text-gray-400'}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
};

const ActiveOrder = ({ order, onCancel }) => {
  const { currency } = useAppContext();
  const rider = order.assignedTo;
  const loc = rider?.currentLocation;
  const canCancel = PRE_PICKUP.includes(order.status);
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
      <div className="bg-green-50 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-green-700">Order #{shortId(order._id)}</p>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">{CUSTOMER_HEADLINE[order.status]}</h2>
        </div>
        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{currency}{order.amount}</p>
      </div>

      <div className="p-5 space-y-5">
        <Tracker status={order.status} />

        <div className="grid sm:grid-cols-2 gap-3">
          {/* OTP */}
          {order.deliveryOtp && (
            <div className="rounded-2xl border-2 border-dashed border-green-300 p-4 text-center">
              <p className="text-xs font-semibold text-gray-500">Share this OTP with your delivery partner</p>
              <p className="text-4xl font-bold tracking-[0.4em] text-gray-900 mt-1 pl-[0.4em]">{order.deliveryOtp}</p>
              <p className="text-[11px] text-gray-400 mt-1">Only share it when you receive your order</p>
            </div>
          )}

          {/* Rider */}
          {rider ? (
            <div className="rounded-2xl bg-gray-50 p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-green-600 text-white font-bold flex items-center justify-center uppercase">{rider.name?.slice(0, 1)}</div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{rider.name}</p>
                  <p className="text-xs text-gray-500">Delivery partner{rider.vehicleNumber ? ` · ${rider.vehicleNumber}` : ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href={`tel:${rider.phone}`} className="py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-center text-gray-800">Call</a>
                {loc?.lat ? (
                  <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noreferrer" className="py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-center text-gray-800">Live location</a>
                ) : (
                  <span className="py-2 rounded-xl bg-white border border-gray-100 text-xs font-medium text-center text-gray-400 flex items-center justify-center">Location soon</span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-4 flex items-center gap-3 text-sm text-gray-600">
              <span className="w-8 h-8 rounded-full border-4 border-green-100 border-t-green-500 animate-spin shrink-0" />
              Assigning a delivery partner…
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-gray-500">
            {itemCount} item{itemCount > 1 ? 's' : ''} · {order.paymentType === 'COD' ? (order.isPaid ? 'Paid' : `Pay ${currency}${order.amount} on delivery`) : 'Paid online'}
            <p className="text-xs text-gray-400 mt-0.5">{order.address?.street}, {order.address?.city}</p>
          </div>
          {canCancel && (
            <button onClick={() => onCancel(order)} className="text-sm font-semibold text-red-600 hover:underline">Cancel order</button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {order.items.map((it, i) => (
            <div key={i} className="relative w-14 h-14 shrink-0 rounded-xl border border-gray-100 bg-gray-50 p-1.5">
              <img src={it.product?.image?.[0] || assets.box_icon} alt={it.product?.name || ''} className="w-full h-full object-contain" />
              {it.quantity > 1 && <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center">{it.quantity}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PastOrder = ({ order, onRemove }) => {
  const { currency } = useAppContext();
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 p-4 text-left" aria-expanded={open}>
        <div className="flex -space-x-3">
          {order.items.slice(0, 3).map((it, i) => (
            <img key={i} src={it.product?.image?.[0] || assets.box_icon} alt="" className="w-10 h-10 rounded-full border-2 border-white bg-gray-50 object-contain" />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_STYLE[order.status]}`}>{order.status}</span>
            {order.refundStatus === 'Pending' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700">Refund in progress</span>}
            {order.refundStatus === 'Refunded' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-50 text-green-700">Refunded</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">#{shortId(order._id)} · {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <span className="font-bold text-gray-900">{currency}{order.amount}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate pr-4">{it.product?.name || 'Product'} × {it.quantity}</span>
              <span className="text-gray-500">{currency}{(it.product?.offerPrice || 0) * it.quantity}</span>
            </div>
          ))}
          {(order.cancelReason || order.failReason) && (
            <p className="text-xs text-red-600">{order.failReason || order.cancelReason}</p>
          )}
          {order.assignedTo?.name && order.status === STATUS.DELIVERED && (
            <p className="text-xs text-gray-400">Delivered by {order.assignedTo.name}</p>
          )}
          <button onClick={() => onRemove(order._id)} className="text-xs font-semibold text-gray-400 hover:text-red-600">Remove from history</button>
        </div>
      )}
    </div>
  );
};

const MyOrders = () => {
  const { axios, user, confirmAction, navigate, setShowUserLogin } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/order/user');
      if (data.success) setOrders(data.orders);
    } catch { /* keep last state */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchOrders();
    const t = setInterval(fetchOrders, 8000);
    return () => clearInterval(t);
  }, [user]);

  const cancelOrder = (order) => {
    confirmAction('Cancel order', `Cancel order #${shortId(order._id)}?${order.isPaid ? ' Your payment will be refunded.' : ''}`, async () => {
      try {
        const { data } = await axios.post(`/api/order/user/${order._id}/cancel`);
        if (data.success) { toast.success(data.message); fetchOrders(); }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not cancel');
        fetchOrders();
      }
    }, 'danger');
  };

  const removeOrder = (id) => {
    confirmAction('Remove order', 'Remove this order from your history?', async () => {
      try {
        const { data } = await axios.delete(`/api/order/user/${id}`);
        if (data.success) fetchOrders();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not remove');
      }
    }, 'danger');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <h1 className="text-2xl font-bold text-gray-900">Log in to see your orders</h1>
        <button onClick={() => setShowUserLogin(true)} className="mt-6 px-8 py-3 rounded-xl bg-green-600 text-white font-semibold">Log in</button>
      </div>
    );
  }

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const past = orders.filter((o) => FINAL.includes(o.status));

  return (
    <div className="max-w-3xl mx-auto py-8 md:py-12 space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Orders</h1>

      {orders.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <img src={assets.box_icon} className="w-16 h-16 mx-auto opacity-20 mb-4 grayscale" alt="" />
          <h3 className="text-lg font-bold text-gray-700">No orders yet</h3>
          <p className="text-gray-500 mt-1 text-sm">Your groceries are just a few taps away.</p>
          <button onClick={() => navigate('/products')} className="mt-6 bg-green-600 text-white px-8 py-3 rounded-xl font-semibold">Start shopping</button>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">In progress</h2>
          {active.map((o) => <ActiveOrder key={o._id} order={o} onCancel={cancelOrder} />)}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Past orders</h2>
          {past.map((o) => <PastOrder key={o._id} order={o} onRemove={removeOrder} />)}
        </section>
      )}
    </div>
  );
};

export default MyOrders;

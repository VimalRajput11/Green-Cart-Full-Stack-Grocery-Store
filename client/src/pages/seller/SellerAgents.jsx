import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { assets } from '../../assets/assets';
import ConfirmModal from '../../components/ConfirmModal';
import { timeAgo } from '../../utils/orderStatus';

const VEHICLES = ['Bike', 'Scooter', 'Cycle', 'EV'];
const EMPTY = { name: '', phone: '', password: '', vehicleType: 'Bike', vehicleNumber: '' };

const statusOf = (a) => {
  if (a.isBlocked) return { label: 'Blocked', cls: 'bg-red-50 border-red-100 text-red-700', dot: 'bg-red-500' };
  if (a.status === 'On Delivery') return { label: 'On delivery', cls: 'bg-violet-50 border-violet-100 text-violet-700', dot: 'bg-violet-500' };
  if (a.status === 'Available') return { label: 'Online', cls: 'bg-green-50 border-green-100 text-green-700', dot: 'bg-green-500' };
  return { label: 'Offline', cls: 'bg-gray-50 border-gray-100 text-gray-500', dot: 'bg-gray-300' };
};

const Summary = ({ label, value, accent = 'text-gray-900' }) => (
  <div className="bg-white p-5 rounded-3xl border border-gray-100/60 shadow-sm">
    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
  </div>
);

const SellerAgents = () => {
  const { axios, currency } = useAppContext();
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, agent: null, kind: null });

  const fetchAgents = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      const { data } = await axios.get('/api/agents');
      if (data.success) {
        setAgents(data.agents);
        if (manual) toast.success('Fleet refreshed');
      }
    } catch {
      if (!manual) toast.error('Failed to fetch riders');
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  };

  const act = async (id, request) => {
    setBusyId(id);
    try {
      const { data } = await request();
      if (data.success) toast.success(data.message);
      await fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const addAgent = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/agents/create', form);
      if (data.success) {
        toast.success('Rider added. Share the phone number and password with them.');
        setForm(EMPTY);
        setShowAddForm(false);
        fetchAgents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add rider');
    }
  };

  const resetPassword = (agent) => {
    const password = window.prompt(`New password for ${agent.name} (min 6 characters):`);
    if (!password) return;
    act(agent._id, () => axios.post(`/api/agents/${agent._id}/reset-password`, { password }));
  };

  const editVehicle = (agent) => {
    const vehicleNumber = window.prompt(`Vehicle number for ${agent.name}:`, agent.vehicleNumber || '');
    if (vehicleNumber === null) return;
    act(agent._id, () => axios.patch(`/api/agents/${agent._id}`, { vehicleNumber }));
  };

  const onConfirm = () => {
    const { agent, kind } = confirmModal;
    setConfirmModal({ isOpen: false, agent: null, kind: null });
    if (kind === 'delete') act(agent._id, () => axios.delete(`/api/agents/${agent._id}`));
    if (kind === 'block') act(agent._id, () => axios.patch(`/api/agents/${agent._id}`, { isBlocked: !agent.isBlocked }));
    if (kind === 'settle') act(agent._id, () => axios.post(`/api/agents/${agent._id}/settle-cash`));
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(() => fetchAgents(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = agents.filter((a) => {
    const term = searchTerm.toLowerCase();
    return a.name.toLowerCase().includes(term) || a.phone.toLowerCase().includes(term) || (a.vehicleNumber || '').toLowerCase().includes(term);
  });

  const summary = useMemo(() => ({
    online: agents.filter((a) => !a.isBlocked && a.status !== 'Inactive').length,
    onDelivery: agents.filter((a) => a.status === 'On Delivery').length,
    deliveriesToday: agents.reduce((s, a) => s + (a.stats?.todayDeliveries || 0), 0),
    cashPending: agents.reduce((s, a) => s + (a.stats?.cashInHand || 0), 0),
  }), [agents]);

  const modalText = {
    delete: { title: 'Delete rider', msg: (a) => `Permanently delete ${a.name}? Their delivery history stays on orders.`, btn: 'Delete' },
    block: { title: 'Change access', msg: (a) => a.isBlocked ? `Allow ${a.name} to log in and take orders again?` : `Block ${a.name}? They will be logged out and can't take orders.`, btn: 'Confirm' },
    settle: { title: 'Settle cash', msg: (a) => `Confirm you received ${currency}${a.stats?.cashInHand} in cash from ${a.name} for ${a.stats?.cashOrders} order(s)?`, btn: 'Cash received' },
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
    </div>
  );

  const field = 'w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 focus:border-green-500/40 outline-none font-semibold text-gray-900 placeholder:text-gray-300';

  return (
    <div className="p-4 md:p-8 bg-[#fcfcfc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-[-0.04em]">Delivery Fleet</h1>
            <p className="text-gray-400 font-semibold mt-1 text-sm">Riders, live status, workload and cash settlement.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchAgents(true)}
              disabled={refreshing}
              className="bg-white text-gray-700 px-5 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 border border-gray-100 disabled:opacity-50"
            >
              <img src={assets.refresh_icon} className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} alt="" />
              {refreshing ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`${showAddForm ? 'bg-gray-900' : 'bg-green-600'} text-white px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2`}
            >
              {showAddForm ? '✕ Cancel' : '+ Add Rider'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Summary label="Online now" value={`${summary.online} / ${agents.length}`} accent="text-green-700" />
          <Summary label="On delivery" value={summary.onDelivery} accent="text-violet-700" />
          <Summary label="Delivered today" value={summary.deliveriesToday} />
          <Summary label="Cash with riders" value={`${currency}${summary.cashPending}`} accent={summary.cashPending > 0 ? 'text-orange-600' : 'text-gray-900'} />
        </div>

        <div className="relative mb-8">
          <img src={assets.search_icon} className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" alt="" />
          <input
            type="text"
            placeholder="Search by name, phone or vehicle number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-100 bg-white focus:outline-none focus:border-green-500/40 font-semibold text-gray-900 placeholder:text-gray-300 text-sm shadow-sm"
          />
        </div>

        {showAddForm && (
          <form onSubmit={addAgent} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-6">New delivery partner</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <label className="space-y-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Full name</span>
                <input required className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ravi Kumar" />
              </label>
              <label className="space-y-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Phone (login ID)</span>
                <input required inputMode="tel" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
              </label>
              <label className="space-y-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Temporary password</span>
                <input required minLength={6} type="text" className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
              </label>
              <label className="space-y-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Vehicle</span>
                <select className={field} value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                  {VEHICLES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label className="space-y-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Vehicle number</span>
                <input className={field} value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })} placeholder="e.g. DL 01 AB 1234" />
              </label>
              <div className="flex items-end">
                <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 hover:bg-green-700 transition">Create rider</button>
              </div>
            </div>
          </form>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest">No riders found</h3>
            <p className="text-gray-300 font-semibold mt-2">Add your first delivery partner to start dispatching.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((agent) => {
              const st = statusOf(agent);
              const s = agent.stats || {};
              const busy = busyId === agent._id;
              return (
                <div key={agent._id} className="bg-white rounded-[2rem] border border-gray-100/60 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold uppercase text-white ${agent.isBlocked ? 'bg-red-400' : agent.status === 'Inactive' ? 'bg-gray-400' : 'bg-green-600'}`}>
                        {agent.name.slice(0, 2)}
                      </div>
                      <span className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-white ${st.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{agent.name}</h3>
                      <p className="text-xs font-semibold text-gray-400">{agent.phone}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">
                        {agent.vehicleType}{agent.vehicleNumber ? ` · ${agent.vehicleNumber}` : ''}
                        <button onClick={() => editVehicle(agent)} className="ml-2 text-green-700 hover:underline">edit</button>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl py-2"><p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Active</p><p className="font-bold text-gray-900">{s.activeOrders ?? 0}</p></div>
                    <div className="bg-gray-50 rounded-xl py-2"><p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Today</p><p className="font-bold text-gray-900">{s.todayDeliveries ?? 0}</p></div>
                    <div className={`rounded-xl py-2 ${s.cashInHand > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}><p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Cash held</p><p className={`font-bold ${s.cashInHand > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{currency}{s.cashInHand ?? 0}</p></div>
                  </div>

                  <p className="text-[11px] text-gray-400 font-semibold -mt-2">
                    Last active {agent.lastSeenAt ? timeAgo(agent.lastSeenAt) : 'never'} · {s.totalDeliveries ?? 0} lifetime deliveries
                    {agent.currentLocation?.lat && (
                      <> · <a className="text-blue-600 hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${agent.currentLocation.lat},${agent.currentLocation.lng}`}>location</a></>
                    )}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <a href={`tel:${agent.phone}`} className="py-2.5 text-center rounded-xl border border-gray-100 text-xs font-bold text-gray-700 hover:border-green-200">Call</a>
                    {s.cashInHand > 0 ? (
                      <button disabled={busy} onClick={() => setConfirmModal({ isOpen: true, agent, kind: 'settle' })} className="py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold disabled:opacity-50">Settle {currency}{s.cashInHand}</button>
                    ) : (
                      <button disabled={busy} onClick={() => resetPassword(agent)} className="py-2.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-700 hover:border-gray-300 disabled:opacity-50">Reset password</button>
                    )}
                    <button disabled={busy} onClick={() => setConfirmModal({ isOpen: true, agent, kind: 'block' })} className={`py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 ${agent.isBlocked ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                      {agent.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button disabled={busy} onClick={() => setConfirmModal({ isOpen: true, agent, kind: 'delete' })} className="py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold disabled:opacity-50">Delete</button>
                  </div>
                  {s.cashInHand > 0 && (
                    <button disabled={busy} onClick={() => resetPassword(agent)} className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 -mt-2">Reset password</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {confirmModal.agent && (
          <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ isOpen: false, agent: null, kind: null })}
            onConfirm={onConfirm}
            title={modalText[confirmModal.kind].title}
            message={modalText[confirmModal.kind].msg(confirmModal.agent)}
            confirmText={modalText[confirmModal.kind].btn}
            cancelText="Cancel"
            type={confirmModal.kind === 'settle' ? 'success' : 'danger'}
          />
        )}
      </div>
    </div>
  );
};

export default SellerAgents;

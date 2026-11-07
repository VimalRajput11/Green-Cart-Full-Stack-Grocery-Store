import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { timeAgo } from '../../utils/orderStatus';
import { Page, PageHeader, Card, StatCard, Badge, Avatar, Button, Field, EmptyState, Spinner, SearchInput, Icon, inputCls } from '../../components/Seller/ui';

const VEHICLES = ['Bike', 'Scooter', 'Cycle', 'EV'];
const EMPTY = { name: '', phone: '', password: '', vehicleType: 'Bike', vehicleNumber: '' };

const statusOf = (a) => {
  if (a.isBlocked) return { label: 'Blocked', tone: 'red', dot: 'bg-red-500', avatar: 'red' };
  if (a.status === 'On Delivery') return { label: 'On delivery', tone: 'violet', dot: 'bg-violet-500', avatar: 'violet' };
  if (a.status === 'Available') return { label: 'Online', tone: 'green', dot: 'bg-green-500', avatar: 'green' };
  return { label: 'Offline', tone: 'slate', dot: 'bg-slate-300', avatar: 'slate' };
};

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

  if (loading) return <Spinner />;

  return (
    <Page>
      <PageHeader
        title="Delivery fleet"
        subtitle="Riders, live status, workload and cash settlement."
        actions={<>
          <Button variant="secondary" icon="refresh" iconClass={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} disabled={refreshing} onClick={() => fetchAgents(true)}>
            {refreshing ? 'Syncing…' : 'Refresh'}
          </Button>
          <Button variant={showAddForm ? 'secondary' : 'primary'} icon={showAddForm ? 'close' : 'plus'} onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add rider'}
          </Button>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Online now" value={<>{summary.online}<span className="text-slate-400 text-lg font-medium">/{agents.length}</span></>} icon="users" tone="green" hint="Available or on delivery" />
        <StatCard label="On delivery" value={summary.onDelivery} icon="truck" tone="violet" hint="Currently out with orders" />
        <StatCard label="Delivered today" value={summary.deliveriesToday} icon="check" tone="sky" hint="Across all riders" />
        <StatCard label="Cash with riders" value={`${currency}${summary.cashPending}`} icon="money" tone={summary.cashPending > 0 ? 'orange' : 'slate'}
          valueClass={summary.cashPending > 0 ? 'text-orange-600' : 'text-slate-900'} hint={summary.cashPending > 0 ? 'Collect and settle' : 'All settled'} />
      </div>

      {showAddForm && (
        <Card title="New delivery partner" subtitle="They'll sign in to the rider app with this phone number and password." bodyClass="px-5 pb-5">
          <form onSubmit={addAgent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Full name">
              <input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ravi Kumar" />
            </Field>
            <Field label="Phone (login ID)">
              <input required inputMode="tel" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
            </Field>
            <Field label="Temporary password">
              <input required minLength={6} type="text" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
            </Field>
            <Field label="Vehicle">
              <select className={`${inputCls} cursor-pointer`} value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                {VEHICLES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Vehicle number">
              <input className={inputCls} value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })} placeholder="e.g. DL 01 AB 1234" />
            </Field>
            <div className="flex items-end">
              <Button type="submit" icon="check" className="w-full">Create rider</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-500"><span className="font-semibold text-slate-900">{filtered.length}</span> rider{filtered.length === 1 ? '' : 's'}</p>
        <SearchInput className="w-full sm:w-80" placeholder="Search name, phone or vehicle number" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="truck" title={agents.length ? 'No riders found' : 'No riders yet'}
            text={agents.length ? 'Try a different search.' : 'Add your first delivery partner to start dispatching.'}
            action={!agents.length && <Button size="sm" icon="plus" onClick={() => setShowAddForm(true)}>Add rider</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((agent) => {
            const st = statusOf(agent);
            const s = agent.stats || {};
            const busy = busyId === agent._id;
            return (
              <div key={agent._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-slate-300/80 transition-all flex flex-col">
                <div className="p-5 flex items-start gap-3.5">
                  <div className="relative">
                    <Avatar name={agent.name} size="lg" tone={st.avatar} />
                    <span className={`absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white ${st.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-slate-900 truncate">{agent.name}</h3>
                      <Badge tone={st.tone} dot>{st.label}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{agent.phone}</p>
                    <button onClick={() => editVehicle(agent)} className="group/v mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-700" title="Edit vehicle number">
                      <Icon name="truck" className="w-3.5 h-3.5" />
                      {agent.vehicleType}{agent.vehicleNumber ? ` · ${agent.vehicleNumber}` : ''}
                      <Icon name="pencil" className="w-3 h-3 opacity-0 group-hover/v:opacity-100" />
                    </button>
                  </div>
                </div>

                <div className="mx-5 grid grid-cols-3 rounded-xl ring-1 ring-inset ring-slate-100 bg-slate-50/70 divide-x divide-slate-100 text-center">
                  <div className="py-2.5"><p className="text-[11px] text-slate-500">Active</p><p className="font-semibold text-slate-900 tabular-nums">{s.activeOrders ?? 0}</p></div>
                  <div className="py-2.5"><p className="text-[11px] text-slate-500">Today</p><p className="font-semibold text-slate-900 tabular-nums">{s.todayDeliveries ?? 0}</p></div>
                  <div className="py-2.5"><p className="text-[11px] text-slate-500">Cash held</p><p className={`font-semibold tabular-nums ${s.cashInHand > 0 ? 'text-orange-600' : 'text-slate-900'}`}>{currency}{s.cashInHand ?? 0}</p></div>
                </div>

                <p className="px-5 mt-3 text-xs text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <Icon name="clock" className="w-3.5 h-3.5 text-slate-400" />
                  Active {agent.lastSeenAt ? timeAgo(agent.lastSeenAt) : 'never'}
                  <span className="text-slate-300">·</span>{s.totalDeliveries ?? 0} lifetime
                  {agent.currentLocation?.lat && (
                    <><span className="text-slate-300">·</span>
                      <a className="inline-flex items-center gap-0.5 text-green-700 font-medium hover:text-green-800" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${agent.currentLocation.lat},${agent.currentLocation.lng}`}>
                        <Icon name="pin" className="w-3.5 h-3.5" />Location
                      </a></>
                  )}
                </p>

                <div className="mt-auto p-5 pt-4 space-y-2">
                  {s.cashInHand > 0 && (
                    <Button variant="warning" icon="money" className="w-full" disabled={busy} onClick={() => setConfirmModal({ isOpen: true, agent, kind: 'settle' })}>
                      Settle {currency}{s.cashInHand}
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <a href={`tel:${agent.phone}`} className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition">
                      <Icon name="phone" className="w-4 h-4" strokeWidth={2} /> Call
                    </a>
                    <Button variant="secondary" size="icon" icon="key" disabled={busy} onClick={() => resetPassword(agent)} title="Reset password" aria-label="Reset password" />
                    <Button variant={agent.isBlocked ? 'soft' : 'secondary'} size="icon" icon={agent.isBlocked ? 'check' : 'ban'} disabled={busy}
                      onClick={() => setConfirmModal({ isOpen: true, agent, kind: 'block' })} title={agent.isBlocked ? 'Unblock' : 'Block'} aria-label={agent.isBlocked ? 'Unblock' : 'Block'} />
                    <Button variant="danger-soft" size="icon" icon="trash" disabled={busy} onClick={() => setConfirmModal({ isOpen: true, agent, kind: 'delete' })} title="Delete rider" aria-label="Delete rider" />
                  </div>
                </div>
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
    </Page>
  );
};

export default SellerAgents;

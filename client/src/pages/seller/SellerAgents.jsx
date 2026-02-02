import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { assets } from '../../assets/assets';
import ConfirmModal from '../../components/ConfirmModal';

const SellerAgents = () => {
  const { axios } = useAppContext();
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [newAgent, setNewAgent] = useState({ name: '', phone: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, agentId: null, agentName: '' });

  const fetchAgents = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const { data } = await axios.get('/api/agents');
      if (data.success) {
        setAgents(data.agents);
        setFilteredAgents(data.agents);
        if (isManualRefresh) toast.success('Agent list refreshed');
      }
    } catch (err) {
      if (!isManualRefresh) toast.error("Failed to fetch agents");
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  const addAgent = async () => {
    if (!newAgent.name || !newAgent.phone) return toast.error("All fields required");
    try {
      const { data } = await axios.post('/api/agents/create', newAgent);
      if (data.success) {
        toast.success("Agent added successfully");
        setNewAgent({ name: '', phone: '', password: '' });
        fetchAgents();
        setShowAddForm(false);
      }
    } catch (err) {
      toast.error("Failed to add agent");
    }
  };

  const removeAgent = async (agentId) => {
    try {
      const { data } = await axios.delete(`/api/agents/${agentId}`);
      if (data.success) {
        toast.success("Agent removed successfully");
        fetchAgents();
        setConfirmModal({ isOpen: false, agentId: null, agentName: '' });
      } else {
        toast.error(data.message || "Failed to remove agent");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to remove agent";
      toast.error(errorMessage);
      setConfirmModal({ isOpen: false, agentId: null, agentName: '' });
    }
  };

  useEffect(() => {
    fetchAgents();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchAgents(false); // Silent refresh
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredAgents(
      agents.filter(agent =>
        agent.name.toLowerCase().includes(term) ||
        agent.phone.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, agents]);

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-8 bg-[#fcfcfc] min-h-screen no-scrollbar overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight tracking-[-0.04em]">Fleet Logistics</h1>
            <p className="text-gray-400 font-semibold mt-1 text-sm">Monitor and manage your active delivery network.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => fetchAgents(true)}
              disabled={refreshing}
              className="bg-white text-gray-700 px-6 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2 border border-gray-100 disabled:opacity-50 active:scale-95"
            >
              <img
                src={assets.refresh_icon}
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                alt=""
              />
              {refreshing ? 'Syncing...' : 'Sync Fleet'}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`${showAddForm ? 'bg-gray-900' : 'bg-green-600'} text-white px-8 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg ${showAddForm ? 'shadow-gray-900/10' : 'shadow-green-500/20'} transition-all flex items-center gap-3 active:scale-95`}
            >
              {showAddForm ? (
                <>
                  <span className="text-lg">✕</span>
                  Abort Registration
                </>
              ) : (
                <>
                  <img src={assets.add_icon} className="w-4 h-4 brightness-0 invert" alt="" />
                  Deploy New Agent
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info & Control Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-gray-100/60 shadow-sm flex items-center justify-between group hover:border-green-100 transition-colors">
            <div>
              <p className="text-[10px] text-gray-300 uppercase font-bold tracking-widest mb-1">Total Strength</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{agents.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="relative group">
              <img src={assets.search_icon} className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20 group-focus-within:opacity-50 transition-opacity" alt="" />
              <input
                type="text"
                placeholder="Find agents by name, ID or mobile terminal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-6 rounded-[1.5rem] border border-gray-100/60 bg-white focus:outline-none focus:ring-8 focus:ring-green-500/5 focus:border-green-500/20 transition-all font-semibold text-gray-900 placeholder:text-gray-300 text-sm shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Add Agent Form */}
        {showAddForm && (
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl mb-12 animate-in fade-in slide-in-from-top-6 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Agent Registration</h2>
                <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest mt-0.5">Initialize new delivery credential</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1">Full Designation</label>
                <input
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 focus:ring-8 focus:ring-green-500/5 focus:border-green-500/20 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300"
                  type="text"
                  placeholder="e.g. Marcus Aurelius"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1">Mobile Terminal</label>
                <input
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 focus:ring-8 focus:ring-green-500/5 focus:border-green-500/20 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300"
                  type="text"
                  placeholder="+91 00000 00000"
                  value={newAgent.phone}
                  onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1">Access Cipher</label>
                <input
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 focus:ring-8 focus:ring-green-500/5 focus:border-green-500/20 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300"
                  type="password"
                  placeholder="Create secure key"
                  value={newAgent.password}
                  onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-10 flex justify-end">
              <button
                className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 hover:shadow-2xl hover:bg-green-700 transition-all active:scale-95"
                onClick={addAgent}
              >
                Launch Protocol
              </button>
            </div>
          </div>
        )}

        {/* Agent Grid */}
        {filteredAgents.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 mt-4">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">No Active Personnel</h3>
            <p className="text-gray-300 font-semibold mt-2">Adjust search parameters or initialize new agent deployment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAgents.map((agent) => (
              <div key={agent._id} className="group bg-white rounded-[2.5rem] border border-gray-100/60 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative flex flex-col pt-0">
                {/* Header Decoration */}
                <div className={`h-24 transition-all duration-500 ${agent.status === 'Available' ? 'bg-gradient-to-br from-green-50/50 to-emerald-50/50' : 'bg-gray-50/50'}`}></div>

                <div className="px-8 pb-8 relative flex flex-col items-center text-center -mt-12">
                  {/* Avatar Container */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-white rounded-[2rem] p-1.5 shadow-xl border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                      <div className={`w-full h-full rounded-[1.5rem] flex items-center justify-center text-2xl font-bold uppercase text-white shadow-inner ${agent.status === 'Available' ? 'bg-green-600' : 'bg-gray-400'}`}>
                        {agent.name.slice(0, 2)}
                      </div>
                    </div>
                    {/* Pulsing Status Dot */}
                    <div className={`absolute -right-1 -bottom-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${agent.status === 'Available' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  </div>

                  <button
                    onClick={() => setConfirmModal({
                      isOpen: true,
                      agentId: agent._id,
                      agentName: agent.name
                    })}
                    className="absolute top-4 right-0 text-gray-300 hover:text-red-600 transition-all p-3 hover:bg-red-50 rounded-2xl opacity-0 group-hover:opacity-100 z-10"
                    title="Terminate Access"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>

                  <div className="w-full">
                    <h3 className="text-xl font-bold text-gray-900 truncate tracking-tight">{agent.name}</h3>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mt-1 group-hover:text-green-600 transition-colors">{agent.phone}</p>

                    <div className="mt-6 flex justify-center">
                      <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${agent.status === 'Available'
                        ? 'bg-green-50 border-green-100 text-green-700'
                        : 'bg-gray-50 border-gray-100 text-gray-500'
                        }`}>
                        {agent.status === 'Available' ? 'Operational' : 'Off-Duty'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 mt-8">
                      <a
                        href={`tel:${agent.phone}`}
                        className="flex items-center justify-center gap-3 py-4 bg-[#fcfcfc] border border-gray-100 rounded-2xl text-[10px] font-semibold text-gray-900 uppercase tracking-widest hover:bg-white hover:border-green-200 hover:shadow-lg hover:shadow-green-500/5 transition-all active:scale-95 group/call"
                      >
                        <svg className="w-4 h-4 text-gray-300 group-hover/call:text-green-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        Initiate Voice Call
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, agentId: null, agentName: '' })}
          onConfirm={() => removeAgent(confirmModal.agentId)}
          title="Revoke Permission"
          message={`Confirm termination of logistics credentials for ${confirmModal.agentName}?`}
          confirmText="Terminate Access"
          cancelText="Retain Access"
          type="danger"
        />
      </div>
    </div>
  );
};

export default SellerAgents;

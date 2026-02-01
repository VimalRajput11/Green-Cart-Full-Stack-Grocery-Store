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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Delivery Fleet</h1>
          <p className="text-gray-500 text-sm">Manage your delivery agents and track their status.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchAgents(true)}
            disabled={refreshing}
            className="bg-white text-gray-700 px-4 py-2.5 rounded-full font-medium shadow-md hover:bg-gray-50 transition flex items-center gap-2 border border-gray-200 disabled:opacity-50"
          >
            <img
              src={assets.refresh_icon}
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              alt=""
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary text-white px-6 py-2.5 rounded-full font-medium shadow-md hover:bg-primary-dull transition flex items-center gap-2"
          >
            <img src={assets.add_icon} className="w-5 h-5 brightness-0 invert" alt="" />
            {showAddForm ? 'Cancel' : 'Add New Agent'}
          </button>
        </div>
      </div>

      {/* Stats & Search Row */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Stats */}
        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm min-w-[140px]">
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Agents</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{agents.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <img src={assets.search_icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" alt="" />
            <input
              type="text"
              placeholder="Search agents by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
        </div>
      </div>

      {/* Add Agent Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Register New Agent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                type="text"
                placeholder="e.g. John Doe"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                type="text"
                placeholder="e.g. 9876543210"
                value={newAgent.phone}
                onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                type="password"
                placeholder="Enter password"
                value={newAgent.password}
                onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              className="bg-primary text-white px-8 py-2.5 rounded-lg font-medium shadow-sm hover:bg-primary-dull transition"
              onClick={addAgent}
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* Agent Grid */}
      {filteredAgents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src={assets.agent_icon} className="w-8 h-8 opacity-40 grayscale" alt="" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">No agents found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new agent.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div key={agent._id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition duration-300 overflow-hidden relative">
              {/* Top Gradient */}
              <div className="h-16 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100"></div>

              <div className="px-6 pb-6 relative flex flex-col items-center text-center">
                {/* Avatar - Centered and Overlapping */}
                <div className="absolute -top-8 w-16 h-16 bg-white rounded-2xl p-1 shadow-md border border-gray-100">
                  <div className="w-full h-full bg-primary text-white rounded-xl flex items-center justify-center text-xl font-bold uppercase shadow-inner">
                    {agent.name.slice(0, 2)}
                  </div>
                </div>

                {/* Menu / Action */}
                <button
                  onClick={() => setConfirmModal({
                    isOpen: true,
                    agentId: agent._id,
                    agentName: agent.name
                  })}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition p-2 bg-white rounded-full shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 z-10"
                  title="Remove Agent"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <div className="mt-10 w-full">
                  <h3 className="text-lg font-bold text-gray-800 truncate px-2">{agent.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{agent.phone}</p>

                  <div className="flex justify-center mb-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${agent.status === 'Available'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${agent.status === 'Available' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${agent.status === 'Available' ? 'text-green-700' : 'text-gray-500'
                        }`}>
                        {agent.status === 'Available' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
                    >
                      <span>Call Agent</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, agentId: null, agentName: '' })}
        onConfirm={() => removeAgent(confirmModal.agentId)}
        title="Remove Agent"
        message={`Are you sure you want to remove ${confirmModal.agentName}? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SellerAgents;

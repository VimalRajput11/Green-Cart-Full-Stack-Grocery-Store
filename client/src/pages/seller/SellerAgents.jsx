import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const SellerAgents = () => {
  const { axios } = useAppContext();
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [newAgent, setNewAgent] = useState({ name: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get('/api/agents');
      if (data.success) {
        setAgents(data.agents);
        setFilteredAgents(data.agents);
      }
    } catch (err) {
      toast.error("Failed to fetch agents");
    }
  };

  const addAgent = async () => {
    if (!newAgent.name || !newAgent.phone) return toast.error("All fields required");
    try {
      const { data } = await axios.post('/api/agents/create', newAgent);
      if (data.success) {
        toast.success("Agent added");
        setNewAgent({ name: '', phone: '' });
        fetchAgents();
        setSearchTerm(''); // Clear search after adding new agent
      }
    } catch (err) {
      toast.error("Failed to add agent");
    }
  };

  const removeAgent = async (agentId) => {
    if (!window.confirm("Are you sure you want to remove this agent?")) return;

    try {
      const { data } = await axios.delete(`/api/agents/${agentId}`);
      if (data.success) {
        toast.success("Agent removed");
        fetchAgents();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to remove agent");
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Filter agents whenever searchTerm or agents change
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredAgents(
      agents.filter(agent =>
        agent.name.toLowerCase().includes(term) ||
        agent.phone.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, agents]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Delivery Agents</h1>

      <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
        {/* Add Agent Form */}
        <div className="flex gap-2 flex-wrap">
          <input
            className="border p-2"
            type="text"
            placeholder="Agent Name"
            value={newAgent.name}
            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
          />
          <input
            className="border p-2"
            type="text"
            placeholder="Phone"
            value={newAgent.phone}
            onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={addAgent}
          >
            Add Agent
          </button>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-64 max-w-full"
        />
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <tr key={agent._id}>
                <td className="border p-2">{agent.name}</td>
                <td className="border p-2">{agent.phone}</td>
                <td className="border p-2 text-green-700">{agent.status}</td>
                <td className="border p-2">
                  <button
                    onClick={() => removeAgent(agent._id)}
                    className="bg-red-600 text-white px-3 py-1 text-xs rounded"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center p-4 text-gray-500">
                No agents found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SellerAgents;

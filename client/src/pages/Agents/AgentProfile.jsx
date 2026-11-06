import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

const AgentProfile = () => {
  const { axios, setIsAgent } = useAppContext();
  const { agent } = useOutletContext();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await axios.post('/api/agents/change-password', pw);
      if (data.success) {
        toast.success(data.message);
        setPw({ oldPassword: '', newPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update password');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await axios.get('/api/agents/logout');
    } finally {
      setIsAgent(false);
      navigate('/agents');
    }
  };

  if (!agent) return null;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border border-gray-100 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-600 text-white text-xl font-bold flex items-center justify-center uppercase">
          {agent.name.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-lg truncate">{agent.name}</p>
          <p className="text-sm text-gray-500">{agent.phone}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-100">
        <div className="flex justify-between p-4 text-sm"><span className="text-gray-500">Vehicle</span><span className="font-semibold text-gray-800">{agent.vehicleType}</span></div>
        <div className="flex justify-between p-4 text-sm"><span className="text-gray-500">Vehicle number</span><span className="font-semibold text-gray-800">{agent.vehicleNumber || '—'}</span></div>
        <div className="flex justify-between p-4 text-sm"><span className="text-gray-500">Partner since</span><span className="font-semibold text-gray-800">{new Date(agent.createdAt).toLocaleDateString()}</span></div>
      </div>
      <p className="text-xs text-gray-400 px-1">To update vehicle details, contact your store manager.</p>

      <form onSubmit={changePassword} className="bg-white rounded-3xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-bold text-gray-900">Change password</h2>
        <input type="password" required placeholder="Current password" value={pw.oldPassword} onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-green-600" />
        <input type="password" required minLength={6} placeholder="New password (min 6 characters)" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-green-600" />
        <button disabled={busy} className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-60">Update password</button>
      </form>

      <button onClick={logout} className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm">Log out</button>
    </div>
  );
};

export default AgentProfile;

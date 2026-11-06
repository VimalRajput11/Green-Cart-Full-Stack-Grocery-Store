import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext.jsx';
import { assets } from '../../assets/assets';

const AgentLogin = () => {
  const { isAgent, setIsAgent, navigate, axios } = useAppContext();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await axios.post('/api/agents/login', { phone, password });
      if (data.success) {
        setIsAgent(true);
        toast.success(`Welcome, ${data.agent.name.split(' ')[0]}`);
        navigate('/agents');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isAgent) navigate('/agents');
  }, [isAgent]);

  if (isAgent) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-700 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white text-center">
        <div className="bg-white rounded-2xl px-4 py-2 mb-6"><img src={assets.logo} alt="GreenCart" className="h-8" /></div>
        <h1 className="text-3xl font-bold">Delivery Partner</h1>
        <p className="text-green-100 mt-2 text-sm">Log in to start your shift</p>
      </div>
      <form onSubmit={onSubmit} className="bg-white rounded-t-3xl px-6 pt-8 pb-10 space-y-4 w-full max-w-md mx-auto">
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-gray-600">Phone number</label>
          <input id="phone" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Registered phone number" className="mt-1 w-full border border-gray-200 rounded-xl p-3.5 outline-none focus:border-green-600" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-gray-600">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="mt-1 w-full border border-gray-200 rounded-xl p-3.5 outline-none focus:border-green-600" />
        </div>
        <button disabled={busy} className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold disabled:opacity-60">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-xs text-center text-gray-400">Don't have an account? Your store manager creates it for you.</p>
      </form>
    </div>
  );
};

export default AgentLogin;

import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

const LOCATION_INTERVAL_MS = 30000;

const tabs = [
  {
    to: '/agents', label: 'Tasks', end: true,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h2m8 0h2m-2 0H9m10 0h1a1 1 0 001-1v-3.65a1 1 0 00-.22-.62l-3.48-4.35A1 1 0 0016.52 6H13" />,
  },
  {
    to: '/agents/delivered', label: 'Earnings',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.6 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.4-2.6-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    to: '/agents/profile', label: 'Profile',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
];

const AgentLayout = () => {
  const { axios, setIsAgent } = useAppContext();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const lastPing = useRef(0);

  const online = agent && agent.status !== 'Inactive';

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/api/agents/is-auth');
        if (data.success) setAgent(data.agent);
        else { setIsAgent(false); navigate('/agents'); }
      } catch {
        setIsAgent(false);
        navigate('/agents');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Share live location while online so the store and customer can track deliveries
  useEffect(() => {
    if (!online || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (Date.now() - lastPing.current < LOCATION_INTERVAL_MS) return;
        lastPing.current = Date.now();
        axios.post('/api/agents/me/location', { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => { });
      },
      () => { },
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [online]);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const { data } = await axios.patch('/api/agents/my-status', { online: !online });
      if (data.success) {
        setAgent(data.agent);
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not change status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col shadow-sm relative">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src={assets.logo} alt="GreenCart" className="h-7" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded">Rider</span>
          </div>
          <button
            onClick={toggleOnline}
            disabled={toggling}
            className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-full text-xs font-bold transition ${online ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'} disabled:opacity-60`}
            aria-label={online ? 'Go offline' : 'Go online'}
          >
            {online ? 'ONLINE' : 'OFFLINE'}
            <span className={`w-6 h-6 rounded-full bg-white shadow flex items-center justify-center`}>
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-600' : 'bg-gray-400'}`} />
            </span>
          </button>
        </header>

        <main className="flex-1 px-4 pt-4 pb-24">
          <Outlet context={{ agent, setAgent }} />
        </main>

        {/* Bottom tabs */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-30 grid grid-cols-3">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-green-700' : 'text-gray-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{t.icon}</svg>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AgentLayout;

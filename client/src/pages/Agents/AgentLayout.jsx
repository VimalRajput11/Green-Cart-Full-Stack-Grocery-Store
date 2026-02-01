import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const AgentLayout = () => {
  const { axios, setIsAgent } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarLinks = [
    {
      name: "Active Jobs",
      path: "/agents",
      icon: assets.delivery_truck_icon, // Better icon relevance
    },
    {
      name: "History",
      path: "/agents/delivered",
      icon: assets.order_icon,
    },
  ];

  const logout = async () => {
    try {
      const { data } = await axios.get('/api/agents/logout', { withCredentials: true });
      if (data.success) {
        toast.success(data.message);
        setIsAgent(false);
        navigate('/agents');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Logout failed');
    }
  };

  const toggleStatus = async () => {
    try {
      const newStatus = agent?.status === 'Available' ? 'Inactive' : 'Available';
      const { data } = await axios.patch(`/api/agents/status/${agent._id}`, { status: newStatus });

      if (data.success) {
        setAgent({ ...agent, status: newStatus });
        toast.success(`Status changed to ${newStatus === 'Available' ? 'Online' : 'Offline'}`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.get('/api/agents/is-auth', { withCredentials: true });

        if (data.success) {
          setAgent(data.agent);
          setIsAgent(true);
        } else {
          setIsAgent(false);
          navigate('/agents');
        }
      } catch (error) {
        setIsAgent(false);
        navigate('/agents');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [axios, navigate, setIsAgent]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-outfit">

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs uppercase">
            {agent?.name ? agent.name.slice(0, 2) : 'AG'}
          </div>
          <span className="font-semibold text-gray-800">{agent?.name}</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </header>

      {/* Sidebar / Drawer */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-30 transition-transform duration-300 transform 
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-2xl md:shadow-none`}>

        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <Link to="/">
            <img src={assets.logo} alt="logo" className="w-28" />
          </Link>
        </div>

        <div className="p-4 flex-1">
          <div className="mb-6 flex items-center gap-3 bg-primary/5 p-3 rounded-xl border border-primary/20">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              {agent?.name ? agent.name[0] : 'A'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{agent?.name}</p>
              <button
                onClick={toggleStatus}
                className="text-xs font-medium flex items-center gap-1 hover:opacity-80 transition"
              >
                <span className={`w-2 h-2 rounded-full ${agent?.status === 'Available' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className={agent?.status === 'Available' ? 'text-green-600' : 'text-gray-500'}>
                  {agent?.status === 'Available' ? 'Online' : 'Offline'}
                </span>
              </button>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {sidebarLinks.map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                end={item.path === '/agents'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                  }`
                }
              >
                <img src={item.icon} alt={item.name} className={`w-5 h-5 ${location.pathname === item.path ? 'brightness-0 invert' : ''}`} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 transition font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm"
        ></div>
      )}


      <main className="flex-1 p-4 md:p-8 overflow-auto h-[calc(100vh-60px)] md:h-screen">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AgentLayout;

import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AgentLayout = () => {
  const { axios, setIsAgent } = useAppContext();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ prevent render until auth is checked

  const sidebarLinks = [
     {
          name: "Active Orders",
          path: "/agents",
          icon: assets.agent_icon,
        },
    
    {
      name: "Delivered Orders",
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

  if (loading) return null; // ✅ wait until auth check completes

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white">
        <Link to="/">
          <img src={assets.logo} alt="logo" className="cursor-pointer w-28 md:w-36" />
        </Link>
        <div className="flex items-center gap-5 text-gray-500">
          <p>Hi! {agent?.name || "Agent"}</p>
          <button
            onClick={logout}
            className="border rounded-full text-sm px-4 py-1 cursor-pointer hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="md:w-64 w-16 border-r h-[95vh] text-base border-gray-300 pt-4 flex flex-col">
          {sidebarLinks.map((item) => (
            <NavLink
              to={item.path}
              key={item.path}
              end={item.path === '/agents'}
              className={({ isActive }) =>
                `flex items-center py-3 px-4 gap-3 transition-colors duration-200 ${
                  isActive
                    ? "border-r-4 md:border-r-[6px] bg-primary/10 border-primary text-primary"
                    : "hover:bg-gray-100/90 border-white text-gray-700"
                }`
              }
            >
              <img src={item.icon} alt={item.name} className="w-6 h-6" />
              <span className="hidden md:block">{item.name}</span>
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default AgentLayout;

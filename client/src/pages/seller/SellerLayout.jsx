import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const SellerLayout = () => {
  const { navigate, axios } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const sidebarLinks = [
    {
      name: "Dashboard",
      path: "/seller",
      icon: assets.product_list_icon, // ideally use a dashboard icon
    },
    {
      name: "Add Product",
      path: "/seller/add-product",
      icon: assets.add_icon,
    },
    {
      name: "Product List",
      path: "/seller/product-list",
      icon: assets.product_list_icon,
    },
    {
      name: "Orders",
      path: "/seller/orders",
      icon: assets.order_icon,
    },
    {
      name: "Agents",
      path: "/seller/agents",
      icon: assets.agent_icon,
    },
  ];

  const logout = async () => {
    try {
      const { data } = await axios.get('/api/seller/logout');
      if (data.success) {
        toast.success(data.message);
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col md:flex-row font-outfit">

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-8 py-6 bg-white border-b border-gray-50 z-[60]">
        <Link to="/" className="flex items-center gap-2">
          <img className="h-8" src={assets.logo} alt="logo" />
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-900 transition active:scale-95 shadow-sm border border-gray-100">
          {sidebarOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
          )}
        </button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-80 bg-white border-r border-gray-100 flex flex-col z-[100] transition-all duration-500 transform 
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-2xl md:shadow-none`}>

        <div className="p-10 mb-4">
          <Link to="/" className="flex flex-col gap-1 group">
            <img className="h-10 w-fit" src={assets.logo} alt="logo" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-[0.3em] ml-0.5">Seller Central</span>
          </Link>
        </div>

        <div className="px-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="mb-10 px-4">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.25em] mb-6">Main Interface</p>
            <nav className="flex flex-col gap-3">
              {sidebarLinks.map((item) => (
                <NavLink
                  to={item.path}
                  key={item.path}
                  end={item.path === '/seller'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive
                      ? "bg-green-600 text-white shadow-xl shadow-green-500/20"
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50 hover:translate-x-1"
                    }`
                  }
                >
                  <div className="flex items-center gap-4">
                    <img src={item.icon} alt={item.name} className={`w-5 h-5 transition-all ${location.pathname === item.path ? 'brightness-0 invert scale-110' : 'opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0'}`} />
                    <span className="text-sm font-bold tracking-tight">{item.name}</span>
                  </div>
                  {location.pathname === item.path && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="px-4">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.25em] mb-6">Store Systems</p>
            <Link to="/seller/add-category" onClick={() => setSidebarOpen(false)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${location.pathname === '/seller/add-category' ? 'bg-green-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50 hover:translate-x-1'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`${location.pathname === '/seller/add-category' ? 'text-white' : 'opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0'}`}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              <span className="text-sm font-bold tracking-tight">Category Matrix</span>
            </Link>
          </div>
        </div>

        <div className="p-10">
          <div className="bg-gray-50 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Premium Hub</span>
            </div>
            <p className="text-[11px] font-bold text-gray-400 leading-relaxed">System status optimal. Database sync complete.</p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 bg-red-50 text-red-600 py-4.5 py-5 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300 font-bold text-xs uppercase tracking-[0.2em] shadow-sm hover:shadow-red-500/20 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-gray-900/40 z-[90] md:hidden backdrop-blur-md animate-in fade-in duration-300"
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:h-screen overflow-y-auto no-scrollbar">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;

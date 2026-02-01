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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-outfit">

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white shadow-sm z-20">
        <Link to="/">
          <img src={assets.logo} alt="logo" className="w-24" />
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition focus:outline-none">
          {sidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          )}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-30 transition-transform duration-300 transform 
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} shadow-xl md:shadow-none`}>

        <div className="p-6 border-b border-gray-100 flex items-center justify-between md:justify-center">
          <Link to="/">
            <img src={assets.logo} alt="logo" className="w-32" />
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">Menu</p>
          <nav className="flex flex-col gap-2">
            {sidebarLinks.map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                end={item.path === '/seller'}
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
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 transition font-medium text-sm"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:p-8 p-4 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className='max-w-7xl mx-auto'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerLayout;

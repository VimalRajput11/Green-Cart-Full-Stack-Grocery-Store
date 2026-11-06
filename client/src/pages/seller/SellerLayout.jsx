import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link, NavLink, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

const I = ({ d }) => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
);

const NAV = [
  { section: 'Store', items: [
    { name: 'Overview', path: '/seller', end: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Orders', path: '/seller/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'Delivery fleet', path: '/seller/agents', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h2m8 0h2m-2 0H9m10 0h1a1 1 0 001-1v-3.65a1 1 0 00-.22-.62l-3.48-4.35A1 1 0 0016.52 6H13M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z' },
  ] },
  { section: 'Catalogue', items: [
    { name: 'Products', path: '/seller/product-list', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { name: 'Add product', path: '/seller/add-product', icon: 'M12 4v16m8-8H4' },
    { name: 'Categories', path: '/seller/add-category', icon: 'M4 6h16M4 12h16M4 18h7' },
  ] },
];

const SellerLayout = () => {
  const { navigate, axios, setIsSeller } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = async () => {
    try {
      const { data } = await axios.get('/api/seller/logout');
      if (data.success) {
        toast.success(data.message);
        setIsSeller?.(false);
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-[60] flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Link to="/seller" className="flex items-center gap-2">
          <img className="h-7" src={assets.logo} alt="GreenCart" />
          <span className="text-[10px] font-bold text-green-700 bg-green-50 rounded px-1.5 py-0.5 uppercase tracking-wider">Seller</span>
        </Link>
        <button onClick={() => setSidebarOpen((o) => !o)} aria-label="Menu" className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-800">
          <I d={sidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-[100] transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <Link to="/seller" onClick={() => setSidebarOpen(false)} className="block">
            <img className="h-8" src={assets.logo} alt="GreenCart" />
            <span className="block text-[10px] font-bold text-green-700 uppercase tracking-[0.25em] mt-1.5">Seller central</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-6">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{group.section}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition
                      ${isActive ? 'bg-green-50 text-green-800' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-green-700' : 'text-gray-400'}><I d={item.icon} /></span>
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link to="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <span className="text-gray-400"><I d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></span>
            View store
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50">
            <I d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-gray-900/40 z-[90] md:hidden" />}

      <main className="flex-1 min-w-0 md:h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Icon } from '../../components/Seller/ui';

const NAV = [
  { section: 'Store', items: [
    { name: 'Overview', path: '/seller', end: true, icon: 'home' },
    { name: 'Orders', path: '/seller/orders', icon: 'orders' },
    { name: 'Delivery fleet', path: '/seller/agents', icon: 'truck' },
  ] },
  { section: 'Catalogue', items: [
    { name: 'Products', path: '/seller/product-list', icon: 'box' },
    { name: 'Add product', path: '/seller/add-product', icon: 'plus' },
    { name: 'Categories', path: '/seller/add-category', icon: 'tag' },
  ] },
];

const SellerLayout = () => {
  const { navigate, axios, setIsSeller } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const current = NAV.flatMap((g) => g.items).find((i) => (i.end ? pathname === i.path : pathname.startsWith(i.path)));

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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-[60] flex items-center justify-between px-4 h-14 bg-white/90 backdrop-blur border-b border-slate-200/80">
        <Link to="/seller" className="flex items-center gap-2">
          <img className="h-7" src={assets.logo} alt="GreenCart" />
          <span className="text-[10px] font-semibold text-green-700 bg-green-50 ring-1 ring-inset ring-green-600/15 rounded-md px-1.5 py-0.5">Seller</span>
        </Link>
        <div className="flex items-center gap-2">
          {current && <span className="text-sm font-medium text-slate-500">{current.name}</span>}
          <button onClick={() => setSidebarOpen((o) => !o)} aria-label="Menu" className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 bg-white">
            <Icon name={sidebarOpen ? 'close' : 'menu'} className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[264px] bg-white border-r border-slate-200/80 flex flex-col z-[100] transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-5 h-[72px] flex items-center border-b border-slate-100">
          <Link to="/seller" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5">
            <img className="h-8" src={assets.logo} alt="GreenCart" />
            <span className="text-[10px] font-semibold text-green-700 bg-green-50 ring-1 ring-inset ring-green-600/15 rounded-md px-1.5 py-0.5 mt-1">Seller</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-5 space-y-7">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `group relative flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition-colors
                      ${isActive ? 'bg-green-50 text-green-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-green-600" />}
                        <span className={`transition-colors ${isActive ? 'text-green-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                          <Icon name={item.icon} className="w-[19px] h-[19px]" />
                        </span>
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-0.5">
          <Link to="/" target="_blank" className="group flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            <span className="text-slate-400 group-hover:text-slate-600"><Icon name="external" className="w-[19px] h-[19px]" /></span>
            View storefront
          </Link>
          <button onClick={logout} className="group w-full flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700">
            <span className="text-slate-400 group-hover:text-red-600"><Icon name="logout" className="w-[19px] h-[19px]" /></span>
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[90] md:hidden" />}

      <main className="flex-1 min-w-0 md:h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;

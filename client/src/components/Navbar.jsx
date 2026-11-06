import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { DELIVERY_ETA } from '../utils/orderStatus'

const SEARCH_HINTS = ['milk', 'bread', 'eggs', 'fruits', 'atta', 'chips', 'paneer'];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hint, setHint] = useState(0);
  const location = useLocation();
  const {
    user, setUser, setShowUserLogin, navigate, setSearchQuery, searchQuery,
    getCartCount, getCartAmount, currency, axios,
  } = useAppContext();
  const menuRef = useRef(null);

  const cartCount = getCartCount();

  const logout = async () => {
    try {
      const { data } = await axios.get('/api/user/logout');
      if (data.success) {
        toast.success(data.message);
        setUser(null);
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message);
    }
    setMenuOpen(false);
  };

  const goContact = () => {
    setMenuOpen(false);
    const scroll = () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    if (location.pathname !== '/') { navigate('/'); setTimeout(scroll, 150); } else scroll();
  };

  useEffect(() => {
    if (searchQuery.length > 0 && location.pathname !== '/products') navigate('/products');
  }, [searchQuery]);

  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % SEARCH_HINTS.length), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const searchBox = (
    <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 focus-within:border-green-600 focus-within:bg-white rounded-xl px-4 py-2.5 w-full transition">
      <img src={assets.search_icon} alt="" className="w-4 h-4 opacity-60" />
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent outline-none text-sm placeholder-gray-400"
        type="search"
        placeholder={`Search "${SEARCH_HINTS[hint]}"`}
        aria-label="Search products"
      />
      {searchQuery && (
        <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 text-lg leading-none" aria-label="Clear search">×</button>
      )}
    </label>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="px-4 md:px-16 lg:px-24 xl:px-32 py-3 flex items-center gap-4 md:gap-8">
        <NavLink to="/" className="shrink-0" aria-label="GreenCart home">
          <img className="h-8 md:h-9" src={assets.logo} alt="GreenCart" />
        </NavLink>

        <div className="hidden sm:block shrink-0 border-l border-gray-200 pl-4 md:pl-8">
          <p className="text-sm font-extrabold text-gray-900 leading-tight">Delivery in {DELIVERY_ETA}</p>
          <p className="text-xs text-gray-500 truncate max-w-[180px]">{user ? `Hi, ${user.name.split(' ')[0]}` : 'Fresh groceries at your door'}</p>
        </div>

        <div className="hidden md:block flex-1">{searchBox}</div>

        <div className="ml-auto flex items-center gap-3 md:gap-5">
          {!user ? (
            <button onClick={() => setShowUserLogin(true)} className="text-sm font-semibold text-gray-800 hover:text-green-700">
              Login
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-1 text-sm font-semibold text-gray-800" aria-expanded={menuOpen}>
                Account
                <svg className={`w-4 h-4 transition ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 text-sm z-50">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button onClick={() => { setMenuOpen(false); navigate('/my-orders'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">My orders</button>
                  <button onClick={() => { setMenuOpen(false); navigate('/add-address'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Add address</button>
                  <button onClick={() => { setMenuOpen(false); navigate('/recipe-ai'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Recipe AI</button>
                  <button onClick={goContact} className="w-full text-left px-4 py-2 hover:bg-gray-50">Help & contact</button>
                  <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600">Log out</button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white rounded-xl px-3 md:px-4 py-2.5 transition"
            aria-label={`Cart, ${cartCount} items`}
          >
            <img src={assets.nav_cart_icon} alt="" className="w-5 brightness-0 invert" />
            {cartCount > 0 ? (
              <span className="text-left leading-tight">
                <span className="block text-[11px] font-semibold">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                <span className="block text-xs font-bold">{currency}{getCartAmount()}</span>
              </span>
            ) : (
              <span className="hidden sm:inline text-sm font-bold">My Cart</span>
            )}
          </button>
        </div>
      </div>

      <div className="md:hidden px-4 pb-3">{searchBox}</div>
    </header>
  )
}

export default Navbar;

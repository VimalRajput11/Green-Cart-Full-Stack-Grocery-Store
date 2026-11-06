import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

// Floating "View cart" bar shown while shopping
const CartBar = () => {
  const { getCartCount, getCartAmount, currency, navigate } = useAppContext();
  const { pathname } = useLocation();
  const count = getCartCount();

  if (count === 0 || ['/cart', '/add-address', '/my-orders'].includes(pathname)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-24 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[420px] z-40">
      <button
        onClick={() => { navigate('/cart'); scrollTo(0, 0); }}
        className="w-full flex items-center justify-between gap-3 bg-green-700 hover:bg-green-800 text-white rounded-2xl px-4 py-3 shadow-xl shadow-green-900/20 transition"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <img src={assets.nav_cart_icon} alt="" className="w-5 brightness-0 invert" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-xs font-medium">{count} item{count > 1 ? 's' : ''}</span>
            <span className="block text-sm font-bold">{currency}{getCartAmount()}</span>
          </span>
        </span>
        <span className="flex items-center gap-1 text-sm font-bold">
          View cart
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </span>
      </button>
    </div>
  );
};

export default CartBar;

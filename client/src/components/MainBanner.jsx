import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'
import { DELIVERY_ETA } from '../utils/orderStatus'

const PROMOS = [
  { title: 'Fresh fruits & veggies', sub: 'Farm fresh, every morning', to: '/products/fruits & vegetables', img: assets.fresh_fruits_image, bg: 'bg-emerald-50' },
  { title: 'Dairy, bread & eggs', sub: 'Your daily breakfast run', to: '/products/dairy, bread & eggs', img: assets.dairy_product_image, bg: 'bg-amber-50' },
  { title: 'Snacks & drinks', sub: 'Party-ready in minutes', to: '/products/snacks & munchies', img: assets.bottles_image, bg: 'bg-sky-50' },
];

const MainBanner = () => {
  return (
    <section className="mt-4 space-y-4">
      <div className="relative overflow-hidden rounded-3xl">
        <img src={assets.main_banner_bg} alt="" className="w-full hidden md:block object-cover h-[260px] lg:h-[300px]" />
        <img src={assets.main_banner_bg_sm} alt="" className="w-full md:hidden object-cover h-[190px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/85 via-green-900/55 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-12 text-white max-w-[70%] md:max-w-xl">
          <span className="self-start bg-yellow-300 text-gray-900 text-[10px] md:text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide">
            Delivery in {DELIVERY_ETA}
          </span>
          <h1 className="text-2xl md:text-5xl font-extrabold leading-tight mt-2 md:mt-3">Groceries delivered before you know it</h1>
          <p className="hidden sm:block text-white/85 text-sm md:text-base mt-2">Fresh produce, daily essentials and snacks at the best prices.</p>
          <Link to="/products" className="self-start mt-4 md:mt-5 bg-white text-green-800 font-bold text-sm px-5 md:px-6 py-2 md:py-2.5 rounded-xl hover:bg-green-50 transition">
            Shop now
          </Link>
        </div>
      </div>

      <div className="flex sm:grid sm:grid-cols-3 gap-3 md:gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {PROMOS.map((p) => (
          <Link key={p.title} to={p.to} className={`${p.bg} shrink-0 w-[78%] sm:w-auto rounded-2xl p-4 md:p-5 flex items-center justify-between gap-3 hover:shadow-md transition group`}>
            <div>
              <p className="font-bold text-gray-900 leading-tight">{p.title}</p>
              <p className="text-xs text-gray-500 mt-1">{p.sub}</p>
              <span className="inline-block mt-3 text-xs font-bold bg-gray-900 text-white px-3 py-1.5 rounded-lg">Order now</span>
            </div>
            <img src={p.img} alt="" className="w-20 h-20 md:w-24 md:h-24 object-contain group-hover:scale-105 transition" />
          </Link>
        ))}
      </div>
    </section>
  )
}

export default MainBanner

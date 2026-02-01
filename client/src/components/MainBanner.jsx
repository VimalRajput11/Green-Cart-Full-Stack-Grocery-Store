import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const MainBanner = () => {
  return (
    <div className='relative z-0 overflow-hidden rounded-2xl md:rounded-3xl shadow-lg mt-4'>
      {/* Background Image with optional slight zoom on hover if we wanted JS control, but static is fine for now */}
      <img src={assets.main_banner_bg} alt='banner' className='w-full hidden md:block object-cover h-[400px] lg:h-[500px]' />
      <img src={assets.main_banner_bg_sm} alt='banner' className='w-full md:hidden object-cover h-[400px]' />

      {/* Overlay Gradient for Text Readability */}
      <div className='absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent md:from-black/30'></div>

      <div className='absolute inset-0 flex flex-col items-center md:items-start justify-center px-6 md:pl-16 lg:pl-24 space-y-4 md:space-y-6'>

        <div className='animate-in slide-in-from-bottom-5 fade-in duration-700'>
          <span className='bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm mb-2 inline-block'>
            Eco-Friendly Choice
          </span>
          <h1 className='text-4xl md:text-5xl lg:text-7xl font-extrabold text-white text-center md:text-left leading-tight drop-shadow-md'>
            Freshness You <br className='hidden md:block' /> Can Trust
          </h1>
          <p className='text-white/90 text-center md:text-left text-sm md:text-lg mt-2 max-w-md font-medium drop-shadow-sm'>
            From farm to table, experience the quality of hand-picked organic produce.
          </p>
        </div>

        <div className='flex items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-100'>
          <Link to={'/products'} className='group flex items-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0'>
            Shop Now
            <svg className='w-4 h-4 transition-transform group-hover:translate-x-1' fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>

          <Link to={'/products'} className='group hidden md:flex items-center gap-2 px-8 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold rounded-full hover:bg-white/20 transition-all'>
            Explore Deals
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MainBanner
import React from 'react'
import MainBanner from '../components/MainBanner'
import Categories from '../components/Categories'
import BestSeller from '../components/BestSeller'
import BottomBanner from '../components/BottomBanner'
import Contact from '../components/Contact'
import NewsLetter from '../components/NewsLetter'

const Home = () => {
  return (
    <div className='flex flex-col gap-2'>
      <MainBanner />
      <Categories />
      <BestSeller />
      <BottomBanner />
      <Contact />
      <NewsLetter />
    </div>
  )
}

export default Home
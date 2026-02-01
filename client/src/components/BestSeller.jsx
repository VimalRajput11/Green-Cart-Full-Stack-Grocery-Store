import React from 'react'
import ProductCard from './ProductCard'
import { useAppContext } from '../context/AppContext'

const BestSeller = () => {
  const { products } = useAppContext();
  return (
    <div className='mt-24 mb-12'>
      <div className='flex flex-col md:flex-row justify-between items-center mb-8 gap-4'>
        <div className='text-center md:text-left'>
          <p className='text-3xl md:text-4xl font-bold text-gray-800'>Best Sellers</p>
          <p className='text-gray-500 mt-2'>Most loved products by our customers</p>
        </div>
        {/* Optional Filter or Tabs could go here */}
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-6'>
        {products.filter((product) => product.inStock).slice(0, 5).map((product, index) => (
          <div key={index} className="transform transition duration-500 hover:scale-[1.02]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default BestSeller
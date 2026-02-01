import React from 'react'
import { categories as fallbackCategories, assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Categories = () => {
  const { navigate, categories: dbCategories } = useAppContext();

  // Use database categories if available, otherwise fallback to static categories
  const categoriesToShow = dbCategories && dbCategories.length > 0 ? dbCategories : fallbackCategories;

  return (
    <div className='mt-20'>
      <div className='flex justify-between items-end mb-8'>
        <div>
          <p className='text-3xl md:text-4xl font-bold text-gray-800'>Shop by Category</p>
          <p className='text-gray-500 mt-2'>Explore our wide range of fresh products</p>
        </div>
        <button onClick={() => navigate('/products')} className='hidden md:block text-green-600 font-medium hover:text-green-700 hover:underline'>
          View All
        </button>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6'>
        {categoriesToShow.map((category, index) => {
          // Safety check for image URL - prevent invalid base64 URLs
          const imageUrl = category.image && category.image.trim() !== '' && !category.image.includes('data:;base64,=')
            ? category.image
            : assets.box_icon;

          return (
            <div key={index}
              className='group cursor-pointer p-6 rounded-2xl flex flex-col justify-center items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden'
              style={{ backgroundColor: category.bgColor ? category.bgColor + '40' : '#F5F5F5' }}
              onClick={() => {
                navigate(`/products/${(category.path || category.name).toLowerCase()}`);
                scrollTo(0, 0)
              }}
            >
              {/* Decorative Circle */}
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white opacity-20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>

              <div className="w-24 h-24 mb-4 relative z-10 drop-shadow-sm group-hover:drop-shadow-md transition-all">
                <img
                  className='w-full h-full object-contain group-hover:scale-110 transition-transform duration-300'
                  src={imageUrl}
                  alt={category.text || category.name}
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.src = assets.box_icon;
                  }}
                />
              </div>
              <p className='text-base font-semibold text-gray-800 group-hover:text-green-700 transition-colors z-10'>{category.text || category.name}</p>
            </div>
          );
        })}
      </div>

      <div className='mt-8 md:hidden text-center'>
        <button onClick={() => navigate('/products')} className='text-green-600 font-medium hover:text-green-700'>View All Categories &rarr;</button>
      </div>
    </div>
  )
}

export default Categories
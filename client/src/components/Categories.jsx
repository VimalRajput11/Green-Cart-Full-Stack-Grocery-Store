import React from 'react'
import { categories as fallbackCategories, assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Categories = () => {
  const { navigate, categories: dbCategories } = useAppContext();

  // Use database categories if available, otherwise fallback to static categories
  const categoriesToShow = dbCategories && dbCategories.length > 0 ? dbCategories : fallbackCategories;

  return (
    <div>
      <div className='mb-4 text-left'>
        <h2 className='text-xl md:text-2xl font-bold text-gray-900 tracking-tight'>Shop by category</h2>
        
      </div>

      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3'>
        {categoriesToShow.map((category, index) => {
          const imageUrl = category.image && category.image.trim() !== '' && !category.image.includes('data:;base64,=')
            ? category.image
            : assets.box_icon;

          return (
            <div key={index}
              className='group cursor-pointer bg-[#EEF7F1] p-2 rounded-2xl flex flex-col items-center transition-all duration-300 hover:shadow-md hover:-translate-y-1'
              onClick={() => {
                navigate(`/products/${(category.path || category.name).toLowerCase()}`);
                scrollTo(0, 0)
              }}
            >
              <div className="w-full aspect-square mb-2 flex items-center justify-center p-0.5 overflow-hidden">
                <img
                  className='w-full h-full object-contain group-hover:scale-115 transition-transform duration-500'
                  src={imageUrl}
                  alt={category.text || category.name}
                  onError={(e) => {
                    e.target.src = assets.box_icon;
                  }}
                />
              </div>
              {/* Category Name */}
              <p className='text-[11px] md:text-xs font-bold text-gray-800 text-center leading-tight px-1 pb-1'>{category.text || category.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default Categories
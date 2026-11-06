import React from 'react'
import { categories as fallbackCategories, assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import { optimizeImg } from '../utils/image';

const Categories = () => {
  const { navigate, categories: dbCategories } = useAppContext();

  // Use database categories if available, otherwise fallback to static categories
  const categoriesToShow = dbCategories && dbCategories.length > 0 ? dbCategories : fallbackCategories;

  return (
    <div>
      <div className='mb-4 text-left'>
        <h2 className='text-lg md:text-2xl font-bold text-gray-900 tracking-tight'>Shop by category</h2>
      </div>

      <div className='grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-x-3 gap-y-5'>
        {categoriesToShow.map((category, index) => {
          const imageUrl = category.image && category.image.trim() !== '' && !category.image.includes('data:;base64,=')
            ? category.image
            : assets.box_icon;
          const label = category.text || category.name;

          return (
            <button key={index}
              className='group flex flex-col items-center gap-2 text-center'
              onClick={() => {
                navigate(`/products/${(category.path || category.name).toLowerCase()}`);
                scrollTo(0, 0)
              }}
            >
              <span className="w-full aspect-square rounded-2xl bg-[#EEF7F1] group-hover:bg-[#E2F1E7] flex items-center justify-center p-2 overflow-hidden transition-colors">
                <img
                  className='w-full h-full object-contain group-hover:scale-110 transition-transform duration-300'
                  src={optimizeImg(imageUrl, 200)}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = assets.box_icon;
                  }}
                />
              </span>
              <span className='text-[11px] md:text-xs font-semibold text-gray-800 leading-tight capitalize line-clamp-2'>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  )
}

export default Categories
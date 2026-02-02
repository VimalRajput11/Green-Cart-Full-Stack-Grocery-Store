import React from 'react'
import { useAppContext } from '../context/AppContext'
import { useParams, useNavigate } from 'react-router-dom';
import { categories as staticCategories } from '../assets/assets';
import ProductCard from '../components/ProductCard';

const ProductCategory = () => {
    const { products, categories: dbCategories } = useAppContext();
    const { category } = useParams();
    const navigate = useNavigate();

    // Use dynamic categories if available, otherwise fallback to static ones
    const allCategories = dbCategories && dbCategories.length > 0 ? dbCategories : staticCategories;

    // Support both 'path' (from static) and 'name' (from DB)
    const categoryInfo = allCategories.find((item) => (item.path || item.name).toLowerCase() === category);
    const filteredProducts = products.filter((product) => product.category.toLowerCase() === category);

    return (
        <div className='mt-16'>
            <div className='flex items-center gap-4 mb-6'>
                <button
                    onClick={() => navigate(-1)}
                    className='w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all cursor-pointer'
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </button>
                {categoryInfo && (
                    <div className='flex flex-col items-start'>
                        <p className='text-3xl font-bold text-gray-800 tracking-tight'>{(categoryInfo.text || categoryInfo.name).toUpperCase()}</p>
                        <div className='w-full h-1 bg-green-500 rounded-full mt-1 opacity-40'></div>
                    </div>
                )}
            </div>
            {filteredProducts.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6'>
                    {filteredProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            ) : (
                <div className='flex items-center justify-center h-[60vh]'>
                    <p className='text-2xl fond-medium text-primary'>No products found in this category.</p>
                </div>
            )}
        </div>
    )
}

export default ProductCategory
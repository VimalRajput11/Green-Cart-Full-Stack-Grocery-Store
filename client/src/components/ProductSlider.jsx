import React, { useRef } from 'react';
import ProductCard from './ProductCard';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

const ProductSlider = ({ title, categoryName, products }) => {
    const { navigate } = useAppContext();
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        const { current } = scrollRef;
        if (direction === 'left') {
            current.scrollBy({ left: -300, behavior: 'smooth' });
        } else {
            current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <div className="my-1">
            <div className="flex justify-between items-center mb-1 px-1">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
                <button
                    onClick={() => {
                        navigate(`/products/${categoryName.toLowerCase()}`);
                        window.scrollTo(0, 0);
                    }}
                    className="text-green-600 font-semibold hover:text-green-700 transition lowercase"
                >
                    see all
                </button>
            </div>

            <div className="relative group px-1">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-[-45px] top-[140px] -translate-y-1/2 z-20 bg-white shadow-md rounded-full w-9 h-9 flex items-center justify-center border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-gray-50 text-gray-800"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-[-45px] top-[140px] -translate-y-1/2 z-20 bg-white shadow-md rounded-full w-9 h-9 flex items-center justify-center border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-gray-50 text-gray-800"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-3 pb-2 no-scrollbar scroll-smooth w-full max-w-full"
                >
                    {products.filter(p => p.stock > 0 || (p.stock === undefined && p.inStock)).map((product) => (
                        <div key={product._id} className="min-w-[180px] md:min-w-[200px] flex-shrink-0">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};



export default ProductSlider;

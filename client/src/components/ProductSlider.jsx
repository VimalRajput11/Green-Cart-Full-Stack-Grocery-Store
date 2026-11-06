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
        <section>
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
                <button
                    onClick={() => {
                        navigate(categoryName ? `/products/${categoryName.toLowerCase()}` : "/products");
                        window.scrollTo(0, 0);
                    }}
                    className="text-sm md:text-base text-green-700 font-semibold hover:text-green-800 transition"
                >
                    See all
                </button>
            </div>

            <div className="relative group">
                <button
                    onClick={() => scroll('left')}
                    aria-label="Scroll left"
                    className="absolute -left-4 top-[38%] -translate-y-1/2 z-20 bg-white shadow-lg rounded-full w-10 h-10 items-center justify-center border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-gray-50 text-gray-800"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>

                <button
                    onClick={() => scroll('right')}
                    aria-label="Scroll right"
                    className="absolute -right-4 top-[38%] -translate-y-1/2 z-20 bg-white shadow-lg rounded-full w-10 h-10 items-center justify-center border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-gray-50 text-gray-800"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-3 pb-2 no-scrollbar scroll-smooth w-full max-w-full [mask-image:linear-gradient(to_right,black_calc(100%-48px),transparent)]"
                >
                    {products.filter(p => p.stock > 0 || (p.stock === undefined && p.inStock)).map((product) => (
                        <div key={product._id} className="w-[150px] sm:w-[170px] md:w-[180px] shrink-0">
                            <ProductCard product={product} />
                        </div>
                    ))}
                    {/* spacer so the last card can scroll clear of the edge fade */}
                    <div className="w-8 shrink-0" aria-hidden="true" />
                </div>
            </div>
        </section>
    );
};



export default ProductSlider;

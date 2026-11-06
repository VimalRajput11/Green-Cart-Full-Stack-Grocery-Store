import React from 'react';
import { useAppContext } from '../context/AppContext';
import { DELIVERY_ETA } from '../utils/orderStatus';

const etaShort = DELIVERY_ETA.replace(/minutes?/i, 'MINS').toUpperCase();

const ProductCard = ({ product }) => {
    const { addToCart, removeFromCart, cartItems, navigate, currency } = useAppContext();
    if (!product) return null;

    const qty = cartItems[product._id] || 0;
    // A broken (negative) price is treated as unavailable rather than sold below zero
    const outOfStock = product.stock <= 0 || !(product.offerPrice >= 0);
    const discount = product.price > product.offerPrice
        ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
        : 0;

    const open = () => {
        navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
        scrollTo(0, 0);
    };

    return (
        <div className="group relative flex flex-col w-full h-full bg-white border border-gray-100 rounded-2xl p-3 hover:shadow-md transition-shadow">
            {discount > 0 && (
                <span className="absolute top-0 left-3 z-10 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-1 rounded-b-md leading-none">
                    {discount}%<br />OFF
                </span>
            )}

            <button onClick={open} className="block aspect-square w-full mb-2" aria-label={product.name}>
                <img
                    className={`w-full h-full object-contain group-hover:scale-105 transition ${outOfStock ? 'grayscale opacity-60' : ''}`}
                    src={product.image[0]}
                    alt=""
                    loading="lazy"
                />
            </button>

            <span className="inline-flex items-center gap-1 self-start bg-gray-100 text-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded mb-1.5">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 2" /></svg>
                {etaShort}
            </span>

            <button onClick={open} className="text-left text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.4em]">
                {product.name}
            </button>
            <p className="text-xs text-gray-500 mt-0.5 min-h-[1.25em]">
                {product.weight || ''}
                {!outOfStock && product.stock < 5 && <span className="text-orange-600 font-semibold"> · Only {product.stock} left</span>}
            </p>

            <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                <div className="leading-tight">
                    <p className="text-[13px] font-bold text-gray-900">{currency}{product.offerPrice}</p>
                    {discount > 0 && <p className="text-[11px] text-gray-400 line-through">{currency}{product.price}</p>}
                </div>

                {outOfStock ? (
                    <span className="text-[10px] font-bold text-gray-400 uppercase border border-gray-200 rounded-lg px-2 py-1.5">Sold out</span>
                ) : qty === 0 ? (
                    <button
                        onClick={() => addToCart(product._id)}
                        className="min-w-[66px] border border-green-600 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-extrabold uppercase rounded-lg px-3 py-1.5 transition"
                    >
                        Add
                    </button>
                ) : (
                    <div className="min-w-[66px] flex items-center justify-between bg-green-700 text-white rounded-lg select-none">
                        <button onClick={() => removeFromCart(product._id)} className="px-2 py-1 text-base font-bold" aria-label="Remove one">−</button>
                        <span className="text-xs font-bold">{qty}</span>
                        <button onClick={() => addToCart(product._id)} className="px-2 py-1 text-base font-bold" aria-label="Add one">+</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;

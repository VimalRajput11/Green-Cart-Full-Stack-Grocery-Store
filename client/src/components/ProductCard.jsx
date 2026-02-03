import React from 'react';
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';

const ProductCard = ({ product }) => {
    const { addToCart, removeFromCart, cartItems, navigate } = useAppContext();

    const discount = product.price > product.offerPrice
        ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
        : 0;

    return product && (
        <div
            onClick={() => {
                navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
                scrollTo(0, 0);
            }}
            className="border border-gray-100 rounded-2xl p-3 bg-white w-full max-w-[220px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[275px] relative">

            {/* Discount Badge over Image */}
            {discount > 0 && (
                <div className="absolute top-2 left-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10 shadow-sm">
                    {discount}% OFF
                </div>
            )}

            <div className="group cursor-pointer flex items-center justify-center h-[145px] mb-1">
                <img
                    className="group-hover:scale-105 transition max-h-full max-w-full object-contain"
                    src={product.image[0]}
                    alt={product.name}
                />
            </div>

            <div className="flex flex-col flex-1">
                <p className="text-gray-800 font-semibold text-[15px] line-clamp-2 leading-tight mb-0 h-9">{product.name}</p>
                <div className="flex items-center justify-between mt-1">
                    {product.weight && <p className="text-gray-500 text-[12px] mb-0 font-medium">{product.weight}</p>}
                    {product.stock <= 0 ? (
                        <span className="text-red-500 text-[10px] font-bold uppercase tracking-tighter bg-red-50 px-1.5 py-0.5 rounded">Out of Stock</span>
                    ) : product.stock < 5 ? (
                        <span className="text-orange-500 text-[10px] font-semibold tracking-tighter">Only {product.stock} left</span>
                    ) : null}
                </div>

                <div className="mt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-gray-800 font-bold text-[16px]">₹{product.offerPrice}</span>
                            {product.price > product.offerPrice && (
                                <span className="text-gray-400 text-[11px] line-through leading-none">₹{product.price}</span>
                            )}
                        </div>

                        <div onClick={(e) => { e.stopPropagation(); }} className="text-green-700">
                            {product.stock <= 0 ? (
                                <button
                                    disabled
                                    className="border border-gray-200 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-not-allowed"
                                >
                                    Stock Out
                                </button>
                            ) : !cartItems[product._id] ? (
                                <button
                                    className="border border-green-600/30 text-green-700 hover:bg-green-50 transition px-5 py-1.5 rounded-lg font-bold text-xs cursor-pointer uppercase tracking-wider"
                                    onClick={() => addToCart(product._id)}
                                >
                                    Add
                                </button>
                            ) : (
                                <div className="flex items-center justify-center bg-green-600 text-white rounded-lg select-none min-w-[75px]">
                                    <button
                                        onClick={() => removeFromCart(product._id)}
                                        className="cursor-pointer text-lg px-2 py-1"
                                    >
                                        -
                                    </button>
                                    <span className="w-4 text-center text-xs font-bold">{cartItems[product._id]}</span>
                                    <button
                                        onClick={() => addToCart(product._id)}
                                        className="cursor-pointer text-lg px-2 py-1"
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};







export default ProductCard;

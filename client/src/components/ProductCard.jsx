import React from 'react';
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';

const ProductCard = ({ product }) => {
    const { currency, addToCart, removeFromCart, cartItems, navigate } = useAppContext();

    return product && (
        <div
            onClick={() => {
                navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
                scrollTo(0, 0);
            }}
            className="border border-gray-300 rounded-md p-4 bg-white w-full max-w-[200px] shadow-sm flex flex-col justify-between h-[300px]">
            <div className="group cursor-pointer flex items-center justify-center px-2 h-[130px]">
                <img
                    className="group-hover:scale-105 transition max-h-full max-w-full object-contain"
                    src={product.image[0]}
                    alt={product.name}
                />
            </div>
            <div className="flex flex-col justify-between flex-1 mt-2 text-sm text-gray-500/70">
                <div>
                    <p>{product.category} {product.weight && `• ${product.weight}`}</p>
                    <p className="text-gray-700 font-medium text-base truncate w-full">{product.name}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                        {Array(5).fill('').map((_, i) => (
                            <img
                                key={i}
                                className="md:w-3.5 w-3"
                                src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                                alt=""
                            />
                        ))}
                        <p>(4)</p>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-3">
                    <p className="md:text-lg text-sm font-medium text-primary">
                        {currency}{product.offerPrice}{' '}
                        <span className="text-gray-500/60 md:text-sm text-xs line-through">
                            {currency}{product.price}
                        </span>
                    </p>
                    <div onClick={(e) => { e.stopPropagation(); }} className="text-primary">
                        {!cartItems[product._id] ? (
                            <button
                                className="flex items-center justify-center gap-1 border border-primary/40 bg-primary/10 md:w-[80px] w-[64px] h-[32px] rounded cursor-pointer"
                                onClick={() => addToCart(product._id)}
                            >
                                <img src={assets.cart_icon} alt="cart_icon" />
                                Add
                            </button>
                        ) : (
                            <div className="flex items-center justify-center gap-2 md:w-20 w-16 h-[32px] bg-primary/25 rounded select-none">
                                <button
                                    onClick={() => removeFromCart(product._id)}
                                    className="cursor-pointer text-md px-2 h-full"
                                >
                                    -
                                </button>
                                <span className="w-5 text-center">{cartItems[product._id]}</span>
                                <button
                                    onClick={() => addToCart(product._id)}
                                    className="cursor-pointer text-md px-2 h-full"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;

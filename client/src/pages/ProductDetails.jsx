import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Link, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCard from "../components/ProductCard";

const ProductDetails = () => {

    const { products, navigate, currency, addToCart } = useAppContext();
    const { id } = useParams();

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [thumbnail, setThumbnail] = useState(null);

    const product = products.find((item) => item._id === id);

    useEffect(() => {
        if (products.length > 0) {
            let productsCopy = products.slice();
            productsCopy = productsCopy.filter((item) => product.category === item.category && item._id !== product._id)
            setRelatedProducts(productsCopy.slice(0, 5));
        }
    }, [products, product]);

    useEffect(() => {
        setThumbnail(product?.image[0] ? product.image[0] : null)
    }, [product])

    return product && (
        <div className="mt-8 px-4 md:px-0">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-8 font-light">
                <Link to={'/'} className="hover:text-green-600 transition">Home</Link> <span className="mx-1">/</span>
                <Link to={'/products'} className="hover:text-green-600 transition">Products</Link> <span className="mx-1">/</span>
                <Link to={`/products/${product.category.toLowerCase()}`} className="hover:text-green-600 transition capitalize">{product.category}</Link> <span className="mx-1">/</span>
                <span className="text-green-700 font-medium capitalize">{product.name}</span>
            </nav>

            <div className="flex flex-col md:flex-row gap-12 lg:gap-16">

                {/* Image Gallery */}
                <div className="flex flex-col-reverse md:flex-row gap-4 md:w-1/2">
                    {/* Thumbnails */}
                    <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none w-full md:w-20 lg:w-24">
                        {product.image.map((image, index) => (
                            <div
                                key={index}
                                onClick={() => setThumbnail(image)}
                                className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 aspect-square w-20 md:w-full flex-shrink-0 ${thumbnail === image ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200 hover:border-green-300'}`}
                            >
                                <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain p-1" />
                            </div>
                        ))}
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-sm flex items-center justify-center p-6 lg:p-10 relative">
                        <div className="absolute top-4 right-4 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                            Best Quality
                        </div>
                        <img src={thumbnail} alt="Selected product" className="w-full h-auto max-h-[500px] object-contain transform hover:scale-105 transition-transform duration-500" />
                    </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 md:w-1/2 lg:pl-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-green-600 text-sm font-semibold tracking-wide uppercase px-2 py-1 bg-green-50 rounded-md inline-block">{product.category}</span>
                        {product.weight && <span className="text-gray-500 text-sm font-medium px-2 py-1 bg-gray-100 rounded-md inline-block">{product.weight}</span>}
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight mb-2 capitalize">{product.name}</h1>

                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex text-yellow-500">
                            {Array(5).fill('').map((_, i) => (
                                <svg key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                            ))}
                        </div>
                        <span className="text-gray-500 text-sm font-medium">(120 Reviews)</span>
                    </div>

                    <div className="border-t border-b border-gray-100 py-6 mb-6">
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-3xl md:text-4xl font-bold text-gray-900">{currency}{product.offerPrice}</span>
                            <span className="text-gray-400 text-lg line-through mb-1">{currency}{product.price}</span>
                            <span className="text-green-600 font-semibold mb-1 ml-2 px-2 py-0.5 bg-green-100 rounded text-sm">
                                {Math.round(((product.price - product.offerPrice) / product.price) * 100)}% OFF
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">Inclusive of all taxes</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">About this item</h3>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
                            {product.description.map((desc, index) => (
                                <li key={index} className="pl-1">{desc}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <button onClick={() => addToCart(product._id)} className="flex-1 py-4 px-8 rounded-full font-bold border-2 border-green-600 text-green-600 hover:bg-green-50 transition-colors uppercase tracking-wide flex items-center justify-center gap-2 group">
                            Add to Cart
                        </button>
                        <button onClick={() => { addToCart(product._id); navigate('/cart') }} className="flex-1 py-4 px-8 rounded-full font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-500/30 transition-all uppercase tracking-wide flex items-center justify-center gap-2">
                            Buy Now
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 flex gap-4 mt-8">
                        <div className="flex items-center gap-1">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Authentic
                        </div>
                        <div className="flex items-center gap-1">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Secure Payment
                        </div>
                        <div className="flex items-center gap-1">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Quality Assured
                        </div>
                    </div>

                </div>
            </div>

            {/* Related Products Section */}
            <div className="mt-24 border-t border-gray-100 pt-16">
                <div className="text-center mb-10">
                    <span className="text-green-600 font-semibold tracking-wider uppercase text-sm">Similar Items</span>
                    <h2 className="text-3xl font-bold text-gray-800 mt-2">Related Products</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {relatedProducts.filter((product) => product.inStock).length > 0 ? (
                        relatedProducts.filter((product) => product.inStock).map((product, index) => (
                            <div key={index} className="transform hover:scale-[1.02] transition-transform duration-300">
                                <ProductCard key={index} product={product} />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 col-span-full text-center py-8">No related products found at the moment.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
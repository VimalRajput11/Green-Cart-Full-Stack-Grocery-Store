import { useEffect, useState } from "react";
import { useAppContext } from '../context/AppContext';
import { assets } from "../assets/assets";
import toast from "react-hot-toast";

const Cart = () => {
    const {
        products, currency, cartItems, removeFromCart, getCartCount, updateCartItem,
        navigate, getCartAmount, axios, user, setCartItems
    } = useAppContext();

    const [cartArray, setCartArray] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [showAddress, setShowAddress] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentOption, setPaymentOption] = useState('COD');
    const [editAddressMode, setEditAddressMode] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        street: '', city: '', state: '', zipcode: '', country: ''
    });

    const getCart = () => {
        let tempArray = [];
        for (const key in cartItems) {
            const product = products.find((item) => item._id === key);
            if (product) {
                // Return a new object to avoid mutating the original products in context
                tempArray.push({ ...product, quantity: cartItems[key] });
            }
        }
        setCartArray(tempArray);
    };

    const getUserAddress = async () => {
        try {
            const { data } = await axios.get('/api/address/get');
            if (data.success) {
                setAddresses(data.addresses);
                if (data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0]);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const placeOrder = async () => {
        try {
            if (!selectedAddress) return toast.error("Please select an address");

            const orderData = {
                items: cartArray.map(item => ({
                    product: item._id,
                    quantity: item.quantity
                })),
                address: selectedAddress._id
            };

            if (paymentOption === "COD") {
                const { data } = await axios.post("/api/order/cod", orderData);
                if (data.success) {
                    toast.success(data.message);
                    setCartItems({});
                    navigate("/my-orders");
                } else toast.error(data.message);
            }

            if (paymentOption === "Online") {
                const { data } = await axios.post("/api/order/razorpay", orderData);
                if (!data.success) return toast.error("Failed to create Razorpay order");

                const { order: razorpayOrder, orderId } = data;

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: "Green Cart",
                    description: "Purchase from Green Cart",
                    image: "https://i.postimg.cc/PqKVQsSG/favicon.png",
                    order_id: razorpayOrder.id,
                    handler: async function (response) {
                        try {
                            const verifyRes = await axios.post("/api/order/verify", {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: orderId
                            });

                            if (verifyRes.data.success) {
                                toast.success("Payment successful!");
                                setCartItems({});
                                navigate("/my-orders");
                            } else toast.error("Payment verification failed.");
                        } catch (error) {
                            toast.error("Error during payment verification.");
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                        contact: "9999999999"
                    },
                    theme: {
                        color: "#4fbf86"
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            toast.error("Order failed: " + error.message);
        }
    };

    const saveAddressUpdate = async () => {
        try {
            const { data } = await axios.put(`/api/address/update/${selectedAddress._id}`, {
                address: editForm
            });

            if (data.success) {
                toast.success("Address updated successfully");
                setEditAddressMode(false);
                getUserAddress();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (products.length > 0 && cartItems) {
            getCart();
        }
    }, [products, cartItems]);

    useEffect(() => {
        if (user) {
            getUserAddress();
        }
    }, [user]);

    return products.length > 0 && cartItems ? (
        <div className="mt-10 mb-20 px-4 md:px-0 font-sans">

            {/* Page Title */}
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 font-serif">Your Shopping Cart</h1>
                <p className="text-gray-500 mt-2">You have {getCartCount()} items in your cart</p>
            </div>

            {cartArray.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                        <img src={assets.nav_cart_icon} alt="Empty Cart" className="w-12 h-12 opacity-40" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8 max-w-md text-center">Looks like you haven't added anything to your cart yet. Discover fresh produce today!</p>
                    <button onClick={() => navigate('/products')} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full shadow-lg transition-all transform hover:-translate-y-1">
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">

                    {/* Cart Items List */}
                    <div className="flex-1 w-full space-y-5">
                        {cartArray.map((product, index) => (
                            <div key={index} className="flex flex-row items-start gap-4 sm:gap-6 p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">

                                {/* Product Image */}
                                <div onClick={() => {
                                    navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
                                    scrollTo(0, 0);
                                }} className="cursor-pointer w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-50 rounded-xl p-2 border border-gray-200">
                                    <img className="w-full h-full object-contain" src={product.image[0]} alt={product.name} />
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 w-full text-left">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="pr-4">
                                            <h3 onClick={() => navigate(`/products/${product.category.toLowerCase()}/${product._id}`)} className="text-base sm:text-lg font-bold text-gray-800 cursor-pointer hover:text-green-600 transition mb-1 leading-tight">{product.name}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500">{product.category} • {product.weight || "N/A"}</p>
                                        </div>
                                        <p className="text-base sm:text-lg font-bold text-gray-900 flex-shrink-0">{currency}{product.offerPrice * product.quantity}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs text-gray-500 sm:hidden">{currency}{product.offerPrice} / unit</p>
                                            {/* Quantity Selector */}
                                            <div className="flex items-center border border-gray-300 rounded-lg px-2 py-1 bg-gray-50 h-8">
                                                <span className="text-xs text-gray-500 mr-2 font-medium">Qty:</span>
                                                <select
                                                    onChange={e => updateCartItem(product._id, Number(e.target.value))}
                                                    value={cartItems[product._id] || product.quantity}
                                                    className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                                                >
                                                    {Array(Math.max((cartItems[product._id] || product.quantity || 0) + 5, 10)).fill('').map((_, i) => (
                                                        <option key={i} value={i + 1}>{i + 1}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(product._id)}
                                            className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-start pt-2">
                            <button onClick={() => { navigate('/products'); scrollTo(0, 0); }} className="flex items-center gap-2 text-green-600 font-semibold hover:underline group">
                                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                Continue Shopping
                            </button>
                        </div>
                    </div>

                    {/* Order Summary & Checkout */}
                    <div className="lg:w-[380px] xl:w-[420px] w-full flex-shrink-0">
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 font-serif">Order Summary</h2>

                            {/* Address Card */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Delivery Address</h3>
                                    {selectedAddress && !editAddressMode && (
                                        <button onClick={() => setEditAddressMode(true)} className="text-xs font-semibold text-green-600 hover:underline">Edit</button>
                                    )}
                                </div>

                                {editAddressMode ? (
                                    <div className="space-y-3 mt-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="First Name" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-green-500 outline-none" />
                                            <input type="text" placeholder="Last Name" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-green-500 outline-none" />
                                        </div>
                                        <input type="text" placeholder="Street" value={editForm.street} onChange={e => setEditForm({ ...editForm, street: e.target.value })} className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-green-500 outline-none" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="City" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-green-500 outline-none" />
                                            <input type="text" placeholder="State" value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="w-full text-xs border rounded p-2 focus:ring-1 focus:ring-green-500 outline-none" />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-1">
                                            <button onClick={() => setEditAddressMode(false)} className="text-xs text-gray-500 px-3 py-1 hover:bg-gray-200 rounded">Cancel</button>
                                            <button onClick={saveAddressUpdate} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {selectedAddress ? (
                                                    <>{selectedAddress.street}, {selectedAddress.city}<br />{selectedAddress.state}, {selectedAddress.country} - {selectedAddress.zipcode}</>
                                                ) : (
                                                    <span className="text-amber-600 italic">No address selected</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                            <button onClick={() => setShowAddress(!showAddress)} className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                Change Address
                                            </button>
                                            <button onClick={() => navigate('/add-address')} className="text-xs font-medium text-gray-500 hover:text-black">+ Add New</button>
                                        </div>

                                        {showAddress && (
                                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-xl z-20 max-h-60 overflow-y-auto">
                                                {addresses.map((addr, idx) => (
                                                    <div key={idx} onClick={() => { setSelectedAddress(addr); setShowAddress(false); }} className={`p-3 text-sm cursor-pointer hover:bg-green-50 transition border-b border-gray-100 ${selectedAddress?._id === addr._id ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                                                        {addr.street}, {addr.city}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Payment Method</h3>
                                <div className="space-y-3">
                                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${paymentOption === 'COD' ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" name="payment" value="COD" checked={paymentOption === 'COD'} onChange={() => setPaymentOption('COD')} className="w-4 h-4 text-green-600 focus:ring-green-500" />
                                        <span className="text-sm font-medium text-gray-800">Cash On Delivery</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${paymentOption === 'Online' ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" name="payment" value="Online" checked={paymentOption === 'Online'} onChange={() => setPaymentOption('Online')} className="w-4 h-4 text-green-600 focus:ring-green-500" />
                                        <span className="text-sm font-medium text-gray-800">Online Payment (Razorpay)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="space-y-3 py-4 border-t border-gray-100">
                                <div className="flex justify-between text-gray-500 text-sm">
                                    <span>Subtotal</span>
                                    <span>{currency}{getCartAmount()}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 text-sm">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between text-gray-500 text-sm">
                                    <span>Tax (2%)</span>
                                    <span>{currency}{(getCartAmount() * 0.02).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <span className="text-lg font-bold text-gray-800">Total</span>
                                    <span className="text-2xl font-bold text-green-600">{currency}{(getCartAmount() * 1.02).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <button onClick={placeOrder} className="w-full py-4 mt-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                <span>{paymentOption === 'COD' ? 'Place Order' : 'Proceed to Pay'}</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </button>

                            <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                Secure Checkout
                            </p>

                        </div>
                    </div>
                </div>
            )}
        </div>
    ) : (
        <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold text-gray-700">Loading your cart...</h2>
        </div>
    );
};

export default Cart;

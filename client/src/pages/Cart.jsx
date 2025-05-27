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
            product.quantity = cartItems[key];
            tempArray.push(product);
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
        <div className="flex flex-col md:flex-row mt-16">
            <div className='flex-1 max-w-4xl'>
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart <span className="text-sm text-primary">{getCartCount()} Items</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                        <div className="flex items-center md:gap-6 gap-3">
                            <div onClick={() => {
                                navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
                                scrollTo(0, 0);
                            }} className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded">
                                <img className="max-w-full h-full object-cover" src={product.image[0]} alt={product.name} />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">{product.name}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Weight: <span>{product.weight || "N/A"}</span></p>
                                    <div className='flex items-center'>
                                        <p>Qty:</p>
                                        <select onChange={e => updateCartItem(product._id, Number(e.target.value))}
                                            value={cartItems[product._id]}
                                            className='outline-none'>
                                            {Array(cartItems[product._id] > 9 ? cartItems[product._id] : 9).fill('').map((_, index) => (
                                                <option key={index} value={index + 1}>{index + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">{currency}{product.offerPrice * product.quantity}</p>
                        <button onClick={() => removeFromCart(product._id)} className="cursor-pointer mx-auto">
                            <img src={assets.remove_icon} alt="remove" className="inline-block w-6 h-6" />
                        </button>
                    </div>
                ))}

                <button onClick={() => { navigate('/products'); scrollTo(0, 0); }}
                    className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium">
                    <img className="group-hover:-translate-x-1 transition" src={assets.arrow_right_icon_colored} alt="arrow" />
                    Continue Shopping
                </button>
            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
                <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase">Delivery Address</p>
                    <div className="relative flex justify-between items-start mt-2">
                        <p className="text-gray-500">
                            {selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}` : 'No address found'}
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAddress(!showAddress)} className="text-primary hover:underline cursor-pointer">Change</button>
                            {selectedAddress && (
                <button
                            onClick={() => {
                  setEditAddressMode(true);
                setEditForm({
                firstName: selectedAddress.firstName || '',
                lastName: selectedAddress.lastName || '',
                email: selectedAddress.email || '',
                phone: selectedAddress.phone || '',
                street: selectedAddress.street || '',
                city: selectedAddress.city || '',
                state: selectedAddress.state || '',
                zipcode: selectedAddress.zipcode || '',
                country: selectedAddress.country || ''
            });
        }}
        className="text-primary hover:underline cursor-pointer"
    >
         Edit
    </button>
)}

                        </div>
                        {showAddress && (
                            <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full z-10">
                                {addresses.map((address, index) => (
                                    <p key={index} onClick={() => { setSelectedAddress(address); setShowAddress(false); }}
                                        className="text-gray-500 p-2 hover:bg-gray-100 cursor-pointer">
                                        {address.street}, {address.city}, {address.state}, {address.country}
                                    </p>
                                ))}
                                <p onClick={() => navigate('/add-address')} className="text-primary text-center cursor-pointer p-2 hover:bg-primary/10">
                                    Add address
                                </p>
                            </div>
                        )}
                    </div>
{editAddressMode && (
    <div className="mt-4 space-y-2">
        <input type="text" placeholder="First Name" value={editForm.firstName}
            onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full border px-2 py-1" />

        <input type="text" placeholder="Last Name" value={editForm.lastName}
            onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full border px-2 py-1" />

        <input type="email" placeholder="Email" value={editForm.email}
            onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full border px-2 py-1" />

        <input type="tel" placeholder="Phone" value={editForm.phone}
            onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border px-2 py-1" />

        <input type="text" placeholder="Street" value={editForm.street}
            onChange={e => setEditForm({ ...editForm, street: e.target.value })} className="w-full border px-2 py-1" />

        <input type="text" placeholder="City" value={editForm.city}
            onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full border px-2 py-1" />

        <input type="text" placeholder="State" value={editForm.state}
            onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="w-full border px-2 py-1" />

        <input type="text" placeholder="Zip Code" value={editForm.zipcode}
            onChange={e => setEditForm({ ...editForm, zipcode: e.target.value })} className="w-full border px-2 py-1" />

        <input type="text" placeholder="Country" value={editForm.country}
            onChange={e => setEditForm({ ...editForm, country: e.target.value })} className="w-full border px-2 py-1" />

        <div className="flex gap-2 pt-2">
            <button onClick={saveAddressUpdate} className="bg-primary text-white px-4 py-2">Save</button>
            <button onClick={() => setEditAddressMode(false)} className="bg-gray-300 px-4 py-2">Cancel</button>
        </div>
    </div>
)}


                    <p className="text-sm font-medium uppercase mt-6">Payment Method</p>
                    <select onChange={e => setPaymentOption(e.target.value)} className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none">
                        <option value="COD">Cash On Delivery</option>
                        <option value="Online">Online Payment</option>
                    </select>
                </div>

                <hr className="border-gray-300" />
                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between"><span>Price</span><span>{currency}{getCartAmount()}</span></p>
                    <p className="flex justify-between"><span>Shipping Fee</span><span className="text-green-600">Free</span></p>
                    <p className="flex justify-between"><span>Tax (2%)</span><span>{currency}{getCartAmount() * 2 / 100}</span></p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Total Amount:</span><span>{currency}{getCartAmount() + getCartAmount() * 2 / 100}</span>
                    </p>
                </div>

                <button onClick={placeOrder} className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition">
                    {paymentOption === 'COD' ? 'Place Order' : 'Proceed to Checkout'}
                </button>
            </div>
        </div>
    ) : null;
};

export default Cart;

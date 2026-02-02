import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";
import axios from 'axios';
import CustomAlert from "../components/CustomAlert";

axios.defaults.withCredentials = true;
const backendUrl = import.meta.env.VITE_SERVER_URL;
console.log("Backend URL initialized at:", backendUrl);
axios.defaults.baseURL = backendUrl;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [isAgent, setIsAgent] = useState(false);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState([]);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'confirm' });

    const confirmAction = (title, message, onConfirm, type = 'confirm') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };

    //Fetch Seller Status
    const fetchSeller = async () => {
        try {
            const { data } = await axios.get('/api/seller/is-auth');
            if (data.success) {
                setIsSeller(true)
            } else {
                setIsSeller(false)
            }
        } catch (error) {
            setIsSeller(false)
        }
    }
    const fetchAgent = async () => {
        try {
            const { data } = await axios.get('/api/agents/is-auth');
            if (data.success) {
                setIsAgent(true);
            } else {
                setIsAgent(false);
            }
        } catch (error) {
            setIsAgent(false);
        }
    }

    //Fetch All Categories
    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/category/list');
            if (data.success) {
                setCategories(data.categories);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //Fetch User Auth Status, User Data and Cart Items
    const fetchUser = async () => {
        try {
            const { data } = await axios.get('api/user/is-auth');
            if (data.success) {
                setUser(data.user);
                setCartItems(data.user.cartItems)
            }
        } catch (error) {
            setUser(null);
        }
    }

    //Fetch All Products
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get('/api/product/list')
            if (data.success) {
                setProducts(data.products)
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //Add Product to Cart
    const addToCart = (itemId) => {
        if (!user) {
            setShowUserLogin(true);
            return;
        }

        const productInfo = products.find(p => p._id === itemId);
        let cartData = structuredClone(cartItems);
        const currentQty = cartData[itemId] || 0;

        if (productInfo && (currentQty + 1) > productInfo.stock) {
            toast.error(`Only ${productInfo.stock} items left in stock`);
            return;
        }

        if (cartData[itemId]) {
            cartData[itemId] += 1;
        }
        else {
            cartData[itemId] = 1;
        }
        setCartItems(cartData);
        toast.success("Added to Cart");
    }

    const batchAddToCart = (itemIds) => {
        if (!user) {
            setShowUserLogin(true);
            return;
        };

        let limitedCount = 0;
        let addedCount = 0;

        setCartItems((prev) => {
            let cartData = structuredClone(prev);
            itemIds.forEach((id) => {
                const productInfo = products.find(p => p._id === id);
                const currentQty = cartData[id] || 0;

                if (productInfo && (currentQty + 1) > productInfo.stock) {
                    limitedCount++;
                } else {
                    if (cartData[id]) {
                        cartData[id] += 1;
                    } else {
                        cartData[id] = 1;
                    }
                    addedCount++;
                }
            });
            return cartData;
        });

        if (limitedCount > 0) {
            toast.success(`Added ${addedCount} items. ${limitedCount} items were limited by stock.`);
        } else {
            toast.success(`${addedCount} Items Added to Cart`);
        }
    }

    //Update Cart Item Quantity
    const updateCartItem = (itemId, quantity) => {
        const productInfo = products.find(p => p._id === itemId);
        let cartData = structuredClone(cartItems);

        if (productInfo && quantity > productInfo.stock) {
            toast.error(`Only ${productInfo.stock} items left in stock`);
            cartData[itemId] = productInfo.stock;
        } else {
            cartData[itemId] = quantity;
        }

        setCartItems(cartData)
        toast.success('Cart Updated')
    }

    //Remove Products from Cart
    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] -= 1;
            if (cartData[itemId] === 0) {
                delete cartData[itemId];
            }
        }
        toast.success('Removed from Cart')
        setCartItems(cartData);
    }

    //Get Cart Item Count
    const getCartCount = () => {
        let totalCount = 0;
        for (const item in cartItems) {
            totalCount += cartItems[item];
        }
        return totalCount;
    }

    //Get Cart Total Amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchSeller();
        fetchProducts();
        fetchAgent();
        fetchCategories();
        fetchUser();
    }, []);

    //Update Database Cart Items
    useEffect(() => {
        const updateCart = async () => {
            try {
                const { data } = await axios.post('/api/cart/update', {
                    userId: user._id,
                    cartItems,
                });
                if (!data.success) {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
        }
        if (user) {
            updateCart()
        }
    }, [cartItems])


    const value = {
        navigate, user, setUser, isSeller, setIsSeller, showUserLogin, setShowUserLogin, products,
        currency, addToCart, batchAddToCart, updateCartItem, removeFromCart, cartItems, searchQuery, setSearchQuery, getCartAmount,
        getCartCount, axios, fetchProducts, setCartItems, isAgent, setIsAgent, categories, getCategories: fetchCategories, confirmAction
    }
    return (
        <AppContext.Provider value={value}>
            <CustomAlert
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                type={alertConfig.type}
            />
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
}
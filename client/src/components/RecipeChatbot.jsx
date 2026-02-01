import React, { useState, useRef, useEffect } from 'react';
import { assets, dummyProducts } from '../assets/assets';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const RecipeChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'ai',
            message: "Hello! I'm your Green Cart Chef. 👨‍🍳 Need recipe ideas or help with groceries?",
        },
    ]);
    const [loading, setLoading] = useState(false);

    const formatMessage = (text) => {
        if (!text) return "";
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (typeof part === 'string' && part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const { axios, addToCart, batchAddToCart } = useAppContext();
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setChatHistory((prev) => [...prev, { role: 'user', message: "📷 Uploading shopping list..." }]);

        const formData = new FormData();
        formData.append("image", file);

        try {
            const { data } = await axios.post('/api/product/scan', formData);

            if (data.success) {
                const foundItems = data.products;
                const notFoundItems = data.notFound || [];
                let message = data.message + "\n\n";

                if (foundItems.length > 0) {
                    batchAddToCart(foundItems.map(p => p._id));
                    message += "✅ **Added to Cart:** " + foundItems.map(p => p.name).join(", ");
                } else {
                    message += "⚠️ I couldn't match any items exactly.";
                }

                if (notFoundItems.length > 0) {
                    message += "\n\n❌ **Not Found/Available:** " + notFoundItems.join(", ");
                }

                setChatHistory((prev) => [...prev, { role: 'ai', message: message }]);
            } else {
                setChatHistory((prev) => [...prev, { role: 'ai', message: "Sorry, I couldn't read that image clearly." }]);
            }

        } catch (error) {
            setChatHistory((prev) => [...prev, { role: 'ai', message: "Oops! Something went wrong while scanning." }]);
            console.error(error);
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [chatHistory, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setChatHistory((prev) => [...prev, { role: 'user', message: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const { data } = await axios.post('/api/ai/chat', {
                message: userMessage,
                history: chatHistory.filter(c => c.role !== 'loading')
            });

            if (data.success) {
                // Check if AI detected "Add to Cart" intent
                if (data.addToCartIntent) {
                    // Try to find the most recent recipe in history to add its products
                    const lastRecipeChat = [...chatHistory].reverse().find(c => c.recipe && c.recipe.products);
                    if (lastRecipeChat) {
                        const productIds = lastRecipeChat.recipe.products.map(p => p._id);
                        batchAddToCart(productIds);
                    }
                }

                setChatHistory((prev) => [...prev, {
                    role: 'ai',
                    message: data.text,
                    recipe: data.recipe
                }]);
            } else {
                setChatHistory((prev) => [...prev, { role: 'ai', message: "Chef is busy, try again later!" }]);
            }
        } catch (error) {
            console.error(error);
            setChatHistory((prev) => [...prev, { role: 'ai', message: "Oops! I lost connection to the kitchen." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-primary p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-white p-1 rounded-full">
                                <img src={assets.ai_chef_icon} alt="Chef" className="w-8 h-8 rounded-full" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Green Cart Chef</h3>
                                <p className="text-[10px] opacity-90 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full text-white/80 hover:text-white transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
                        {/* Initial welcome message with Scan Tip */}
                        {chatHistory.length === 1 && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none text-gray-700 text-sm shadow-sm">
                                    <p>Tip: 📸 You can upload a photo of your handwritten grocery list (Hindi/English), and I'll add items to your cart automatically!</p>
                                </div>
                            </div>
                        )}

                        {chatHistory.map((chat, index) => (
                            <div key={index} className={`flex mb-4 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${chat.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white border border-gray-100 rounded-tl-none text-gray-700'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{formatMessage(chat.message)}</p>

                                    {/* Recipe Card Snippet */}
                                    {chat.recipe && (
                                        <div className="mt-3 bg-green-50/80 p-3 rounded-xl border border-green-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="font-bold text-gray-800 text-xs">{chat.recipe.name}</h3>
                                                {chat.recipe.products && chat.recipe.products.length > 0 && (
                                                    <button
                                                        onClick={() => batchAddToCart(chat.recipe.products.map(p => p._id))}
                                                        className="bg-primary text-white text-[8px] px-2 py-1 rounded-full hover:bg-primary-dull transition"
                                                    >
                                                        Add All
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">Instructions:</p>
                                            <ol className="list-decimal list-inside text-[10px] text-gray-600 space-y-1">
                                                {chat.recipe.instructions.map((step, i) => (
                                                    <li key={i}>{formatMessage(step)}</li>
                                                ))}
                                            </ol>
                                            {chat.recipe.products && (
                                                <div className="mt-2 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                                    {chat.recipe.products.map(prod => (
                                                        <div key={prod._id} className='min-w-[50px] bg-white p-1 rounded border border-gray-100 text-center'>
                                                            <img src={prod.image[0]} alt={prod.name} className='w-8 h-8 object-contain mx-auto' />
                                                            <p className='text-[8px] truncate'>{prod.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t border-gray-200 p-3 flex items-center gap-2">
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        {/* Upload Button */}
                        <button
                            onClick={handleUploadClick}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition"
                            title="Upload Shopping List"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-100 text-sm px-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <button onClick={handleSend} className="bg-primary hover:bg-primary-dull text-white p-2 rounded-full shadow-sm transition">
                            <img src={assets.white_arrow_icon} alt="send" className="w-4 h-4 rotate-0" />
                        </button>
                    </div>

                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group bg-primary hover:bg-primary-dull text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center relative"
                >
                    <img src={assets.ai_chef_icon} alt="Chat" className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                    </span>

                    {/* Tooltip */}
                    <div className="absolute right-full mr-4 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Need Help? Ask Chef!
                    </div>
                </button>
            )}
        </div>
    );
};

export default RecipeChatbot;

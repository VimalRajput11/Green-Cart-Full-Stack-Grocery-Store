import React, { useState } from 'react';
import { assets, dummyProducts } from '../assets/assets';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const RecipeAI = () => {
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'ai',
            message: "Hello! I'm your Green Cart Chef. 👨‍🍳 Tell me what ingredients you have or what you're craving, and I'll suggest a delicious recipe using our fresh products!",
        },
    ]);
    const [loading, setLoading] = useState(false);

    const formatMessage = (text) => {
        if (!text) return "";
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };
    const { axios, batchAddToCart } = useAppContext();

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
                setChatHistory((prev) => [...prev, { role: 'ai', message: data.message || "Chef is busy, try again later!" }]);
            }
        } catch (error) {
            console.error(error);
            setChatHistory((prev) => [...prev, { role: 'ai', message: "Oops! I lost connection to the kitchen." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col bg-gray-50">

            {/* Header */}
            <div className="bg-primary py-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
                <img src={assets.ai_chef_icon} alt="AI Chef" className="w-20 h-20 mx-auto mb-4 rounded-full bg-white p-2 shadow-lg" />
                <h1 className="text-3xl font-bold mb-2">Green Cart AI Chef</h1>
                <p className="max-w-xl mx-auto opacity-90">Your personal culinary assistant. Ask for recipes, ingredient ideas, and shop instantly!</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-4">
                {chatHistory.map((chat, index) => (
                    <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${chat.role === 'user'
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-white border border-gray-100 rounded-tl-none'
                            }`}>
                            <p className="whitespace-pre-wrap">{formatMessage(chat.message)}</p>

                            {/* Recipe Card */}
                            {chat.recipe && (
                                <div className="mt-4 bg-green-50 p-4 rounded-xl border border-green-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-800 text-lg">{chat.recipe.name}</h3>
                                        {chat.recipe.products && chat.recipe.products.length > 0 && (
                                            <button
                                                onClick={() => batchAddToCart(chat.recipe.products.map(p => p._id))}
                                                className="bg-primary text-white text-[10px] px-3 py-1.5 rounded-full hover:bg-primary-dull transition shadow-sm font-semibold"
                                            >
                                                Shop All
                                            </button>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <h4 className="font-semibold text-gray-700 text-sm">Ingredients needed:</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {chat.recipe.ingredients.map((ing, i) => (
                                                <span key={i} className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border border-gray-200">{ing}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-700 text-sm">Instructions:</h4>
                                        <ol className="list-decimal list-inside text-sm text-gray-600 mt-1 space-y-1">
                                            {chat.recipe.instructions.map((step, i) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    {/* Associated Products */}
                                    {chat.recipe.products && chat.recipe.products.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 text-sm mb-2">Shop Ingredients:</h4>
                                            <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'>
                                                {chat.recipe.products.map(prod => (
                                                    <div key={prod._id} className='min-w-[120px] bg-white p-2 rounded border border-gray-200 shadow-sm flex flex-col items-center text-center'>
                                                        <img src={prod.image[0]} alt={prod.name} className='w-16 h-16 object-contain mb-1' />
                                                        <p className='text-xs font-medium truncate w-full'>{prod.name}</p>
                                                        <p className='text-xs text-primary font-bold'>₹{prod.offerPrice}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
                <div className="max-w-4xl mx-auto relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for a recipe (e.g., 'What can I make with paneer?')..."
                        className="w-full pl-5 pr-14 py-3 rounded-full border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                    />
                    <button
                        onClick={handleSend}
                        className="absolute right-2 bg-primary hover:bg-primary-dull text-white p-2 rounded-full transition shadow-md"
                    >
                        <img src={assets.white_arrow_icon} alt="Send" className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeAI;

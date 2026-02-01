import React, { useState } from 'react';
import { assets, dummyProducts } from '../assets/assets';
import toast from 'react-hot-toast';

const RecipeAI = () => {
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'ai',
            message: "Hello! I'm your Green Cart Chef. 👨‍🍳 Tell me what ingredients you have or what you're craving, and I'll suggest a delicious recipe using our fresh products!",
        },
    ]);
    const [loading, setLoading] = useState(false);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = input;
        setChatHistory((prev) => [...prev, { role: 'user', message: userMessage }]);
        setInput('');
        setLoading(true);

        // Simulate AI delay
        setTimeout(() => {
            const response = generateRecipeResponse(userMessage);
            setChatHistory((prev) => [...prev, { role: 'ai', message: response.text, recipe: response.recipe }]);
            setLoading(false);
        }, 1500);
    };

    const generateRecipeResponse = (query) => {
        query = query.toLowerCase();

        // Simple keyword matching logic
        if (query.includes('breakfast')) {
            return {
                text: "How about a healthy and energetic start? I recommend a **Power Packed Oats Bowl**.",
                recipe: {
                    name: "Power Packed Oats Bowl",
                    ingredients: ["Oats", "Milk", "Banana", "Apple", "Honey"],
                    instructions: [
                        "Boil milk and add oats.",
                        "Cook for 5 minutes until soft.",
                        "Chop banana and apple.",
                        "Top the oats with fruits and a drizzle of honey.",
                    ],
                    products: dummyProducts.filter(p => p.category === 'Dairy' || p.category === 'Fruits' || p.name.includes('Oats'))
                }
            };
        }

        if (query.includes('dinner') || query.includes('lunch') || query.includes('curry') || query.includes('paneer')) {
            return {
                text: "A warm, home-cooked meal sounds perfect. Let's make **Shahi Matar Paneer**!",
                recipe: {
                    name: "Shahi Matar Paneer",
                    ingredients: ["Paneer", "Peas (Matar)", "Tomato", "Onion", "Spices", "Cream"],
                    instructions: [
                        "Fry paneer cubes until golden.",
                        "Sauté onions and tomato puree.",
                        "Add spices and peas, cook for 10 mins.",
                        "Add paneer and simmer. Garnish with cream.",
                    ],
                    products: dummyProducts.filter(p => p.category === 'Dairy' || p.category === 'Vegetables').slice(0, 4)
                }
            };
        }

        if (query.includes('snack') || query.includes('quick')) {
            return {
                text: "Need something quick? Try **Spicy Masala Maggi** with a twist of fresh veggies.",
                recipe: {
                    name: "Spicy Vegetable Maggi",
                    ingredients: ["Maggi", "Carrot", "Peas", "Onion", "Green Chili"],
                    instructions: [
                        "Sauté chopped veggies in a pan.",
                        "Add water and bring to boil.",
                        "Add Maggi noodles and tastemaker.",
                        "Cook for 2 mins and serve hot!",
                    ],
                    products: dummyProducts.filter(p => p.category === 'Instant' || p.category === 'Vegetables').slice(0, 4)
                }
            };
        }

        if (query.includes('fruit') || query.includes('sweet') || query.includes('dessert')) {
            return {
                text: "Satisfy your sweet tooth naturally! How about a **Fresh Fruit Salad**?",
                recipe: {
                    name: "Fresh Fruit Salad",
                    ingredients: ["Apple", "Banana", "Grapes", "Orange", "Honey"],
                    instructions: [
                        "Wash and chop all fruits into bite-sized pieces.",
                        "Mix them in a large bowl.",
                        "Drizzle with honey and toss gently.",
                        "Chill for 30 mins before serving.",
                    ],
                    products: dummyProducts.filter(p => p.category === 'Fruits').slice(0, 5)
                }
            };
        }

        return {
            text: "That sounds interesting! I can suggest a versatile **Mixed Vegetable Stir Fry**.",
            recipe: {
                name: "Mixed Vegetable Stir Fry",
                ingredients: ["Carrot", "Potato", "Onion", "Tomato", "Spinach"],
                instructions: [
                    "Chop all vegetables finely.",
                    "Heat oil in a pan and add cumin seeds.",
                    "Stir fry vegetables for 10-15 mins.",
                    "Add salt and pepper to taste.",
                ],
                products: dummyProducts.filter(p => p.category === 'Vegetables').slice(0, 5)
            }
        };
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
                            <p className="whitespace-pre-wrap">{chat.message}</p>

                            {/* Recipe Card */}
                            {chat.recipe && (
                                <div className="mt-4 bg-green-50 p-4 rounded-xl border border-green-100">
                                    <h3 className="font-bold text-gray-800 text-lg mb-2">{chat.recipe.name}</h3>

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

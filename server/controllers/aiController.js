import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/Product.js";

// genAI will be initialized inside handler

export const generateRecipe = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.json({ success: false, message: "Please provide a message" });
        }

        // Fetch all products to recommend real store items
        const allProducts = await Product.find({}, 'name _id category offerPrice image');
        const productListString = allProducts.map(p => `- ${p.name} (ID: ${p._id}, Category: ${p.category})`).join('\n');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Format history for the prompt
        const historyContext = history && history.length > 0
            ? history.map(h => `${h.role === 'user' ? 'User' : 'Chef'}: ${h.message}`).join('\n')
            : "No previous conversation.";

        const prompt = `
            You are "Chef Green", an expert professional chef. You are helping a user of the "Green Cart" grocery app.
            
            CONVERSATION HISTORY:
            ${historyContext}

            CURRENT USER MESSAGE: "${message}"

            AVAILABLE STORE PRODUCTS:
            ${productListString}

            STRICT GUIDELINES:
            1. Suggest HIGH-QUALITY, professional recipes.
            2. If the user asks to "add to cart", check the CONVERSATION HISTORY to see which recipe products to add.
            3. In the "recommendedProductIds" field, you MUST provide the exact IDs from the "AVAILABLE" list.
            4. If the user says "add to cart", set "addToCartIntent": true and repeat the IDs in "recommendedProductIds".
            5. Use "**bold**" for emphasis.

            RESPONSE FORMAT (JSON ONLY):
            {
                "text": "Your professional response",
                "addToCartIntent": false,
                "recipe": {
                    "name": "Recipe Name",
                    "ingredients": ["Ingredient 1"],
                    "instructions": ["Step 1"],
                    "recommendedProductIds": ["ID1"]
                }
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let aiData;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            aiData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error("AI Error:", responseText);
            throw new Error("Failed to parse Chef's response");
        }

        // Precise ID-based matching
        if (aiData.recipe && aiData.recipe.recommendedProductIds) {
            aiData.recipe.products = allProducts.filter(p =>
                aiData.recipe.recommendedProductIds.includes(p._id.toString())
            );
        }

        res.json({
            success: true,
            ...aiData
        });

    } catch (error) {
        console.error("AI Chef Error:", error);
        res.json({ success: false, message: "Chef is busy, try again later!" });
    }
};

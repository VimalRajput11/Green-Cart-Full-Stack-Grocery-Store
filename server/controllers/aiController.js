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

        // Create product list for AI with IDs (for internal matching only)
        const productListForAI = allProducts.map(p => `- ${p.name} (ID: ${p._id}, Category: ${p.category})`).join('\n');

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

            AVAILABLE STORE PRODUCTS (Internal Reference Only - DO NOT show IDs to user):
            ${productListForAI}

            STRICT GUIDELINES:
            1. **LANGUAGE**: Respond in the SAME LANGUAGE as the user's message. If they write in Hindi, respond in Hindi. If English, respond in English. If mixed, use the dominant language.
            2. **NO PRODUCT IDs IN USER-FACING TEXT**: NEVER include product IDs (like "ID: 69819f...") in your "text" or "instructions" fields. IDs are ONLY for the "recommendedProductIds" array.
            3. Suggest HIGH-QUALITY, professional recipes with clear step-by-step instructions.
            4. When mentioning ingredients in instructions, use ONLY the product name (e.g., "टमाटर" or "Tomato"), NEVER include IDs.
            5. If the user asks to "add to cart", check the CONVERSATION HISTORY to see which recipe products to add.
            6. In the "recommendedProductIds" field, provide the exact IDs from the "AVAILABLE STORE PRODUCTS" list.
            7. If the user says "add to cart", set "addToCartIntent": true and repeat the IDs in "recommendedProductIds".
            8. Use "**bold**" for emphasis in your text responses.

            RESPONSE FORMAT (JSON ONLY):
            {
                "text": "Your professional response in the user's language",
                "addToCartIntent": false,
                "recipe": {
                    "name": "Recipe Name (in user's language)",
                    "ingredients": ["Ingredient 1 (in user's language)"],
                    "instructions": ["Step 1 (in user's language, NO IDs)"],
                    "recommendedProductIds": ["ID1", "ID2"]
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

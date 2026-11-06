import User from '../models/User.js';


//Update User CartData : /api/cart/update

export const updateCart = async (req, res)=>{
    try {
        const { cartItems } = req.body;
        if (!cartItems || typeof cartItems !== 'object' || Array.isArray(cartItems)) {
            return res.json({ success: false, message: 'Invalid cart' });
        }
        // Keep only positive whole-number quantities
        const clean = {};
        for (const [id, qty] of Object.entries(cartItems)) {
            const n = Number(qty);
            if (Number.isInteger(n) && n > 0) clean[id] = n;
        }
        // Always update the logged-in user's cart, never one named in the request body
        await User.findByIdAndUpdate(req.userId, { cartItems: clean });
        res.json({success: true, message: 'Cart Updated'})

    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}

import mongoose from 'mongoose';
import Order from './models/Order.js';

const MONGODB_URI = 'mongodb+srv://Vimal_Rajput:vimal123@cluster0.f2x9o3f.mongodb.net/Green_Cart?retryWrites=true&w=majority&appName=Cluster0';

async function revertCODOrders() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Revert COD orders back to isPaid: false (they should only be true after agent collects cash)
        const result = await Order.updateMany(
            { paymentType: 'COD', isPaid: true },
            { $set: { isPaid: false } }
        );

        console.log(`✅ Reverted ${result.modifiedCount} COD orders to isPaid: false`);
        console.log('💡 COD orders will now be marked as paid only after the agent collects cash');

        // Show all orders
        const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(10);
        console.log('\nRecent orders:');
        allOrders.forEach(order => {
            console.log(`- Order ${order._id.toString().slice(-6)}: ${order.paymentType}, isPaid: ${order.isPaid}, status: ${order.status}`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

revertCODOrders();

import mongoose from 'mongoose';
import Order from './models/Order.js';

const MONGODB_URI = 'mongodb+srv://Vimal_Rajput:vimal123@cluster0.f2x9o3f.mongodb.net/Green_Cart?retryWrites=true&w=majority&appName=Cluster0';

async function fixCODOrders() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all COD orders that have isPaid: false
        const result = await Order.updateMany(
            { paymentType: 'COD', isPaid: false },
            { $set: { isPaid: true } }
        );

        console.log(`✅ Updated ${result.modifiedCount} COD orders to isPaid: true`);

        // Show all orders
        const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(10);
        console.log('\nRecent orders:');
        allOrders.forEach(order => {
            console.log(`- Order ${order._id}: ${order.paymentType}, isPaid: ${order.isPaid}, status: ${order.status}`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixCODOrders();

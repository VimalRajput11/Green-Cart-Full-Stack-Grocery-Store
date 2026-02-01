import mongoose from 'mongoose';
import Order from './models/Order.js';

const MONGODB_URI = 'mongodb+srv://Vimal_Rajput:vimal123@cluster0.f2x9o3f.mongodb.net/Green_Cart?retryWrites=true&w=majority&appName=Cluster0';

async function testSellerQuery() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const query = {
            $or: [
                { paymentType: "COD" },
                { paymentType: "Online", isPaid: true }
            ],
        };

        console.log('Running query:', JSON.stringify(query, null, 2));

        const orders = await Order.find(query).limit(5);
        console.log(`\n📦 Found ${orders.length} orders matching seller query`);

        if (orders.length > 0) {
            console.log('First order ID:', orders[0]._id);
            console.log('First order paymentType:', orders[0].paymentType);
            console.log('First order isPaid:', orders[0].isPaid);
        } else {
            console.log('\nChecking all orders in DB to see their fields...');
            const allOrders = await Order.find({}).limit(5);
            allOrders.forEach((o, i) => {
                console.log(`Order ${i}: paymentType="${o.paymentType}", isPaid=${o.isPaid}`);
            });
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testSellerQuery();

import mongoose from 'mongoose';
import Order from './models/Order.js';
import Address from './models/Address.js';

const MONGODB_URI = 'mongodb+srv://Vimal_Rajput:vimal123@cluster0.f2x9o3f.mongodb.net/Green_Cart?retryWrites=true&w=majority&appName=Cluster0';

async function testPopulate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find({
            $or: [
                { paymentType: "COD" },
                { paymentType: "Online", isPaid: true }
            ],
        })
            .populate("items.product address")
            .limit(3);

        console.log(`Found ${orders.length} orders`);

        orders.forEach((o, i) => {
            console.log(`Order ${i + 1}:`);
            console.log(`  Address Populated: ${o.address && typeof o.address === 'object' ? '✅ Yes (' + o.address.firstName + ')' : '❌ No (' + (typeof o.address) + ')'}`);
            if (!o.address) console.log(`  Address field value: ${o.get('address')}`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

testPopulate();

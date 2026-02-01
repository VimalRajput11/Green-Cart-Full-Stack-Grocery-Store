import mongoose from 'mongoose';
import Order from './models/Order.js';
import Address from './models/Address.js';
import Product from './models/Product.js';
import User from './models/User.js';

const MONGODB_URI = 'mongodb+srv://Vimal_Rajput:vimal123@cluster0.f2x9o3f.mongodb.net/Green_Cart?retryWrites=true&w=majority&appName=Cluster0';

async function finalCheck() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const orders = await Order.find({
            $or: [
                { paymentType: "COD" },
                { paymentType: "Online", isPaid: true }
            ],
        })
            .populate("items.product address")
            .limit(5);

        console.log(`\n📦 Found ${orders.length} orders for seller`);

        orders.forEach((o, i) => {
            console.log(`\nOrder ${i + 1}: ${o._id}`);
            console.log(`  Payment: ${o.paymentType}, Paid: ${o.isPaid}`);
            console.log(`  Address Populated: ${o.address && typeof o.address === 'object' ? '✅ Yes' : '❌ No'}`);
            if (o.address && typeof o.address === 'object') {
                console.log(`    Address Name: ${o.address.firstName} ${o.address.lastName}`);
            }
            console.log(`  Items Count: ${o.items.length}`);
            o.items.forEach((item, j) => {
                console.log(`    Item ${j + 1} Product Populated: ${item.product && typeof item.product === 'object' ? '✅ Yes' : '❌ No'}`);
            });
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

finalCheck();

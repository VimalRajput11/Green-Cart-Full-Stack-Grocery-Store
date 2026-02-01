import mongoose from 'mongoose';
import Order from './models/Order.js';

const MONGODB_URI = 'mongodb+srv://Vimal_Rajput:vimal123@cluster0.f2x9o3f.mongodb.net/Green_Cart?retryWrites=true&w=majority&appName=Cluster0';

async function checkOrders() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all orders
        const allOrders = await Order.find({}).sort({ createdAt: -1 });

        console.log(`📦 Total orders in database: ${allOrders.length}\n`);

        // Group by payment type and status
        const codOrders = allOrders.filter(o => o.paymentType === 'COD');
        const onlineOrders = allOrders.filter(o => o.paymentType === 'Online');

        console.log('💵 COD Orders:');
        console.log(`   Total: ${codOrders.length}`);
        console.log(`   Paid: ${codOrders.filter(o => o.isPaid).length}`);
        console.log(`   Unpaid: ${codOrders.filter(o => !o.isPaid).length}\n`);

        console.log('💳 Online Orders:');
        console.log(`   Total: ${onlineOrders.length}`);
        console.log(`   Paid: ${onlineOrders.filter(o => o.isPaid).length}`);
        console.log(`   Unpaid: ${onlineOrders.filter(o => !o.isPaid).length}\n`);

        console.log('📋 Recent 10 orders:');
        console.log('─'.repeat(80));
        allOrders.slice(0, 10).forEach((order, i) => {
            const id = order._id.toString().slice(-6);
            const paid = order.isPaid ? '✅ PAID' : '❌ UNPAID';
            const assigned = order.assignedTo ? '👤 Assigned' : '⭕ Unassigned';
            console.log(`${i + 1}. ${id} | ${order.paymentType.padEnd(7)} | ${paid.padEnd(10)} | ${assigned.padEnd(14)} | ${order.status}`);
        });
        console.log('─'.repeat(80));

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkOrders();

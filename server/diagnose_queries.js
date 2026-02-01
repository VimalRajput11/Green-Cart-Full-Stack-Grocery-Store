import mongoose from 'mongoose';
import Order from './models/Order.js';
import DeliveryAgent from './models/DeliveryAgent.js';

const MONGODB_URI = 'mongodb+srv://Vimal_Rajput:vimal123@cluster0.f2x9o3f.mongodb.net/Green_Cart?retryWrites=true&w=majority&appName=Cluster0';

async function diagnose() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const agent = await DeliveryAgent.findOne({});
        if (!agent) {
            console.log('❌ No agents found');
            return;
        }

        console.log(`\n🕵️ Testing for Agent: ${agent.name}`);
        console.log(`   ID: ${agent._id}`);
        console.log(`   Registered at: ${agent.createdAt}`);

        const query = {
            $and: [
                {
                    $or: [
                        { paymentType: 'COD' },
                        { paymentType: 'Online', isPaid: true }
                    ]
                },
                {
                    $or: [
                        {
                            assignedTo: null,
                            createdAt: { $gte: agent.createdAt }
                        },
                        { assignedTo: agent._id }
                    ]
                }
            ]
        };

        const orders = await Order.find(query);
        console.log(`\n📦 Agent Visible Orders: ${orders.length}`);

        if (orders.length === 0) {
            console.log('\n❌ No orders found. Checking why...');

            const allCod = await Order.find({ paymentType: 'COD' });
            console.log(`- Total COD orders in DB: ${allCod.length}`);

            if (allCod.length > 0) {
                const latestCod = allCod.sort((a, b) => b.createdAt - a.createdAt)[0];
                console.log(`- Latest COD order createdAt: ${latestCod.createdAt}`);
                console.log(`- Is Latest COD order before Agent registration? ${latestCod.createdAt < agent.createdAt}`);
            }
        }

        const sellerQuery = {
            $or: [
                { paymentType: "COD" },
                { paymentType: "Online", isPaid: true }
            ],
        };
        const sellerOrders = await Order.find(sellerQuery);
        console.log(`\n📦 Seller Visible Orders: ${sellerOrders.length}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

diagnose();

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://Vimal_Rajput:vimal123@cluster0.f2x9o3f.mongodb.net/Green_Cart?retryWrites=true&w=majority&appName=Cluster0';

async function checkBsonTypes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const collection = mongoose.connection.collection('orders');
        const sample = await collection.findOne({});

        if (sample) {
            console.log('Sample Order:', JSON.stringify(sample, null, 2));
            console.log('Type of userId:', typeof sample.userId, sample.userId.constructor.name);
            console.log('Type of address:', typeof sample.address, sample.address.constructor.name);
        } else {
            console.log('No orders found');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

checkBsonTypes();

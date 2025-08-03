const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
            setTimeout(connectDB, 5000);
        });
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB error: ', err);
        });
        return conn;
    } catch (error){
        console.error('MongoDB connection failed: ', error.message);
        process.exit(1);
    }
};

//Graceful shutdown
const closeDB = async () => {
    try{
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error){
        console.error('Error closing the MongoDB connection: ', error);
    }
};

module.exports = {connectDB, closeDB};
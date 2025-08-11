require('dotenv').config({path: '../.env'}); //Load from root
const app = require('./app');
const {connectDB, closeDB} = require('./config/db');

const PORT = process.env.PORT || 3001;

if(!process.env.MONGO_URI){
    console.error('MONGO_URI is not defined in .env');
    process.exit(1);
}
console.log('Server is starting...');

const startServer = async () => {
    try{
        await connectDB(); //Connect to mongoDB
        //Start Express server
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        //Graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n Received ${signal}. Starting graceful shutdown...`);

            server.close(async () => {
                console.log('HTTP server closed');
                await closeDB();
                process.exit(0);
            });
            setTimeout(() => {
                console.error('Shutdown timed out.. hold up...');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (error){
        console.error('Failed to start server: ', error);
        process.exit(1);
    }
};
startServer();
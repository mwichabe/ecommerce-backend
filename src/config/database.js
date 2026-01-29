const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Remove deprecated options
            // useNewUrlParser: true,  // No longer needed
            // useUnifiedTopology: true, // No longer needed
            // bufferMaxEntries: 0,      // Deprecated in Mongoose 6+
            // bufferCommands: false,    // Deprecated in Mongoose 6+

            // Add timeout and connection pooling options
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // 45 seconds
            connectTimeoutMS: 60000, // 60 seconds

            // Connection pool settings
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2, // Keep at least 2 socket connections
            maxIdleTimeMS: 30000, // Close connections after 30s of inactivity

            // Retry settings
            retryWrites: true,
            retryReads: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
            console.error('Error details:', {
                message: err.message,
                name: err.name,
                code: err.code,
                statusCode: err.statusCode
            });
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        // Monitor connection state
        mongoose.connection.on('connecting', () => {
            console.log('MongoDB connecting...');
        });

        mongoose.connection.on('disconnecting', () => {
            console.log('MongoDB disconnecting...');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
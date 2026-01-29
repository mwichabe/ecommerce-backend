// Test script to verify database connection improvements
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    console.log('🔍 Testing MongoDB connection with new settings...\n');

    try {
        // Test connection with same settings as database.js
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 60000,
            bufferMaxEntries: 0,
            bufferCommands: false,
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 30000,
            retryWrites: true,
            retryReads: true,
        });

        console.log('✅ Connected successfully!');
        console.log(`   Host: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);
        console.log(`   Ready State: ${mongoose.connection.readyState}`);

        // Test a simple query
        console.log('\n🧪 Testing database query...');
        const start = Date.now();

        // Try to access the users collection
        const User = require('./src/models/user');
        await User.findOne().limit(1);

        const duration = Date.now() - start;
        console.log(`✅ Query completed in ${duration}ms`);

        // Test multiple concurrent queries
        console.log('\n🔄 Testing concurrent queries...');
        const concurrentStart = Date.now();

        const promises = Array.from({ length: 5 }, () =>
            User.findOne().limit(1).exec()
        );

        await Promise.all(promises);
        const concurrentDuration = Date.now() - concurrentStart;
        console.log(`✅ 5 concurrent queries completed in ${concurrentDuration}ms`);

        await mongoose.connection.close();
        console.log('\n🎉 All tests passed! Database connection is healthy.');

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.error('Error details:', {
            name: error.name,
            code: error.code,
            statusCode: error.statusCode
        });

        if (error.name === 'MongoServerSelectionError') {
            console.log('\n💡 This usually means:');
            console.log('   1. IP not whitelisted in MongoDB Atlas');
            console.log('   2. Network connectivity issues');
            console.log('   3. MongoDB Atlas cluster is down');
        }

        process.exit(1);
    }
}

// Run the test
testConnection();

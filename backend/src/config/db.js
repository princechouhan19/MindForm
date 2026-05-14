const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    let dbURI = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!dbURI) throw new Error('Database URI is missing from environment variables!')
    
    dbURI = dbURI.trim()
    
    console.log('⏳ Attempting to connect to MongoDB...')
    
    // DB connection lifecycle events for production monitoring
    mongoose.connection.on('connected', () => console.log('✅ MongoDB connection established.'));
    mongoose.connection.on('error', (err) => console.error(`❌ Mongoose connection error: ${err.message}`));
    mongoose.connection.on('disconnected', () => console.warn('⚠️ Mongoose connection lost!'));

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 Mongoose connection disconnected through app termination');
      process.exit(0);
    });

    const conn = await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50, // Production standard pool size
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    })
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB


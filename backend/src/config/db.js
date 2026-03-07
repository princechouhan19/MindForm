const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!dbURI) throw new Error('Database URI is missing from environment variables!')
    
    const conn = await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB

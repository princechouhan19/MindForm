const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    let dbURI = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!dbURI) throw new Error('Database URI is missing from environment variables!')
    
    // Safety trim for accidental spaces
    dbURI = dbURI.trim()
    
    console.log('⏳ Attempting to connect to MongoDB...')
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

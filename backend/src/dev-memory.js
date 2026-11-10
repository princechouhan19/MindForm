// Dev-only launcher: spins up an in-memory MongoDB then boots the real server.
// Usage: node src/dev-memory.js
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const { MongoMemoryServer } = require('mongodb-memory-server')

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'mindform' },
  })
  process.env.MONGO_URI = mongod.getUri('mindform')
  console.log('🧪 In-memory MongoDB running at', process.env.MONGO_URI)
  require('./server.js')
}

main().catch((err) => {
  console.error('Failed to start memory server:', err)
  process.exit(1)
})

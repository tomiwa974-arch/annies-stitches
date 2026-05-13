import hash from '@adonisjs/core/services/hash'

const password = 'password123'
const hashed = await hash.make(password)
console.log('Hashed password:', hashed)
process.exit(0)
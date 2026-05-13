import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { User } from '#models/index'

export default class extends BaseSeeder {
  async run() {
    // Check if admin already exists
    const existingAdmin = await User.findBy('email', 'admin@annies.com')
    
    if (!existingAdmin) {
      await User.create({
        fullName: 'Admin User',
        email: 'admin@annies.com',
        password: '$scrypt$n=16384,r=8,p=1$Pr2nHyCkOzrsnxz3Hr2VGA$4NX4NLVxlATNyoQ1qxrzqiHBA2Erk6SbqGV3MKnxzBQdK+1tZJOiIRjkEifkEHwMwvzc3T3ad0MjpD84ab6vGg',
        role: 'admin',
        isActive: true
      })
      console.log('Admin user created!')
    } else {
      console.log('Admin user already exists, skipping...')
    }
  }
}
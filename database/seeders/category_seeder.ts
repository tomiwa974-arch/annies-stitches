import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Category } from '#models/index'

export default class extends BaseSeeder {
  async run() {
    const existingCategories = await Category.first()
    
    if (!existingCategories) {
      await Category.createMany([
        { name: 'Evening Gowns', slug: 'evening-gowns', description: 'Timeless elegance for unforgettable nights', order: 0, isActive: true },
        { name: 'Corset Dresses', slug: 'corset-dresses', description: 'Sculpted silhouettes that empower', order: 1, isActive: true },
        { name: 'Aso-Ebi Specials', slug: 'aso-ebi-specials', description: 'Celebrate in vibrant African elegance', order: 2, isActive: true },
        { name: "Men's Classic", slug: 'mens-classic', description: "Sharp tailoring for the modern gentleman", order: 3, isActive: true },
        { name: 'Bridal Collection', slug: 'bridal-collection', description: 'Your dream dress awaits', order: 4, isActive: true },
        { name: 'Custom Pieces', slug: 'custom-pieces', description: 'One-of-a-kind creations just for you', order: 5, isActive: true }
      ])
      console.log('Categories created!')
    } else {
      console.log('Categories already exist, skipping...')
    }
  }
}
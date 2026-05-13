import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Create users table
    this.schema.createTable('users', (table) => {
      table.increments('id')
      table.string('full_name').nullable()
      table.string('email').unique().notNullable()
      table.string('password').notNullable()
      table.string('role').defaultTo('user')
      table.boolean('is_active').defaultTo(true)
      table.string('remember_me_token').nullable()
      table.string('reset_token').nullable()
      table.timestamp('reset_token_expiry').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // Create categories table (for COLLECTION categories - Evening Gowns, Corset Dresses, etc.)
    this.schema.createTable('categories', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').unique().notNullable()
      table.text('description').nullable()
      table.string('cover_image').nullable()
      table.integer('order').defaultTo(0)
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // Create works table
    this.schema.createTable('works', (table) => {
      table.increments('id')
      table.integer('category_id').unsigned().references('categories.id').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('image_url').nullable()
      table.text('materials').nullable()
      table.decimal('price', 10, 2).nullable()
      table.boolean('is_featured').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table.integer('sort_order').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // Create products table (for STORE products) - with store_category column
    this.schema.createTable('products', (table) => {
      table.increments('id')
      table.integer('category_id').unsigned().references('categories.id').onDelete('SET NULL')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('size').nullable()
      table.string('image_url').nullable()
      table.integer('stock').defaultTo(0)
      table.boolean('is_active').defaultTo(true)
      table.string('store_category').nullable()  // ← ADDED: separate category for store products
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // Create orders table
    this.schema.createTable('orders', (table) => {
      table.increments('id')
      table.string('order_number').unique().notNullable()
      table.integer('user_id').unsigned().references('users.id').onDelete('SET NULL')
      table.string('customer_name').notNullable()
      table.string('customer_email').notNullable()
      table.string('customer_phone').nullable()
      table.text('shipping_address').nullable()
      table.decimal('total_amount', 10, 2).notNullable()
      table.enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']).defaultTo('pending')
      table.enum('payment_status', ['pending', 'paid', 'failed', 'refunded']).defaultTo('pending')
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // Create order_items table
    this.schema.createTable('order_items', (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().references('orders.id').onDelete('CASCADE')
      table.integer('product_id').unsigned().references('products.id').onDelete('SET NULL')
      table.string('product_name').notNullable()
      table.integer('quantity').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('size').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // Create collections table (for homepage content)
    this.schema.createTable('collections', (table) => {
      table.increments('id')
      table.string('title').defaultTo("Annie's Stitches")
      table.text('bio').nullable()
      table.text('journey_text').nullable()
      table.integer('happy_clients').defaultTo(0)
      table.integer('years_experience').defaultTo(0)
      table.json('services').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // Create activities table
    this.schema.createTable('activities', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('SET NULL')
      table.string('type').notNullable()
      table.string('entity_type').nullable()
      table.integer('entity_id').nullable()
      table.text('description').nullable()
      table.string('ip_address').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.index(['type', 'entity_type', 'entity_id'])
    })

    // Insert default admin user
    await this.db.table('users').insert({
      full_name: 'Admin User',
      email: 'admin@annies.com',
      password: '$scrypt$n=16384,r=8,p=1$Pr2nHyCkOzrsnxz3Hr2VGA$4NX4NLVxlATNyoQ1qxrzqiHBA2Erk6SbqGV3MKnxzBQdK+1tZJOiIRjkEifkEHwMwvzc3T3ad0MjpD84ab6vGg',
      role: 'admin',
      is_active: true
    })

    // Insert default collection categories (for homepage/works)
    await this.db.table('categories').insert([
      { name: 'Evening Gowns', slug: 'evening-gowns', description: 'Timeless elegance for unforgettable nights', order: 0, is_active: true },
      { name: 'Corset Dresses', slug: 'corset-dresses', description: 'Sculpted silhouettes that empower', order: 1, is_active: true },
      { name: 'Aso-Ebi Specials', slug: 'aso-ebi-specials', description: 'Celebrate in vibrant African elegance', order: 2, is_active: true },
      { name: "Men's Classic", slug: 'mens-classic', description: "Sharp tailoring for the modern gentleman", order: 3, is_active: true },
      { name: 'Bridal Collection', slug: 'bridal-collection', description: 'Your dream dress awaits', order: 4, is_active: true },
      { name: 'Custom Pieces', slug: 'custom-pieces', description: 'One-of-a-kind creations just for you', order: 5, is_active: true }
    ])

    // Insert default collection content (homepage bio and journey text)
    await this.db.table('collections').insert({
      title: "Annie's Stitches",
      bio: "Hi I'm Annabelle— a self-made fashion designer. From sketch to stitch, I create thoughtfully made pieces that reflect confidence, detail, and individuality.",
      journey_text: "This is my journey in fashion. I built this brand from the ground up through years of dedication, learning, and hands-on work. Over the past 6–8 years, I've spent countless late nights refining my craft, growing through challenges, and creating pieces with intention.",
      happy_clients: 1000,
      years_experience: 8,
      services: JSON.stringify(["CUSTOM TAILORING", "CORSET & STATEMENT DRESSES", "READY-TO-WEAR", "TRADITIONAL WEAR (ASO-EBI & ANKARA)", "MENS CASUAL WEAR", "MEN'S TRADITIONAL WEAR"])
    })
  }

  async down() {
    this.schema.dropTableIfExists('order_items')
    this.schema.dropTableIfExists('orders')
    this.schema.dropTableIfExists('activities')
    this.schema.dropTableIfExists('works')
    this.schema.dropTableIfExists('products')
    this.schema.dropTableIfExists('categories')
    this.schema.dropTableIfExists('collections')
    this.schema.dropTableIfExists('users')
  }
}
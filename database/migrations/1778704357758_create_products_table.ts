import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ProductsTable extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('category_id')
        .unsigned()
        .references('categories.id')
        .onDelete('SET NULL')

      table.string('name').notNullable()
      table.text('description').nullable()

      table.decimal('price', 10, 2).notNullable()

      table.string('size').nullable()
      table.string('image_url').nullable()

      table.integer('stock').defaultTo(0)
      table.boolean('is_active').defaultTo(true)

      table.string('store_category').nullable()

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
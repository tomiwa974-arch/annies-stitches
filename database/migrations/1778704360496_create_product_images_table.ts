import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ProductImagesTable extends BaseSchema {
  protected tableName = 'product_images'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('product_id')
        .unsigned()
        .references('products.id')
        .onDelete('CASCADE')

      table.string('image_url').notNullable()
      table.integer('sort_order').defaultTo(0)

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class OrderItemsTable extends BaseSchema {
  protected tableName = 'order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('order_id')
        .unsigned()
        .references('orders.id')
        .onDelete('CASCADE')

      table.integer('product_id')
        .unsigned()
        .references('products.id')
        .onDelete('SET NULL')

      table.string('product_name').notNullable()
      table.integer('quantity').notNullable()
      table.decimal('price', 10, 2).notNullable()

      table.string('size').nullable()

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
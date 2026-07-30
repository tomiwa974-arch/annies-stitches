import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CartItemsTable extends BaseSchema {
  protected tableName = 'cart_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.integer('product_id').unsigned().notNullable().references('products.id').onDelete('CASCADE')
      table.string('size').nullable()
      table.integer('quantity').unsigned().notNullable().defaultTo(1)

      table.unique(['user_id', 'product_id', 'size'])
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

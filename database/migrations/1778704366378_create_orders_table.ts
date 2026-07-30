import { BaseSchema } from '@adonisjs/lucid/schema'

export default class OrdersTable extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('order_number').unique().notNullable()

      table.integer('user_id')
        .unsigned()
        .references('users.id')
        .onDelete('SET NULL')

      table.string('customer_name').notNullable()
      table.string('customer_email').notNullable()
      table.string('customer_phone').nullable()

      table.text('shipping_address').nullable()

      table.decimal('total_amount', 10, 2).notNullable()

      table.enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .defaultTo('pending')

      table.enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])
        .defaultTo('pending')

      table.text('notes').nullable()

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
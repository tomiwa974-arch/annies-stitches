import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('order_submissions', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.string('submission_key', 100).notNullable()
      table.integer('order_id').unsigned().notNullable().references('orders.id').onDelete('CASCADE')
      table.unique(['user_id', 'submission_key'])
    })
  }
  async down() {
    this.schema.dropTable('order_submissions')
  }
}

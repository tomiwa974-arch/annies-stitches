import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.json('delivery_address').nullable()
    })
  }
  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('delivery_address')
    })
  }
}

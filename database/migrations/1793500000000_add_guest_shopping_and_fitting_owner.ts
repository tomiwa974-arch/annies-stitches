import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('guest_list_merges', (table) => {
      table.string('id', 36).primary()
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.dateTime('created_at').notNullable()
    })
    this.schema.alterTable('fitting_requests', (table) => {
      table.integer('user_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
    })
  }
  async down() {
    this.schema.alterTable('fitting_requests', (table) => table.dropForeign(['user_id']))
    this.schema.alterTable('fitting_requests', (table) => table.dropColumn('user_id'))
    this.schema.dropTable('guest_list_merges')
  }
}

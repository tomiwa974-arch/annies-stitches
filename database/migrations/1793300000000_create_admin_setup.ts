import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('admin_setup', (table) => {
      table.integer('id').primary()
      table.string('reserved_email', 254).nullable()
      table.dateTime('claimed_at').nullable()
    })
    this.defer(async (db) => {
      await db.table('admin_setup').insert({ id: 1 })
    })
  }
  async down() {
    this.schema.dropTable('admin_setup')
  }
}

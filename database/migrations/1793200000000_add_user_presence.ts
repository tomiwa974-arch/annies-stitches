import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.dateTime('last_seen_at').nullable().index()
    })
  }
  async down() {
    this.schema.alterTable('users', (table) => table.dropColumn('last_seen_at'))
  }
}

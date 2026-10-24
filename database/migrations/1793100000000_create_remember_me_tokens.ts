import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('remember_me_tokens', (table) => {
      table.increments('id')
      table
        .integer('tokenable_id')
        .unsigned()
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE')
      table.string('hash').notNullable()
      table.dateTime('created_at').notNullable()
      table.dateTime('updated_at').notNullable()
      table.dateTime('expires_at').notNullable()
    })
  }
  async down() {
    this.schema.dropTable('remember_me_tokens')
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class UsersTable extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('full_name').nullable()
      table.string('email').unique().notNullable()
      table.string('password').notNullable()

      table.string('role').defaultTo('user')
      table.boolean('is_active').defaultTo(true)

      table.string('remember_me_token').nullable()
      table.string('reset_token').nullable()
      table.timestamp('reset_token_expiry').nullable()

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fitting_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 120).notNullable()
      table.string('email', 254).notNullable()
      table.string('phone', 40).notNullable()
      table.string('service').notNullable()
      table.date('preferred_date').notNullable()
      table.string('occasion', 160).nullable()
      table.text('notes').notNullable()
      table.string('status').notNullable().defaultTo('pending')
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

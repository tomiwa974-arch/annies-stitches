import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ActivitiesTable extends BaseSchema {
  protected tableName = 'activities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id')
        .unsigned()
        .references('users.id')
        .onDelete('SET NULL')

      table.string('type').notNullable()
      table.string('entity_type').nullable()
      table.integer('entity_id').nullable()

      table.text('description').nullable()
      table.string('ip_address').nullable()

      table.timestamps(true, true)

      table.index(['type', 'entity_type', 'entity_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class StoreCategoriesTable extends BaseSchema {
  protected tableName = 'store_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable().unique()
      table.string('slug').notNullable().unique()

      table.integer('order').defaultTo(0)
      table.boolean('is_active').defaultTo(true)

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CategoriesTable extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable()
      table.string('slug').unique().notNullable()
      table.text('description').nullable()
      table.string('cover_image').nullable()

      table.integer('order').defaultTo(0)
      table.boolean('is_active').defaultTo(true)

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
  
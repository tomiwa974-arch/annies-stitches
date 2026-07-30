import { BaseSchema } from '@adonisjs/lucid/schema'

export default class WorksTable extends BaseSchema {
  protected tableName = 'works'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('category_id')
        .unsigned()
        .references('categories.id')
        .onDelete('CASCADE')

      table.string('title').notNullable()
      table.text('description').nullable()

      table.string('image_url').nullable()
      table.text('materials').nullable()

      table.decimal('price', 10, 2).nullable()

      table.boolean('is_featured').defaultTo(false)
      table.boolean('is_active').defaultTo(true)

      table.integer('sort_order').defaultTo(0)

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
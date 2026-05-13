import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('store_categories', (table) => {
      table.increments('id')
      table.string('name').notNullable().unique()
      table.string('slug').notNullable().unique()
      table.integer('order').defaultTo(0)
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTableIfExists('store_categories')
  }
}
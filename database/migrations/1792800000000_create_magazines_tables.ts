import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('magazines', (table) => {
      table.increments('id')
      table.string('title', 160).notNullable()
      table.string('issue_label', 80).notNullable().defaultTo('')
      table.text('description').nullable()
      table.string('cover_image').nullable()
      table.enum('status', ['draft', 'published']).notNullable().defaultTo('draft').index()
      table.timestamps(true, true)
    })
    this.schema.createTable('magazine_pages', (table) => {
      table.increments('id')
      table
        .integer('magazine_id')
        .unsigned()
        .notNullable()
        .references('magazines.id')
        .onDelete('CASCADE')
      table.enum('layout', ['paper', 'photo', 'mixed', 'dark']).notNullable().defaultTo('paper')
      table.string('kicker', 120).notNullable().defaultTo('')
      table.string('title', 200).notNullable().defaultTo('')
      table.text('body').nullable()
      table.string('image_url').nullable()
      table.string('image_alt', 250).notNullable().defaultTo('')
      table.integer('sort_order').unsigned().notNullable()
      table.index(['magazine_id', 'sort_order'])
      table.timestamps(true, true)
    })
  }
  async down() {
    this.schema.dropTable('magazine_pages')
    this.schema.dropTable('magazines')
  }
}

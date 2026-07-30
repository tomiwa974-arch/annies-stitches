import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CollectionsTable extends BaseSchema {
  protected tableName = 'collections'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('title').defaultTo("Annie's Stitches")
      table.text('bio').nullable()
      table.text('journey_text').nullable()

      table.integer('happy_clients').defaultTo(0)
      table.integer('years_experience').defaultTo(0)

      table.json('services').nullable()

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
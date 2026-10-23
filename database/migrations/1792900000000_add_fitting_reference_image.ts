import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('fitting_requests', (table) => {
      table.string('reference_image', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable('fitting_requests', (table) => {
      table.dropColumn('reference_image')
    })
  }
}

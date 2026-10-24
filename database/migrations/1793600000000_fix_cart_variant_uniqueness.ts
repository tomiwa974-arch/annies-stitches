import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('cart_items', (table) => {
      table.unique(['user_id', 'product_id', 'size', 'color'], 'cart_variant_unique')
    })
    this.schema.alterTable('cart_items', (table) =>
      table.dropUnique(['user_id', 'product_id', 'size'])
    )
  }
  async down() {
    this.schema.alterTable('cart_items', (table) => {
      table.unique(['user_id', 'product_id', 'size'])
    })
    this.schema.alterTable('cart_items', (table) =>
      table.dropUnique(['user_id', 'product_id', 'size', 'color'], 'cart_variant_unique')
    )
  }
}

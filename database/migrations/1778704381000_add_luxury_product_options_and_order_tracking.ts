import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class AddLuxuryProductOptionsAndOrderTracking extends BaseSchema {
  private async columnExists(tableName: string, columnName: string) {
    const result = await db.rawQuery(
      `select count(*) as total
       from information_schema.columns
       where table_schema = database()
         and table_name = ?
         and column_name = ?`,
      [tableName, columnName]
    )

    const row = Array.isArray(result[0]) ? result[0][0] : result[0]
    return Number(row?.total || 0) > 0
  }

  private async addColumnIfMissing(tableName: string, columnName: string, addColumn: () => void) {
    const exists = await this.columnExists(tableName, columnName)
    if (exists) return

    await this.schema.alterTable(tableName, (table) => {
      addColumn.call(table)
    })
  }

  private async dropColumnIfPresent(tableName: string, columnName: string) {
    const exists = await this.columnExists(tableName, columnName)
    if (!exists) return

    await this.schema.alterTable(tableName, (table) => {
      table.dropColumn(columnName)
    })
  }

  async up() {
    await this.addColumnIfMissing('products', 'color_variations', function (this: any) {
      this.json('color_variations').nullable()
    })
    await this.addColumnIfMissing('products', 'tailor_measurements', function (this: any) {
      this.json('tailor_measurements').nullable()
    })
    await this.addColumnIfMissing('products', 'allow_custom_tailoring', function (this: any) {
      this.boolean('allow_custom_tailoring').defaultTo(true)
    })

    await this.addColumnIfMissing('cart_items', 'color', function (this: any) {
      this.string('color').nullable()
    })
    await this.addColumnIfMissing('cart_items', 'tailor_measurements', function (this: any) {
      this.json('tailor_measurements').nullable()
    })
    await this.addColumnIfMissing('cart_items', 'is_custom_tailored', function (this: any) {
      this.boolean('is_custom_tailored').defaultTo(false)
    })

    await this.addColumnIfMissing('orders', 'tracking_stage', function (this: any) {
      this.enum('tracking_stage', ['received', 'packaged', 'shipped', 'delivered']).defaultTo('received')
    })
    await this.addColumnIfMissing('orders', 'received_at', function (this: any) {
      this.timestamp('received_at').nullable()
    })
    await this.addColumnIfMissing('orders', 'packaged_at', function (this: any) {
      this.timestamp('packaged_at').nullable()
    })
    await this.addColumnIfMissing('orders', 'shipped_at', function (this: any) {
      this.timestamp('shipped_at').nullable()
    })
    await this.addColumnIfMissing('orders', 'delivered_at', function (this: any) {
      this.timestamp('delivered_at').nullable()
    })

    await this.addColumnIfMissing('order_items', 'color', function (this: any) {
      this.string('color').nullable()
    })
    await this.addColumnIfMissing('order_items', 'tailor_measurements', function (this: any) {
      this.json('tailor_measurements').nullable()
    })
    await this.addColumnIfMissing('order_items', 'is_custom_tailored', function (this: any) {
      this.boolean('is_custom_tailored').defaultTo(false)
    })
  }

  async down() {
    await this.dropColumnIfPresent('order_items', 'color')
    await this.dropColumnIfPresent('order_items', 'tailor_measurements')
    await this.dropColumnIfPresent('order_items', 'is_custom_tailored')

    await this.dropColumnIfPresent('orders', 'tracking_stage')
    await this.dropColumnIfPresent('orders', 'received_at')
    await this.dropColumnIfPresent('orders', 'packaged_at')
    await this.dropColumnIfPresent('orders', 'shipped_at')
    await this.dropColumnIfPresent('orders', 'delivered_at')

    await this.dropColumnIfPresent('cart_items', 'color')
    await this.dropColumnIfPresent('cart_items', 'tailor_measurements')
    await this.dropColumnIfPresent('cart_items', 'is_custom_tailored')

    await this.dropColumnIfPresent('products', 'color_variations')
    await this.dropColumnIfPresent('products', 'tailor_measurements')
    await this.dropColumnIfPresent('products', 'allow_custom_tailoring')
  }
}

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

// ==================== USER MODEL ====================
export class User extends BaseModel {
  static table = 'users'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'full_name' })
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare password: string

  @column()
  declare role: string

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'remember_me_token' })
  declare rememberMeToken: string | null

  @column({ columnName: 'reset_token' })
  declare resetToken: string | null

  @column({ columnName: 'reset_token_expiry' })
  declare resetTokenExpiry: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}

// ==================== STORE CATEGORY MODEL ====================
export class StoreCategory extends BaseModel {
  static table = 'store_categories'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare order: number

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}

// ==================== PRODUCT IMAGE MODEL ====================
export class ProductImage extends BaseModel {
  static table = 'product_images'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'product_id' })
  declare productId: number

  @column({ columnName: 'image_url' })
  declare imageUrl: string

  @column({ columnName: 'sort_order' })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}

// ==================== CATEGORY MODEL ====================
export class Category extends BaseModel {
  static table = 'categories'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column({ columnName: 'cover_image' })
  declare coverImage: string | null

  @column()
  declare order: number

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @hasMany(() => Work)
  declare works: HasMany<typeof Work>

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>
}

// ==================== WORK MODEL ====================
export class Work extends BaseModel {
  static table = 'works'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'category_id' })
  declare categoryId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column()
  declare materials: any | null

  @column()
  declare price: number | null

  @column({ columnName: 'is_featured' })
  declare isFeatured: boolean

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'sort_order' })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>
}

// ==================== PRODUCT MODEL ====================
export class Product extends BaseModel {
  static table = 'products'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'category_id' })
  declare categoryId: number | null

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare price: number

  @column()
  declare size: string | null

  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column()
  declare stock: number

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'store_category' })
  declare storeCategory: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @hasMany(() => ProductImage)
  declare images: HasMany<typeof ProductImage>
}

// ==================== ORDER MODEL ====================
export class Order extends BaseModel {
  static table = 'orders'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'order_number' })
  declare orderNumber: string

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column({ columnName: 'customer_name' })
  declare customerName: string

  @column({ columnName: 'customer_email' })
  declare customerEmail: string

  @column({ columnName: 'customer_phone' })
  declare customerPhone: string | null

  @column({ columnName: 'shipping_address' })
  declare shippingAddress: string | null

  @column({ columnName: 'total_amount' })
  declare totalAmount: number

  @column()
  declare status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

  @column({ columnName: 'payment_status' })
  declare paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>
}

// ==================== ORDER ITEM MODEL ====================
export class OrderItem extends BaseModel {
  static table = 'order_items'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'order_id' })
  declare orderId: number

  @column({ columnName: 'product_id' })
  declare productId: number | null

  @column({ columnName: 'product_name' })
  declare productName: string

  @column()
  declare quantity: number

  @column()
  declare price: number

  @column()
  declare size: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}

// ==================== COLLECTION MODEL ====================
export class Collection extends BaseModel {
  static table = 'collections'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare bio: string | null

  @column({ columnName: 'journey_text' })
  declare journeyText: string | null

  @column({ columnName: 'happy_clients' })
  declare happyClients: number

  @column({ columnName: 'years_experience' })
  declare yearsExperience: number

  @column()
  declare services: any

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}

// ==================== ACTIVITY MODEL ====================
export class Activity extends BaseModel {
  static table = 'activities'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare type: string

  @column({ columnName: 'entity_type' })
  declare entityType: string | null

  @column({ columnName: 'entity_id' })
  declare entityId: number | null

  @column()
  declare description: string | null

  @column({ columnName: 'ip_address' })
  declare ipAddress: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
import vine from '@vinejs/vine'

export const categoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    description: vine.string().trim().maxLength(3000).nullable().optional(),
  })
)
export const storeCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    slug: vine.string().trim().maxLength(160).nullable().optional(),
  })
)
export const workValidator = vine.compile(
  vine.object({
    categoryId: vine.number().positive().withoutDecimals(),
    title: vine.string().trim().minLength(2).maxLength(200),
    description: vine.string().trim().maxLength(5000).nullable().optional(),
  })
)
export const productValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(200),
    description: vine.string().trim().maxLength(5000).nullable().optional(),
    price: vine.number().min(0).max(99999999.99).decimal([0, 2]),
    stock: vine.number().min(0).withoutDecimals(),
    size: vine.string().trim().maxLength(255).nullable().optional(),
    store_category: vine.string().trim().maxLength(120).nullable().optional(),
    allow_custom_tailoring: vine.boolean(),
  })
)
export const collectionValidator = vine.compile(
  vine.object({
    bio: vine.string().trim().maxLength(5000).nullable().optional(),
    journeyText: vine.string().trim().maxLength(10000).nullable().optional(),
  })
)
export const orderValidator = vine.compile(
  vine.object({
    paymentStatus: vine.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
    status: vine.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    trackingStage: vine.enum(['received', 'packaged', 'shipped', 'delivered']).optional(),
  })
)
export const userStatusValidator = vine.compile(
  vine.object({
    role: vine.enum(['user', 'admin']).optional(),
    isActive: vine.boolean().optional(),
  })
)
export const fittingStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'contacted', 'confirmed', 'completed', 'cancelled']),
  })
)

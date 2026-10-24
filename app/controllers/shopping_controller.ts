import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { User, Product, CartItem, WishlistItem } from '#models/index'

const mergeValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
    cart: vine
      .array(
        vine.object({
          id: vine.number().positive().withoutDecimals(),
          selectedSize: vine.string().maxLength(50).optional(),
          quantity: vine.number().min(1).max(100).withoutDecimals(),
          color: vine.string().maxLength(100).optional(),
          isCustomTailored: vine.boolean().optional(),
          tailorMeasurements: vine.record(vine.string().maxLength(100)).nullable().optional(),
        })
      )
      .maxLength(100),
    wishlist: vine.array(vine.number().positive().withoutDecimals()).maxLength(100),
  })
)

export default class ShoppingController {
  async merge(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(mergeValidator)
    await db.transaction(async (trx) => {
      await User.query({ client: trx }).where('id', ctx.auth.user!.id).forUpdate().firstOrFail()
      if (await trx.from('guest_list_merges').where('id', data.id).first()) return
      for (const item of data.cart) {
        const product = await Product.query({ client: trx })
          .where('id', item.id)
          .where('isActive', true)
          .first()
        if (!product) continue
        const existing = await CartItem.query({ client: trx })
          .where('userId', ctx.auth.user!.id)
          .where('productId', product.id)
          .where('size', item.selectedSize || '')
          .where('color', item.color || '')
          .first()
        if (existing) {
          existing.quantity = Math.min(100, existing.quantity + item.quantity)
          await existing.save()
        } else
          await CartItem.create(
            {
              userId: ctx.auth.user!.id,
              productId: product.id,
              size: item.selectedSize || '',
              color: item.color || '',
              quantity: item.quantity,
              isCustomTailored: !!item.isCustomTailored,
              tailorMeasurements: item.tailorMeasurements || null,
            },
            { client: trx }
          )
      }
      for (const id of new Set(data.wishlist)) {
        if (!(await Product.query({ client: trx }).where('id', id).where('isActive', true).first()))
          continue
        await WishlistItem.firstOrCreate(
          { userId: ctx.auth.user!.id, productId: id },
          {},
          { client: trx }
        )
      }
      await trx
        .table('guest_list_merges')
        .insert({ id: data.id, user_id: ctx.auth.user!.id, created_at: new Date() })
    })
    return ctx.response.json({ success: true })
  }
}

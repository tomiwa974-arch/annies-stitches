import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { deliveryValidator } from '#validators/delivery'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { User, Order } from '#models/index'
import { safeUser } from '#services/admin_data'
import { fieldError } from '#services/admin_uploads'
import { DateTime } from 'luxon'

const validator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(120),
    email: vine.string().trim().email().maxLength(254),
    currentPassword: vine.string().maxLength(200).nullable().optional(),
    newPassword: vine.string().minLength(8).maxLength(72).nullable().optional(),
    passwordConfirmation: vine.string().maxLength(72).nullable().optional(),
  })
)

export default class AccountController {
  async presence({ auth, response }: HttpContext) {
    await User.query()
      .where('id', auth.user!.id)
      .where('isActive', true)
      .update({ lastSeenAt: DateTime.now(), presenceOnline: true })
    return response.noContent()
  }
  async show({ auth, response }: HttpContext) {
    const user = auth.user!
    const admin = auth.defaultGuard === 'admin' && user.role === 'admin'
    const query = Order.query().orderBy('updatedAt', 'desc').limit(20)
    if (!admin) query.where('userId', user.id)
    const orders = await query
    const fittings = db.from('fitting_requests').orderBy('updated_at', 'desc').limit(20)
    if (!admin)
      fittings.where((query) =>
        query
          .where('user_id', user.id)
          .orWhere((legacy) => legacy.whereNull('user_id').where('email', user.email))
      )
    const requests = await fittings
    const notifications = [
      ...orders.map((order) => ({
        id: 'order-' + order.id,
        title: `${order.orderNumber}: ${order.status}`,
        body: `Delivery progress: ${order.trackingStage || 'received'}.`,
        date: order.updatedAt?.toISO(),
        href: admin ? '/admin/orders' : '/store?tracking=1',
      })),
      ...requests.map((fitting) => ({
        id: 'fitting-' + fitting.id,
        title: `${fitting.service}: ${fitting.status}`,
        body: admin
          ? `Request from ${fitting.name}`
          : 'The studio will contact you to confirm arrangements.',
        date: new Date(fitting.updated_at).toISOString(),
        href: admin ? '/admin/fittings' : '/custom',
      })),
    ]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 20)
    response.header('Cache-Control', 'private, no-store')
    return response.json({
      user: safeUser(user),
      notifications,
      deliveryAddress: user.deliveryAddress,
    })
  }
  async saveDelivery({ request, auth, response }: HttpContext) {
    const data = await request.validateUsing(deliveryValidator)
    await User.query()
      .where('id', auth.user!.id)
      .update({ deliveryAddress: JSON.stringify(data) })
    response.header('Cache-Control', 'private, no-store')
    return response.json({
      deliveryAddress: data,
      message: 'Delivery details saved to your profile.',
    })
  }
  async update(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(validator)
    const user = await User.findOrFail(ctx.auth.user!.id)
    const email = data.email.toLowerCase()
    if (email !== user.email.toLowerCase() || data.newPassword) {
      if (!data.currentPassword || !(await hash.verify(user.password, data.currentPassword)))
        fieldError(
          'currentPassword',
          'Enter your current password to change your email or password.'
        )
    }
    if (data.newPassword && data.newPassword !== data.passwordConfirmation)
      fieldError('passwordConfirmation', 'The new passwords do not match.')
    if (await User.query().where('email', email).whereNot('id', user.id).first())
      fieldError('email', 'This email address is already in use.')
    user.fullName = data.fullName
    user.email = email
    if (data.newPassword) {
      user.password = await hash.make(data.newPassword)
      user.resetToken = null
      user.resetTokenExpiry = null
      user.rememberMeToken = null
    }
    await db.transaction(async (trx) => {
      user.useTransaction(trx)
      await user.save()
      if (data.newPassword)
        await trx.from('remember_me_tokens').where('tokenable_id', user.id).delete()
    })
    return ctx.response.json({ user: safeUser(user), message: 'Account updated.' })
  }
}

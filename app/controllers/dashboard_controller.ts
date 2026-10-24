import type { HttpContext } from '@adonisjs/core/http'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'
import { DateTime } from 'luxon'
import {
  Category,
  Work,
  Product,
  ProductImage,
  StoreCategory,
  Collection,
  Order,
  User,
  Activity,
} from '#models/index'
import { adminData, orderData } from '#services/admin_data'
import { AdminUploads, fieldError } from '#services/admin_uploads'
import {
  categoryValidator,
  storeCategoryValidator,
  workValidator,
  productValidator,
  collectionValidator,
  orderValidator,
  userStatusValidator,
  fittingStatusValidator,
} from '#validators/admin'

export default class DashboardController {
  private async page(ctx: HttpContext, activeTab: string) {
    return ctx.inertia.render('dashboard/admin/index', { ...(await adminData()), activeTab })
  }
  index(ctx: HttpContext) {
    return this.page(ctx, 'dashboard')
  }
  collections(ctx: HttpContext) {
    return this.page(ctx, 'collections')
  }
  works(ctx: HttpContext) {
    return this.page(ctx, 'works')
  }
  store(ctx: HttpContext) {
    return this.page(ctx, 'store')
  }
  orders(ctx: HttpContext) {
    return this.page(ctx, 'orders')
  }
  activity(ctx: HttpContext) {
    return this.page(ctx, 'activity')
  }
  users(ctx: HttpContext) {
    return this.page(ctx, 'users')
  }
  fittings(ctx: HttpContext) {
    return this.page(ctx, 'fittings')
  }

  private async mutate(
    ctx: HttpContext,
    action: (uploads: AdminUploads, trx: TransactionClientContract) => Promise<void>
  ) {
    const uploads = new AdminUploads()
    try {
      await ctx.auth.check()
      await db.transaction((trx) => action(uploads, trx))
      ctx.session.flash('success', 'Changes saved.')
      return ctx.response.redirect().back()
    } catch (error) {
      await uploads.rollback()
      if (
        (error as { code?: string }).code === 'E_VALIDATION_ERROR' ||
        (error as { status?: number }).status === 404
      )
        throw error
      ctx.logger.error({ err: error }, 'Admin update failed')
      ctx.session.flashErrors({ form: 'The changes could not be saved. Please try again.' })
      return ctx.response.redirect().back()
    }
  }
  private audit(
    ctx: HttpContext,
    trx: TransactionClientContract,
    type: string,
    entityType: string,
    entityId: number,
    description: string
  ) {
    return Activity.create(
      {
        userId: ctx.auth.user?.id || null,
        type,
        entityType,
        entityId,
        description,
        ipAddress: ctx.request.ip(),
      },
      { client: trx }
    )
  }
  private slug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
  private async unique(
    trx: TransactionClientContract,
    table: string,
    column: string,
    value: string,
    id?: number
  ) {
    const query = trx.from(table).where(column, value)
    if (id) query.whereNot('id', id)
    if (await query.first()) fieldError('name', 'An entry with this name or slug already exists.')
  }
  async storeCategory(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(categoryValidator)
    return this.mutate(ctx, async (uploads, trx) => {
      const slug = this.slug(data.name)
      if (!slug) fieldError('name', 'Include a letter or number in the category name.')
      await this.unique(trx, 'categories', 'slug', slug)
      const count = await Category.query({ client: trx }).count('* as total')
      const category = await Category.create(
        {
          ...data,
          description: data.description || '',
          slug,
          order: Number(count[0].$extras.total),
          isActive: true,
          coverImage: await uploads.image(ctx, 'cover_image', 'categories'),
        },
        { client: trx }
      )
      await this.audit(
        ctx,
        trx,
        'admin_create',
        'category',
        category.id,
        `Created collection ${category.name}`
      )
    })
  }
  async updateCategory(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(categoryValidator)
    return this.mutate(ctx, async (uploads, trx) => {
      const category = await Category.findOrFail(ctx.params.id, { client: trx })
      category.merge({
        name: data.name,
        description: data.description || '',
        coverImage: await uploads.image(ctx, 'cover_image', 'categories', category.coverImage),
      })
      await category.save()
      await this.audit(
        ctx,
        trx,
        'admin_update',
        'category',
        category.id,
        `Updated collection ${category.name}`
      )
    })
  }
  async deleteCategory(ctx: HttpContext) {
    return this.mutate(ctx, async (_, trx) => {
      const category = await Category.findOrFail(ctx.params.id, { client: trx })
      await category.delete()
      await this.audit(
        ctx,
        trx,
        'admin_delete',
        'category',
        category.id,
        `Deleted collection ${category.name}`
      )
    })
  }
  async getStoreCategories({ response }: HttpContext) {
    return response.json(await StoreCategory.query().where('isActive', true).orderBy('order'))
  }
  async storeStoreCategory(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(storeCategoryValidator)
    return this.mutate(ctx, async (_, trx) => {
      const slug = this.slug(data.slug || data.name)
      if (!slug) fieldError('slug', 'Enter a valid category slug.')
      await this.unique(trx, 'store_categories', 'slug', slug)
      await this.unique(trx, 'store_categories', 'name', data.name)
      const count = await StoreCategory.query({ client: trx }).count('* as total')
      const category = await StoreCategory.create(
        { name: data.name, slug, order: Number(count[0].$extras.total), isActive: true },
        { client: trx }
      )
      await this.audit(
        ctx,
        trx,
        'admin_create',
        'store_category',
        category.id,
        `Created store category ${category.name}`
      )
    })
  }
  async updateStoreCategory(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(storeCategoryValidator)
    return this.mutate(ctx, async (_, trx) => {
      const category = await StoreCategory.findOrFail(ctx.params.id, { client: trx })
      const slug = this.slug(data.slug || data.name)
      if (!slug) fieldError('slug', 'Enter a valid category slug.')
      await this.unique(trx, 'store_categories', 'slug', slug, category.id)
      await this.unique(trx, 'store_categories', 'name', data.name, category.id)
      await Product.query({ client: trx })
        .where('storeCategory', category.name)
        .update({ storeCategory: data.name })
      category.merge({ name: data.name, slug })
      await category.save()
      await this.audit(
        ctx,
        trx,
        'admin_update',
        'store_category',
        category.id,
        `Updated store category ${category.name}`
      )
    })
  }
  async deleteStoreCategory(ctx: HttpContext) {
    return this.mutate(ctx, async (_, trx) => {
      const category = await StoreCategory.findOrFail(ctx.params.id, { client: trx })
      await Product.query({ client: trx })
        .where('storeCategory', category.name)
        .update({ storeCategory: null })
      await category.delete()
      await this.audit(
        ctx,
        trx,
        'admin_delete',
        'store_category',
        category.id,
        `Deleted store category ${category.name}`
      )
    })
  }
  async updateCollection(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(collectionValidator)
    return this.mutate(ctx, async (_, trx) => {
      let collection = await Collection.query({ client: trx }).first()
      if (!collection) collection = new Collection().useTransaction(trx)
      collection.merge({ bio: data.bio || '', journeyText: data.journeyText || '' })
      await collection.save()
      await this.audit(
        ctx,
        trx,
        'admin_update',
        'collection',
        collection.id,
        'Updated collection page content'
      )
    })
  }
  async storeWork(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(workValidator)
    return this.mutate(ctx, async (uploads, trx) => {
      if (!(await Category.find(data.categoryId, { client: trx })))
        fieldError('categoryId', 'Choose an existing collection.')
      const work = await Work.create(
        {
          ...data,
          description: data.description || '',
          isActive: true,
          imageUrl: await uploads.image(ctx, 'imageUrl', 'works'),
        },
        { client: trx }
      )
      await this.audit(ctx, trx, 'admin_create', 'work', work.id, `Published work ${work.title}`)
    })
  }
  async updateWork(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(workValidator)
    return this.mutate(ctx, async (uploads, trx) => {
      if (!(await Category.find(data.categoryId, { client: trx })))
        fieldError('categoryId', 'Choose an existing collection.')
      const work = await Work.findOrFail(ctx.params.id, { client: trx })
      work.merge({
        ...data,
        description: data.description || '',
        imageUrl: await uploads.image(ctx, 'imageUrl', 'works', work.imageUrl),
      })
      await work.save()
      await this.audit(ctx, trx, 'admin_update', 'work', work.id, `Updated work ${work.title}`)
    })
  }
  async deleteWork(ctx: HttpContext) {
    return this.mutate(ctx, async (_, trx) => {
      const work = await Work.findOrFail(ctx.params.id, { client: trx })
      await work.delete()
      await this.audit(ctx, trx, 'admin_delete', 'work', work.id, `Deleted work ${work.title}`)
    })
  }
  private jsonArray(ctx: HttpContext, field: string, fallback: unknown[]) {
    const value = ctx.request.input(field)
    if (value === undefined || value === null || value === '') return fallback
    try {
      const result = typeof value === 'string' ? JSON.parse(value) : value
      if (!Array.isArray(result)) throw new Error()
      if (
        field === 'tailor_measurements' &&
        !result.every((item) => typeof item === 'string' && item.length <= 80)
      )
        throw new Error()
      if (
        field === 'color_variations' &&
        !result.every((item) => item && typeof item === 'object' && typeof item.name === 'string')
      )
        throw new Error()
      return result
    } catch {
      fieldError(field, 'Enter a valid JSON list with the expected fields.')
    }
  }
  async storeProduct(ctx: HttpContext) {
    return this.saveProduct(ctx)
  }
  async updateProduct(ctx: HttpContext) {
    return this.saveProduct(ctx, true)
  }
  private async saveProduct(ctx: HttpContext, editing = false) {
    const data = await ctx.request.validateUsing(productValidator)
    const colors = this.jsonArray(ctx, 'color_variations', [])
    const measurements = this.jsonArray(ctx, 'tailor_measurements', [])
    return this.mutate(ctx, async (uploads, trx) => {
      if (
        data.store_category &&
        !(await StoreCategory.query({ client: trx }).where('name', data.store_category).first())
      )
        fieldError('store_category', 'Choose an existing store category.')
      const product = editing
        ? await Product.findOrFail(ctx.params.id, { client: trx })
        : new Product().useTransaction(trx)
      product.merge({
        name: data.name,
        description: data.description || '',
        price: data.price,
        stock: data.stock,
        size: data.size || '',
        storeCategory: data.store_category || null,
        allowCustomTailoring: data.allow_custom_tailoring,
        colorVariations: JSON.stringify(colors),
        tailorMeasurements: JSON.stringify(measurements),
        imageUrl: await uploads.image(ctx, 'imageUrl', 'products', product.imageUrl || null),
        isActive: product.isActive ?? true,
      })
      await product.save()
      const removed = this.jsonArray(ctx, 'removed_images', [])
      if (removed.some((id) => !Number.isInteger(id) || Number(id) < 1))
        fieldError('removed_images', 'Invalid gallery photo selection.')
      if (removed.length)
        await ProductImage.query({ client: trx })
          .where('productId', product.id)
          .whereIn('id', removed as number[])
          .delete()
      const existingImages = await ProductImage.query({ client: trx })
        .where('productId', product.id)
        .orderBy('sortOrder')
      const gallery = await uploads.images(ctx, 'galleryImages', 'products')
      if (existingImages.length + gallery.length > 2)
        fieldError('galleryImages', 'Keep up to 2 additional photos per product.')
      let sortOrder = (existingImages.at(-1)?.sortOrder ?? -1) + 1
      for (const imageUrl of gallery)
        await ProductImage.create(
          { productId: product.id, imageUrl, sortOrder: sortOrder++ },
          { client: trx }
        )
      await this.audit(
        ctx,
        trx,
        editing ? 'admin_update' : 'admin_create',
        'product',
        product.id,
        `${editing ? 'Updated' : 'Created'} product ${product.name}`
      )
    })
  }
  async deleteProduct(ctx: HttpContext) {
    return this.mutate(ctx, async (_, trx) => {
      const product = await Product.findOrFail(ctx.params.id, { client: trx })
      await ProductImage.query({ client: trx }).where('productId', product.id).delete()
      await product.delete()
      await this.audit(
        ctx,
        trx,
        'admin_delete',
        'product',
        product.id,
        `Deleted product ${product.name}`
      )
    })
  }
  async deleteProductImage(ctx: HttpContext) {
    return this.mutate(ctx, async (_, trx) => {
      const image = await ProductImage.findOrFail(ctx.params.id, { client: trx })
      await image.delete()
      await this.audit(
        ctx,
        trx,
        'admin_update',
        'product',
        image.productId,
        'Removed a product gallery image'
      )
    })
  }
  async updateOrderStatus(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(orderValidator)
    return this.mutate(ctx, async (_, trx) => {
      const order = await Order.query({ client: trx })
        .where('id', ctx.params.id)
        .forUpdate()
        .firstOrFail()
      let status = data.status || order.status
      let stage = data.trackingStage || order.trackingStage || 'received'
      const changedStatus = data.status && data.status !== order.status
      const changedStage = data.trackingStage && data.trackingStage !== order.trackingStage
      if (changedStage)
        status =
          stage === 'delivered'
            ? 'delivered'
            : stage === 'shipped'
              ? 'shipped'
              : stage === 'packaged'
                ? 'processing'
                : 'pending'
      else if (changedStatus && status !== 'cancelled')
        stage = status === 'delivered' ? 'delivered' : status === 'shipped' ? 'shipped' : 'received'
      if ((status === 'cancelled') !== (order.status === 'cancelled')) {
        await order.load('items')
        for (const item of [...order.items].sort(
          (a, b) => (a.productId || 0) - (b.productId || 0)
        )) {
          if (!item.productId) continue
          const product = await Product.query({ client: trx })
            .where('id', item.productId)
            .forUpdate()
            .first()
          if (!product) continue
          if (status !== 'cancelled' && product.stock < item.quantity)
            fieldError('status', `Not enough stock to reopen this order: ${product.name}.`)
          product.stock += status === 'cancelled' ? item.quantity : -item.quantity
          await product.save()
        }
      }
      order.status = status
      if (data.paymentStatus) order.paymentStatus = data.paymentStatus
      order.trackingStage = stage
      const now = DateTime.now()
      if (!order.receivedAt) order.receivedAt = now
      if (['packaged', 'shipped', 'delivered'].includes(stage) && !order.packagedAt)
        order.packagedAt = now
      if (['shipped', 'delivered'].includes(stage) && !order.shippedAt) order.shippedAt = now
      if (stage === 'delivered' && !order.deliveredAt) order.deliveredAt = now
      if (stage !== 'delivered') order.deliveredAt = null
      if (!['shipped', 'delivered'].includes(stage)) order.shippedAt = null
      if (stage === 'received') order.packagedAt = null
      await order.save()
      await this.audit(
        ctx,
        trx,
        'order_update',
        'order',
        order.id,
        `Order ${order.orderNumber}: ${status}, ${stage}`
      )
    })
  }
  async getOrderDetails({ params, response }: HttpContext) {
    const order = await Order.query()
      .where('id', params.id)
      .preload('user')
      .preload('items')
      .firstOrFail()
    return response.json(orderData(order))
  }
  async updateUserStatus(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(userStatusValidator)
    return this.mutate(ctx, async (_, trx) => {
      const user = await User.findOrFail(ctx.params.id, { client: trx })
      const removingAdmin =
        user.role === 'admin' && (data.role === 'user' || data.isActive === false)
      if ((data.isActive === false || data.role === 'user') && user.id === ctx.auth.user?.id)
        fieldError('form', 'You cannot deactivate or demote your own account.')
      if (removingAdmin) {
        const admins = await User.query({ client: trx })
          .where('role', 'admin')
          .where('isActive', true)
          .forUpdate()
        if (admins.length <= 1 && user.isActive)
          fieldError('form', 'Keep at least one active administrator.')
      }
      user.merge(data)
      if (data.isActive === false) {
        user.presenceOnline = false
        await trx.from('remember_me_tokens').where('tokenable_id', user.id).delete()
      }
      await user.save()
      await this.audit(
        ctx,
        trx,
        'admin_update',
        'user',
        user.id,
        `Updated account ${user.fullName || user.email}`
      )
    })
  }
  async deleteUser(ctx: HttpContext) {
    return this.mutate(ctx, async (_, trx) => {
      const user = await User.findOrFail(ctx.params.id, { client: trx })
      if (user.id === ctx.auth.user?.id) fieldError('form', 'You cannot delete your own account.')
      if (user.role === 'admin' && user.isActive) {
        const admins = await User.query({ client: trx })
          .where('role', 'admin')
          .where('isActive', true)
          .forUpdate()
        if (admins.length <= 1) fieldError('form', 'Keep at least one active administrator.')
      }
      await user.delete()
      await this.audit(
        ctx,
        trx,
        'admin_delete',
        'user',
        user.id,
        `Deleted account ${user.fullName || user.email}`
      )
    })
  }
  async updateFitting(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(fittingStatusValidator)
    return this.mutate(ctx, async (_, trx) => {
      const fitting = await trx.from('fitting_requests').where('id', ctx.params.id).firstOrFail()
      await trx
        .from('fitting_requests')
        .where('id', fitting.id)
        .update({ status: data.status, updated_at: new Date() })
      await this.audit(
        ctx,
        trx,
        'fitting_update',
        'fitting',
        fitting.id,
        `Fitting for ${fitting.name}: ${data.status}`
      )
    })
  }
  async fittingReference(ctx: HttpContext) {
    if (!(await ctx.auth.check()) || !ctx.auth.user?.isActive || ctx.auth.user.role !== 'admin')
      return ctx.response.unauthorized({
        error: 'Sign in as an administrator to view private references.',
      })
    const fitting = await db.from('fitting_requests').where('id', ctx.params.id).firstOrFail()
    if (!fitting.reference_image || !/^[a-f0-9-]+\.(png|jpe?g|webp)$/.test(fitting.reference_image))
      return ctx.response.notFound()
    ctx.response.header('Cache-Control', 'private, no-store')
    return ctx.response.download(
      app.makePath('storage/fitting-references', fitting.reference_image)
    )
  }
  async stats({ response }: HttpContext) {
    return response.json((await adminData()).stats)
  }
  async recentActivity({ response }: HttpContext) {
    return response.json((await adminData()).recentActivity)
  }
  async popularProducts({ response }: HttpContext) {
    return response.json((await adminData()).stats.popularProducts)
  }
}

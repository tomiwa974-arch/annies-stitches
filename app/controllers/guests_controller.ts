import { deliveryValidator } from '#validators/delivery'
import type { HttpContext } from '@adonisjs/core/http'
import {
  Product,
  Category,
  Work,
  Collection,
  CartItem,
  WishlistItem,
  User,
  Order,
  OrderItem,
  Activity,
} from '#models/index'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import { fieldError } from '#services/admin_uploads'

export default class GuestsController {
  private defaultStoreProducts() {
    return []
  }

  private defaultCollection() {
    return {
      id: 0,
      title: "Annie's Stitches",
      bio: '',
      journeyText: '',
      happyClients: 0,
      yearsExperience: 0,
      services: [
        'CUSTOM TAILORING',
        'CORSET & STATEMENT DRESSES',
        'READY-TO-WEAR',
        'TRADITIONAL WEAR (ASO-EBI & ANKARA)',
        'MENS CASUAL WEAR',
        "MEN'S TRADITIONAL WEAR",
      ],
    }
  }

  private serializeCartItem(item: CartItem) {
    return {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      category: item.product.storeCategory || '',
      selectedSize: item.size || '',
      quantity: item.quantity,
      imageUrl: item.product.imageUrl,
      color: item.color || '',
      tailorMeasurements: item.tailorMeasurements || null,
      isCustomTailored: item.isCustomTailored || false,
    }
  }

  private serializeWishlistItem(item: WishlistItem) {
    return item.product.serialize()
  }

  // ============ PAGE RENDERING ============

  async show({ params, inertia, auth, request }: HttpContext) {
    const slug = params.slug as string

    try {
      const category = await Category.findBy('slug', slug)

      if (!category) {
        return inertia.render('guests/product', {
          category: null,
          works: [],
          error: 'Category not found',
        })
      }

      const works = await Work.query()
        .where('categoryId', category.id)
        .where('isActive', true)
        .preload('category')
        .orderBy('createdAt', 'desc')

      await auth.check()
      await Activity.create({
        userId: auth.user?.id || null,
        type: 'view',
        entityType: 'category',
        entityId: category.id,
        description: 'Viewed collection ' + category.name,
        ipAddress: request.ip(),
      })
      return inertia.render('guests/product', {
        category: category.serialize(),
        works: works.map((w) => w.serialize()),
        isEmpty: works.length === 0,
      })
    } catch (error) {
      console.error('Error fetching category:', error)
      return inertia.render('guests/product', {
        category: null,
        works: [],
        error: true,
      })
    }
  }

  async store({ inertia, auth, request }: HttpContext) {
    try {
      // Get all active products
      const products = await Product.query()
        .preload('images')
        .where('isActive', true)
        .orderBy('createdAt', 'desc')

      console.log('✅ Store route hit! Found', products.length, 'products')

      await auth.check()
      await Activity.create({
        userId: auth.user?.id || null,
        type: 'view',
        entityType: 'store',
        entityId: null,
        description: 'Visited the store',
        ipAddress: request.ip(),
      })
      const storeProducts = products.map((p) => p.toJSON())

      return inertia.render('guests/store', {
        products: storeProducts.length > 0 ? storeProducts : this.defaultStoreProducts(),
        isEmpty: false,
      })
    } catch (error) {
      console.error('Error fetching products:', error)
      return inertia.render('guests/store', {
        products: this.defaultStoreProducts(),
        isEmpty: false,
        error: true,
      })
    }
  }

  // ============ API ROUTES FOR FRONTEND ============

  async getCollection({ response }: HttpContext) {
    try {
      const collection = await Collection.first()
      return response.json(collection || this.defaultCollection())
    } catch (error) {
      console.error('Error fetching collection:', error)
      return response.json(this.defaultCollection())
    }
  }

  async getCategories({ response }: HttpContext) {
    try {
      const categories = await Category.query().where('isActive', true).orderBy('order')
      return response.json(categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      return response.json([])
    }
  }

  async getWorks({ response }: HttpContext) {
    try {
      const works = await Work.query()
        .where('isActive', true)
        .preload('category')
        .orderBy('createdAt', 'desc')
      return response.json(works)
    } catch (error) {
      console.error('Error fetching works:', error)
      return response.status(500).json({ error: 'Failed to fetch works' })
    }
  }

  async getWorksByCategory({ params, response }: HttpContext) {
    try {
      const works = await Work.query()
        .where('categoryId', params.categoryId)
        .where('isActive', true)
        .preload('category')
        .orderBy('createdAt', 'desc')
      return response.json(works)
    } catch (error) {
      console.error('Error fetching works by category:', error)
      return response.status(500).json({ error: 'Failed to fetch works' })
    }
  }

  async getProducts({ response }: HttpContext) {
    try {
      const products = await Product.query()
        .preload('images')
        .where('isActive', true)
        .orderBy('createdAt', 'desc')
      return response.json(products.length > 0 ? products : this.defaultStoreProducts())
    } catch (error) {
      console.error('Error fetching products:', error)
      return response.json(this.defaultStoreProducts())
    }
  }

  // ============ CART & WISHLIST METHODS (Protected) ============

  async addToCart({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const {
        productId,
        size,
        quantity = 1,
        color = '',
        tailorMeasurements = null,
        isCustomTailored = false,
      } = request.all()
      const normalizedQuantity = Number(quantity)
      if (
        !Number.isInteger(normalizedQuantity) ||
        normalizedQuantity < 1 ||
        normalizedQuantity > 100
      )
        return response.badRequest({ error: 'Choose a quantity between 1 and 100.' })

      if (!productId) {
        return response.status(400).json({ error: 'Product ID is required' })
      }

      const product = await Product.find(productId)
      if (!product || !product.isActive) {
        return response.status(404).json({ error: 'Product not found' })
      }

      const cartItem = await CartItem.query()
        .where('userId', user.id)
        .where('productId', product.id)
        .where('size', size || '')
        .where('color', color || '')
        .first()

      if (product.stock < normalizedQuantity + (cartItem?.quantity || 0))
        return response.badRequest({ error: 'Not enough stock is available.' })
      if (cartItem) {
        cartItem.quantity += normalizedQuantity
        await cartItem.save()
      } else {
        await CartItem.create({
          userId: user.id,
          productId: product.id,
          size: size || '',
          color: color || '',
          tailorMeasurements: tailorMeasurements || null,
          isCustomTailored: !!isCustomTailored,
          quantity: normalizedQuantity,
        })
      }

      await Activity.create({
        userId: user.id,
        type: 'cart',
        entityType: 'product',
        entityId: product.id,
        description: 'Added ' + product.name + ' to cart',
      })
      const cart = await CartItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')

      return response.json({
        success: true,
        message: 'Added to cart',
        cart: cart.map((item) => this.serializeCartItem(item)),
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to add items to cart' })
    }
  }

  async getCart({ response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User

      const cart = await CartItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')

      return response.json({
        success: true,
        cart: cart.map((item) => this.serializeCartItem(item)),
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to view cart' })
    }
  }

  async updateCartItem({ params, request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const { size, quantity, color = '' } = request.all()
      const normalizedQuantity = Number(quantity)

      if (!Number.isInteger(normalizedQuantity) || normalizedQuantity > 100) {
        return response.status(400).json({ error: 'Quantity is required' })
      }

      const cartItem = await CartItem.query()
        .where('userId', user.id)
        .where('productId', params.id)
        .where('size', size || '')
        .where('color', color || '')
        .first()

      if (!cartItem) {
        return response.status(404).json({ error: 'Cart item not found' })
      }

      if (normalizedQuantity < 1) {
        await cartItem.delete()
      } else {
        const product = await Product.findOrFail(cartItem.productId)
        if (product.stock < normalizedQuantity)
          return response.badRequest({ error: 'Not enough stock is available.' })
        cartItem.quantity = normalizedQuantity
        await cartItem.save()
      }

      const cart = await CartItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')

      return response.json({
        success: true,
        cart: cart.map((item) => this.serializeCartItem(item)),
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to modify cart' })
    }
  }

  async addToWishlist({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const { productId } = request.all()

      if (!productId) {
        return response.status(400).json({ error: 'Product ID is required' })
      }

      const product = await Product.find(productId)
      if (!product) {
        return response.status(404).json({ error: 'Product not found' })
      }

      const existing = await WishlistItem.query()
        .where('userId', user.id)
        .where('productId', product.id)
        .first()

      if (existing) {
        await existing.delete()
      } else {
        await WishlistItem.create({
          userId: user.id,
          productId: product.id,
        })
      }

      await Activity.create({
        userId: user.id,
        type: 'wishlist',
        entityType: 'product',
        entityId: product.id,
        description:
          (existing ? 'Removed ' : 'Saved ') +
          product.name +
          (existing ? ' from wishlist' : ' to wishlist'),
      })
      const wishlist = await WishlistItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')

      return response.json({
        success: true,
        message: existing ? 'Removed from wishlist' : 'Added to wishlist',
        wishlist: wishlist.map((item) => this.serializeWishlistItem(item)),
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to add items to wishlist' })
    }
  }

  async getWishlist({ response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User

      const wishlist = await WishlistItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')

      return response.json({
        success: true,
        wishlist: wishlist.map((item) => this.serializeWishlistItem(item)),
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to view wishlist' })
    }
  }

  async removeFromCart({ params, request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const { id } = params
      const { size, color = '' } = request.all()

      const cartItem = await CartItem.query()
        .where('userId', user.id)
        .where('productId', id)
        .where('size', size || '')
        .where('color', color || '')
        .first()

      if (cartItem) {
        await cartItem.delete()
      }

      const cart = await CartItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')

      return response.json({
        success: true,
        message: 'Removed from cart',
        cart: cart.map((item) => this.serializeCartItem(item)),
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to modify cart' })
    }
  }

  async removeFromWishlist({ params, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const { id } = params

      await WishlistItem.query().where('userId', user.id).where('productId', id).delete()

      const wishlist = await WishlistItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')

      return response.json({
        success: true,
        message: 'Removed from wishlist',
        wishlist: wishlist.map((item) => this.serializeWishlistItem(item)),
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to modify wishlist' })
    }
  }

  async createOrder({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const items = request.input('items')
    if (!Array.isArray(items) || !items.length || items.length > 100)
      return response.badRequest({ error: 'Choose between 1 and 100 items.' })
    const idempotencyKey = String(request.header('Idempotency-Key') || '')
    if (idempotencyKey && !/^[a-zA-Z0-9-]{8,100}$/.test(idempotencyKey))
      return response.badRequest({ error: 'Invalid checkout identifier.' })
    const customerName = String(request.input('customerName') || user.fullName || 'Customer')
      .trim()
      .slice(0, 120)
    const customerEmail = String(request.input('customerEmail') || user.email).trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
      return response.badRequest({ error: 'Enter a valid contact email.' })
    try {
      const order = await db.transaction(async (trx) => {
        const lockedUser = await User.query({ client: trx })
          .where('id', user.id)
          .forUpdate()
          .firstOrFail()
        if (!lockedUser.isActive) fieldError('items', 'This account is inactive.')
        if (idempotencyKey) {
          const existing = await trx
            .from('order_submissions')
            .where({ user_id: user.id, submission_key: idempotencyKey })
            .first()
          if (existing) return Order.findOrFail(existing.order_id, { client: trx })
        }
        const delivery = await deliveryValidator.validate(
          request.input('deliveryAddress') || lockedUser.deliveryAddress || {}
        )
        const shippingAddress = [
          delivery.recipient,
          delivery.address,
          delivery.addressExtra,
          delivery.city,
          delivery.state,
          delivery.postalCode,
          delivery.country,
        ]
          .filter(Boolean)
          .join('\n')
        const ids = items.map((item) => Number(item.id || item.productId))
        if (!ids.every((id) => Number.isSafeInteger(id) && id > 0))
          fieldError('items', 'Choose valid products.')
        const products = await Product.query({ client: trx })
          .whereIn(
            'id',
            [...new Set(ids)].sort((a, b) => a - b)
          )
          .forUpdate()
        const totals = new Map<number, number>()
        for (const [index, item] of items.entries()) {
          const quantity = Number(item.quantity)
          if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100)
            fieldError('items', 'Choose quantities between 1 and 100.')
          totals.set(ids[index], (totals.get(ids[index]) || 0) + quantity)
        }
        for (const [id, quantity] of totals) {
          const product = products.find((p) => p.id === id)
          if (!product || !product.isActive)
            fieldError('items', 'One of the products is no longer available.')
          if (product.stock < quantity)
            fieldError('items', 'Not enough stock for ' + product.name + '.')
        }
        const total = items.reduce(
          (sum, item, index) =>
            sum + Number(products.find((p) => p.id === ids[index])!.price) * Number(item.quantity),
          0
        )
        const order = await Order.create(
          {
            orderNumber: 'AS-' + randomUUID(),
            userId: user.id,
            customerName,
            customerEmail,
            customerPhone: delivery.phone,
            shippingAddress,
            totalAmount: Math.round(total * 100) / 100,
            status: 'pending',
            trackingStage: 'received',
            paymentStatus: 'pending',
            receivedAt: DateTime.now(),
          },
          { client: trx }
        )
        for (const [index, item] of items.entries()) {
          const product = products.find((p) => p.id === ids[index])!
          await OrderItem.create(
            {
              orderId: order.id,
              productId: product.id,
              productName: product.name,
              quantity: Number(item.quantity),
              price: Number(product.price),
              size: String(item.selectedSize || item.size || '').slice(0, 100) || null,
              color: String(item.color || '').slice(0, 100) || null,
              tailorMeasurements: item.tailorMeasurements
                ? JSON.stringify(item.tailorMeasurements).slice(0, 3000)
                : null,
              isCustomTailored: Boolean(item.isCustomTailored) && product.allowCustomTailoring,
            },
            { client: trx }
          )
        }
        for (const product of products) {
          product.stock -= totals.get(product.id) || 0
          await product.save()
        }
        if (idempotencyKey)
          await trx.table('order_submissions').insert({
            user_id: user.id,
            submission_key: idempotencyKey.slice(0, 100),
            order_id: order.id,
          })
        await CartItem.query({ client: trx }).where('userId', user.id).delete()
        await Activity.create(
          {
            userId: user.id,
            type: 'order',
            entityType: 'order',
            entityId: order.id,
            description: 'Placed order ' + order.orderNumber,
          },
          { client: trx }
        )
        return order
      })
      await order.load('items')
      return response.json({ success: true, order: this.serializeOrder(order), cart: [] })
    } catch (error) {
      if ((error as { code?: string }).code === 'E_VALIDATION_ERROR') throw error
      console.error('Checkout failed', error)
      return response.status(500).json({ error: 'The order could not be saved. Please try again.' })
    }
  }

  async getMyOrders({ response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const orders = await Order.query()
        .where('userId', user.id)
        .preload('items')
        .orderBy('createdAt', 'desc')

      return response.json({ orders: orders.map((order) => this.serializeOrder(order)) })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to view orders' })
    }
  }

  private serializeOrder(order: Order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      status: order.status,
      trackingStage: order.trackingStage || 'received',
      createdAt: order.createdAt ? order.createdAt.toFormat('yyyy-MM-dd') : 'Today',
      stages: {
        receivedAt: order.receivedAt?.toFormat('yyyy-MM-dd HH:mm') || null,
        packagedAt: order.packagedAt?.toFormat('yyyy-MM-dd HH:mm') || null,
        shippedAt: order.shippedAt?.toFormat('yyyy-MM-dd HH:mm') || null,
        deliveredAt: order.deliveredAt?.toFormat('yyyy-MM-dd HH:mm') || null,
      },
      items:
        order.items?.map((item) => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
          tailorMeasurements: item.tailorMeasurements,
          isCustomTailored: item.isCustomTailored,
        })) || [],
    }
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { Product, Category, Work, Collection, CartItem, WishlistItem, User, Order, OrderItem } from '#models/index'
import { DateTime } from 'luxon'

export default class GuestsController {
  private defaultStoreProducts() {
    return [
      {
        id: 1001,
        name: 'Pearl Corset Dress',
        description: 'Structured occasion dress with a clean corset finish.',
        price: 185,
        size: 'S, M, L',
        stock: 6,
        storeCategory: 'Ready-to-wear',
        imageUrl: '/uploads/products/1778713858824-ChatGPT Image May 13, 2026, 02_52_52 PM.png',
        colorVariations: [
          { name: 'Ivory', hex: '#f8f3ea', imageUrl: '/uploads/products/1778713858824-ChatGPT Image May 13, 2026, 02_52_52 PM.png' },
          { name: 'Onyx', hex: '#111111', imageUrl: '/uploads/products/1778713858824-ChatGPT Image May 13, 2026, 02_52_52 PM.png' },
        ],
        allowCustomTailoring: true,
        tailorMeasurements: ['chest', 'waist', 'hips', 'length'],
        isActive: true,
        createdAt: '2026-06-02',
      },
      {
        id: 1002,
        name: 'Ankara Wrap Set',
        description: 'Two-piece wrap set cut for everyday polish.',
        price: 140,
        size: 'S, M, L, XL',
        stock: 9,
        storeCategory: 'Ankara',
        imageUrl: '/uploads/products/1775669593421-Chic and Trendy Summer Fashion Outfit for Black Women 2025 – Style Tips and Looks.jfif',
        colorVariations: [
          { name: 'Coral', hex: '#c85b4b', imageUrl: '/uploads/products/1775669593421-Chic and Trendy Summer Fashion Outfit for Black Women 2025 – Style Tips and Looks.jfif' },
          { name: 'Gold', hex: '#c7a14a', imageUrl: '/uploads/products/1775669593421-Chic and Trendy Summer Fashion Outfit for Black Women 2025 – Style Tips and Looks.jfif' },
        ],
        allowCustomTailoring: true,
        tailorMeasurements: ['bust', 'waist', 'hips', 'top length', 'skirt length'],
        isActive: true,
        createdAt: '2026-06-01',
      },
      {
        id: 1003,
        name: 'Evening Satin Gown',
        description: 'Soft satin gown with a tailored bodice.',
        price: 230,
        size: 'M, L',
        stock: 4,
        storeCategory: 'Evening',
        imageUrl: '/uploads/products/1775500252676-7c4850f4-9eae-4eb2-90d0-7a37279dd6a5.jfif',
        colorVariations: [
          { name: 'Champagne', hex: '#d8c2a0', imageUrl: '/uploads/products/1775500252676-7c4850f4-9eae-4eb2-90d0-7a37279dd6a5.jfif' },
          { name: 'Midnight', hex: '#151922', imageUrl: '/uploads/products/1775500252676-7c4850f4-9eae-4eb2-90d0-7a37279dd6a5.jfif' },
        ],
        allowCustomTailoring: true,
        tailorMeasurements: ['chest', 'waist', 'hips', 'shoulder', 'length'],
        isActive: true,
        createdAt: '2026-05-31',
      },
      {
        id: 1004,
        name: 'Signature Mini Dress',
        description: "Minimal mini dress with Annie's classic shape.",
        price: 120,
        size: 'XS, S, M',
        stock: 7,
        storeCategory: 'Mini Dresses',
        imageUrl: '/uploads/products/1775496644698-Annies.png',
        colorVariations: [
          { name: 'Black', hex: '#111111', imageUrl: '/uploads/products/1775496644698-Annies.png' },
          { name: 'Pearl', hex: '#f4efe6', imageUrl: '/uploads/products/1775496644698-Annies.png' },
        ],
        allowCustomTailoring: true,
        tailorMeasurements: ['bust', 'waist', 'hips', 'length'],
        isActive: true,
        createdAt: '2026-05-30',
      },
      {
        id: 1005,
        name: 'Classic Native Set',
        description: 'Tailored traditional set for crisp formal wear.',
        price: 165,
        size: 'M, L, XL',
        stock: 5,
        storeCategory: 'Menswear',
        imageUrl: null,
        colorVariations: [
          { name: 'Black', hex: '#111111', imageUrl: null },
          { name: 'Cream', hex: '#efe5d2', imageUrl: null },
        ],
        allowCustomTailoring: true,
        tailorMeasurements: ['chest', 'waist', 'shoulder', 'sleeve', 'trouser length'],
        isActive: true,
        createdAt: '2026-05-29',
      },
    ]
  }

  private defaultCollection() {
    return {
      id: 0,
      title: "Annie's Stitches",
      bio: '',
      journeyText: '',
      happyClients: 1000,
      yearsExperience: 8,
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
  
  async show({ params, inertia }: HttpContext) {
    const slug = params.slug as string

    try {
      const category = await Category.findBy('slug', slug)
      
      if (!category) {
        return inertia.render('guests/product', {
          category: null,
          works: [],
          error: 'Category not found'
        })
      }

      const works = await Work.query()
        .where('categoryId', category.id)
        .where('isActive', true)
        .preload('category')
        .orderBy('createdAt', 'desc')

      return inertia.render('guests/product', {
        category: category.serialize(),
        works: works.map(w => w.serialize()),
        isEmpty: works.length === 0
      })

    } catch (error) {
      console.error('Error fetching category:', error)
      return inertia.render('guests/product', {
        category: null,
        works: [],
        error: true
      })
    }
  }
  
  async store({ inertia }: HttpContext) {
    try {
      // Get all active products
      const products = await Product.query()
        .where('isActive', true)
        .orderBy('createdAt', 'desc')

      console.log('✅ Store route hit! Found', products.length, 'products')
      
      const storeProducts = products.map(p => p.toJSON())

      return inertia.render('guests/store', { 
        products: storeProducts.length > 0 ? storeProducts : this.defaultStoreProducts(),
        isEmpty: false
      })
      
    } catch (error) {
      console.error('Error fetching products:', error)
      return inertia.render('guests/store', { 
        products: this.defaultStoreProducts(),
        isEmpty: false,
        error: true
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
      const categories = await Category.query()
        .where('isActive', true)
        .orderBy('order')
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
      const { productId, size, quantity = 1, color = '', tailorMeasurements = null, isCustomTailored = false } = request.all()
      const normalizedQuantity = Math.max(1, Number(quantity) || 1)
      
      if (!productId) {
        return response.status(400).json({ error: 'Product ID is required' })
      }
      
      const product = await Product.find(productId)
      if (!product) {
        return response.status(404).json({ error: 'Product not found' })
      }
      
      const cartItem = await CartItem.query()
        .where('userId', user.id)
        .where('productId', product.id)
        .where('size', size || '')
        .where('color', color || '')
        .first()

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

      const cart = await CartItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')
      
      return response.json({ 
        success: true, 
        message: 'Added to cart',
        cart: cart.map((item) => this.serializeCartItem(item))
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
        cart: cart.map((item) => this.serializeCartItem(item))
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

      if (!Number.isFinite(normalizedQuantity)) {
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

      const wishlist = await WishlistItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')
      
      return response.json({ 
        success: true, 
        message: existing ? 'Removed from wishlist' : 'Added to wishlist',
        wishlist: wishlist.map((item) => this.serializeWishlistItem(item))
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
        wishlist: wishlist.map((item) => this.serializeWishlistItem(item))
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
        cart: cart.map((item) => this.serializeCartItem(item))
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
      
      await WishlistItem.query()
        .where('userId', user.id)
        .where('productId', id)
        .delete()

      const wishlist = await WishlistItem.query()
        .where('userId', user.id)
        .preload('product')
        .orderBy('createdAt', 'desc')
      
      return response.json({ 
        success: true, 
        message: 'Removed from wishlist',
        wishlist: wishlist.map((item) => this.serializeWishlistItem(item))
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to modify wishlist' })
    }
  }

  async createOrder({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const { customerName, customerEmail, customerPhone, shippingAddress, items = [] } = request.all()
      const submittedItems = Array.isArray(items) ? items : []

      if (submittedItems.length === 0) {
        return response.status(400).json({ error: 'No items to checkout' })
      }

      const totalAmount = submittedItems.reduce((total, item) => {
        return total + (Number(item.price) || 0) * (Number(item.quantity) || 1)
      }, 0)

      const order = await Order.create({
        orderNumber: `AS-${Date.now()}`,
        userId: user.id,
        customerName: customerName || user.fullName || 'Customer',
        customerEmail: customerEmail || user.email,
        customerPhone: customerPhone || null,
        shippingAddress: shippingAddress || null,
        totalAmount,
        status: 'pending',
        trackingStage: 'received',
        paymentStatus: 'paid',
        receivedAt: DateTime.now(),
      })

      for (const item of submittedItems) {
        await OrderItem.create({
          orderId: order.id,
          productId: item.id || item.productId || null,
          productName: item.name || item.productName || 'Product',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          size: item.selectedSize || item.size || null,
          color: item.color || null,
          tailorMeasurements: item.tailorMeasurements || null,
          isCustomTailored: !!item.isCustomTailored,
        })
      }

      await CartItem.query().where('userId', user.id).delete()

      const fullOrder = await Order.query()
        .where('id', order.id)
        .preload('items')
        .firstOrFail()

      return response.json({
        success: true,
        order: this.serializeOrder(fullOrder),
        cart: [],
      })
    } catch (error) {
      console.error('Error creating order:', error)
      return response.status(500).json({ error: 'Could not create order' })
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
      items: order.items?.map((item) => ({
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

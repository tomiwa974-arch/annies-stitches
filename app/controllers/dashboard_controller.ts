import type { HttpContext } from '@adonisjs/core/http'
import { 
  Category, 
  Work, 
  Product, 
  ProductImage,
  Order, 
  Activity, 
  StoreCategory,
  Collection, 
  User 
} from '#models/index'
import app from '@adonisjs/core/services/app'
import { DateTime } from 'luxon'

export default class DashboardController {
  private parseJsonField(value: any, fallback: any) {
    if (!value) return fallback
    if (typeof value !== 'string') return value
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }

  private stringifyJsonField(value: any, fallback: any) {
    return JSON.stringify(this.parseJsonField(value, fallback))
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error'
  }

  // Main dashboard page - loads everything
  async index({ inertia }: HttpContext) {
    try {
    const categories = await Category.query().orderBy('order')
    const works = await Work.query()
      .preload('category')
      .orderBy('createdAt', 'desc')
    const products = await Product.query()
      .preload('images')
      .orderBy('createdAt', 'desc')
    const orders = await Order.query()
      .preload('user', (userQuery) => {
        userQuery.select(['id', 'fullName', 'email'])
      })
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('product')
      })
      .orderBy('createdAt', 'desc')
      .limit(50)
    const activities = await Activity.query()
      .orderBy('createdAt', 'desc')
      .limit(100)
    
    const collection = await Collection.first()
    
    const storeCategories = await StoreCategory.query()
      .where('isActive', true)
      .orderBy('order')
    
    const categoriesCount = await Category.query().count('* as total')
    const worksCount = await Work.query().count('* as total')
    const productsCount = await Product.query().count('* as total')
    const ordersCount = await Order.query().count('* as total')
    const usersCount = await User.query().count('* as total')
    
    const totalRevenue = await Order.query().sum('total_amount as sum')
    const pendingOrders = await Order.query().where('status', 'pending').count('* as total')
    const completedOrders = await Order.query().where('status', 'delivered').count('* as total')
    
    const totalWishlists = await Activity.query()
      .where('type', 'wishlist')
      .count('* as total')
    const totalCartAdds = await Activity.query()
      .where('type', 'cart')
      .count('* as total')
    const totalViews = await Activity.query()
      .where('type', 'view')
      .count('* as total')
    
    const popularProducts = await Activity.query()
      .where('entityType', 'product')
      .select('entityId')
      .count('* as count')
      .groupBy('entityId')
      .orderBy('count', 'desc')
      .limit(10)
      .then(async (results) => {
        const popularWithProducts = []
        for (const r of results) {
          const product = await Product.find(r.$extras.entityId || r.entityId)
          if (product) {
            popularWithProducts.push({
              id: product.id,
              title: product.name,
              category: product.storeCategory || 'Uncategorized',
              wishlist_count: Number(r.$extras.count)
            })
          }
        }
        return popularWithProducts
      })
    
    const recentActivity = await Activity.query()
      .orderBy('createdAt', 'desc')
      .limit(10)
      .then(activities => activities.map(a => ({
        id: a.id,
        action: a.description || `${a.type} activity`,
        created_at: a.createdAt ? a.createdAt.toFormat('yyyy-MM-dd HH:mm') : 'Just now'
      })))

    const stats = {
      totalProducts: Number(productsCount[0].$extras.total),
      totalOrders: Number(ordersCount[0].$extras.total),
      totalWorks: Number(worksCount[0].$extras.total),
      totalCategories: Number(categoriesCount[0].$extras.total),
      totalWishlists: Number(totalWishlists[0].$extras.total),
      totalRevenue: Number(totalRevenue[0].$extras.sum || 0),
      pendingOrders: Number(pendingOrders[0].$extras.total),
      completedOrders: Number(completedOrders[0].$extras.total),
      totalUsers: Number(usersCount[0].$extras.total),
      totalCartAdds: Number(totalCartAdds[0].$extras.total),
      totalViews: Number(totalViews[0].$extras.total),
      popularProducts
    }

    let collectionData = collection ? collection.toJSON() : {
      id: 1,
      title: "Annie's Stitches",
      bio: '',
      journeyText: '',
      happyClients: 0,
      yearsExperience: 0,
      services: ['CUSTOM TAILORING', 'CORSET & STATEMENT DRESSES', 'READY-TO-WEAR', 'TRADITIONAL WEAR', 'MENS CASUAL WEAR', "MEN'S TRADITIONAL WEAR"]
    }
    
    if (!collectionData.services || (typeof collectionData.services === 'string' && collectionData.services.length === 0)) {
      collectionData.services = ['CUSTOM TAILORING', 'CORSET & STATEMENT DRESSES', 'READY-TO-WEAR', 'TRADITIONAL WEAR', 'MENS CASUAL WEAR', "MEN'S TRADITIONAL WEAR"]
    }

    return inertia.render('dashboard/admin/index', {
      activeTab: 'dashboard',
      categories: categories.map(c => c.toJSON()),
      works: works.map(w => w.toJSON()),
      products: products.map(p => p.toJSON()),
      orders: orders.map(o => ({
        id: o.id,
        order_number: o.orderNumber,
        customer_name: o.customerName,
        total_amount: o.totalAmount,
        status: o.status,
        tracking_stage: o.trackingStage || 'received',
        created_at: o.createdAt ? o.createdAt.toFormat('yyyy-MM-dd') : 'Unknown'
      })),
      activities: activities.map(a => a.toJSON()),
      collection: collectionData,
      stats,
      recentActivity,
      storeCategories: storeCategories.map(c => c.toJSON())
    })
    } catch (error) {
      console.error('Error loading admin dashboard:', error)
      return inertia.render('dashboard/admin/index', {
        activeTab: 'dashboard',
        categories: [],
        works: [],
        products: [],
        orders: [],
        activities: [],
        collection: {
          id: 0,
          title: "Annie's Stitches",
          bio: '',
          journeyText: '',
          happyClients: 0,
          yearsExperience: 0,
          services: ['CUSTOM TAILORING', 'READY-TO-WEAR'],
        },
        stats: {
          totalProducts: 0,
          totalOrders: 0,
          totalWorks: 0,
          totalCategories: 0,
          totalWishlists: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalUsers: 0,
          totalCartAdds: 0,
          totalViews: 0,
          popularProducts: [],
        },
        recentActivity: [],
        storeCategories: [],
        databaseError: 'Database is not connected',
      })
    }
  }

  // ============ COLLECTIONS / CATEGORIES ============
  
  async collections({ inertia }: HttpContext) {
    const categories = await Category.query().orderBy('order')
    const collection = await Collection.first()
    
    const pageContent = {
      bio: collection?.bio || '',
      middleInfo: collection?.journeyText || '',
      worksTopText: 'Featured works',
      worksBottomText: '',
      storeTopText: 'Shop our collection'
    }
    
    return inertia.render('dashboard/admin/index', { 
      activeTab: 'collections',
      categories: categories.map(c => c.toJSON()),
      pageContent
    })
  }

  async storeCategory({ request, response }: HttpContext) {
    try {
      const { name, description } = request.all()
      const existingCategories = await Category.query().count('* as total')
      const order = Number(existingCategories[0].$extras.total)
      
      let coverImagePath = null
      const coverImage = request.file('cover_image')
      if (coverImage) {
        const fileName = `${Date.now()}-${coverImage.clientName}`
        await coverImage.move(app.makePath('public/uploads/categories'), {
          name: fileName
        })
        coverImagePath = `/uploads/categories/${fileName}`
      }
      
      await Category.create({
        name: name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: description,
        order: order,
        isActive: true,
        coverImage: coverImagePath
      })
      return response.redirect().back()
    } catch (error) {
      console.error('Error creating category:', error)
      return response.redirect().back()
    }
  }

  async updateCategory({ params, request, response }: HttpContext) {
    try {
      const category = await Category.findOrFail(params.id)
      
      let name: string
      let description: string
      let coverImagePath = category.coverImage
      
      const coverImage = request.file('cover_image')
      
      if (coverImage) {
        name = request.input('name')
        description = request.input('description')
        
        const fileName = `${Date.now()}-${coverImage.clientName}`
        await coverImage.move(app.makePath('public/uploads/categories'), {
          name: fileName
        })
        coverImagePath = `/uploads/categories/${fileName}`
      } else {
        const data = request.all()
        name = data.name
        description = data.description
      }
      
      category.merge({
        name: name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: description,
        coverImage: coverImagePath
      })
      await category.save()
      return response.redirect().back()
    } catch (error) {
      console.error('Error updating category:', error)
      return response.redirect().back()
    }
  }

  async deleteCategory({ params, response }: HttpContext) {
    try {
      const category = await Category.findOrFail(params.id)
      await category.delete()
      return response.redirect().back()
    } catch (error) {
      console.error('Error deleting category:', error)
      return response.redirect().back()
    }
  }

  // ============ STORE CATEGORIES ============

  async getStoreCategories({ response }: HttpContext) {
    try {
      const storeCategories = await StoreCategory.query()
        .where('isActive', true)
        .orderBy('order')
      return response.json(storeCategories)
    } catch (error) {
      console.error('Error fetching store categories:', error)
      return response.status(500).json({ error: 'Failed to fetch store categories' })
    }
  }

  async storeStoreCategory({ request, response, session }: HttpContext) {
    try {
      const { name, slug } = request.all()
      if (!name || !String(name).trim()) {
        session.flash('errors', { form: 'Store category name is required.' })
        return response.redirect().back()
      }

      const cleanName = String(name).trim()
      const cleanSlug = String(slug || cleanName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')

      const existingCount = await StoreCategory.query().count('* as total')
      const order = Number(existingCount[0].$extras.total)
      
      await StoreCategory.create({
        name: cleanName,
        slug: cleanSlug,
        order: order,
        isActive: true
      })
      return response.redirect().back()
    } catch (error) {
      console.error('Error creating store category:', error)
      session.flash('errors', { form: `Failed to create store category: ${this.errorMessage(error)}` })
      return response.redirect().back()
    }
  }

  async updateStoreCategory({ params, request, response, session }: HttpContext) {
    try {
      const storeCategory = await StoreCategory.findOrFail(params.id)
      const { name, slug } = request.all()
      if (!name || !String(name).trim()) {
        session.flash('errors', { form: 'Store category name is required.' })
        return response.redirect().back()
      }
      const cleanName = String(name).trim()
      const cleanSlug = String(slug || cleanName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
      
      storeCategory.merge({
        name: cleanName,
        slug: cleanSlug
      })
      await storeCategory.save()
      return response.redirect().back()
    } catch (error) {
      console.error('Error updating store category:', error)
      session.flash('errors', { form: `Failed to update store category: ${this.errorMessage(error)}` })
      return response.redirect().back()
    }
  }

  async deleteStoreCategory({ params, response }: HttpContext) {
    try {
      const storeCategory = await StoreCategory.findOrFail(params.id)
      await Product.query()
        .where('store_category', storeCategory.name)
        .update({ store_category: null })
      await storeCategory.delete()
      return response.redirect().back()
    } catch (error) {
      console.error('Error deleting store category:', error)
      return response.redirect().back()
    }
  }

  // ============ UPDATE COLLECTION ============
  
  async updateCollection({ request, response }: HttpContext) {
    try {
      let collection = await Collection.first()
      if (!collection) {
        collection = new Collection()
      }
      
      const { bio, journeyText } = request.all()
      
      collection.merge({
        bio: bio || '',
        journeyText: journeyText || ''
      })
      await collection.save()
      
      return response.redirect().back()
    } catch (error) {
      console.error('Error updating collection:', error)
      return response.redirect().back()
    }
  }

  // ============ WORKS ============
  
  async works({ inertia }: HttpContext) {
    const works = await Work.query()
      .preload('category')
      .orderBy('createdAt', 'desc')
    const categories = await Category.query().where('isActive', true)
    
    return inertia.render('dashboard/admin/index', { 
      activeTab: 'works',
      works: works.map(w => w.toJSON()),
      categories: categories.map(c => c.toJSON())
    })
  }

  async storeWork({ request, response }: HttpContext) {
    try {
      const { categoryId, title, description } = request.all()
      
      let imagePath = null
      const image = request.file('imageUrl')
      if (image) {
        const fileName = `${Date.now()}-${image.clientName}`
        await image.move(app.makePath('public/uploads/works'), {
          name: fileName
        })
        imagePath = `/uploads/works/${fileName}`
      }
      
      await Work.create({
        categoryId: categoryId,
        title: title,
        description: description || '',
        imageUrl: imagePath,
        isActive: true
      })
      return response.redirect().back()
    } catch (error) {
      console.error('Error creating work:', error)
      return response.redirect().back()
    }
  }

  async updateWork({ params, request, response }: HttpContext) {
    try {
      const work = await Work.findOrFail(params.id)
      const { categoryId, title, description } = request.all()
      
      let imagePath = work.imageUrl
      const image = request.file('imageUrl')
      if (image) {
        const fileName = `${Date.now()}-${image.clientName}`
        await image.move(app.makePath('public/uploads/works'), {
          name: fileName
        })
        imagePath = `/uploads/works/${fileName}`
      }
      
      work.merge({
        categoryId: categoryId,
        title: title,
        description: description || '',
        imageUrl: imagePath
      })
      await work.save()
      return response.redirect().back()
    } catch (error) {
      console.error('Error updating work:', error)
      return response.redirect().back()
    }
  }

  async deleteWork({ params, response }: HttpContext) {
    try {
      const work = await Work.findOrFail(params.id)
      await work.delete()
      return response.redirect().back()
    } catch (error) {
      console.error('Error deleting work:', error)
      return response.redirect().back()
    }
  }

  // ============ STORE / PRODUCTS ============
  
  async store({ inertia }: HttpContext) {
    try {
    const products = await Product.query()
      .preload('images')
      .orderBy('createdAt', 'desc')
    
    const storeCategories = await StoreCategory.query()
      .where('isActive', true)
      .orderBy('order')
    
    return inertia.render('dashboard/admin/index', { 
      activeTab: 'store',
      products: products.map(p => p.toJSON()),
      storeCategories: storeCategories.map(c => c.toJSON())
    })
    } catch (error) {
      console.error('Error loading admin store:', error)
      return inertia.render('dashboard/admin/index', {
        activeTab: 'store',
        products: [],
        storeCategories: [],
        databaseError: 'Database is not connected',
      })
    }
  }

  async storeProduct({ request, response, session }: HttpContext) {
    try {
      const {
        name,
        description,
        price,
        size,
        stock,
        store_category,
        color_variations,
        tailor_measurements,
        allow_custom_tailoring,
      } = request.all()
      if (!name || !String(name).trim()) {
        session.flash('errors', { form: 'Product name is required.' })
        return response.redirect().back()
      }
      if (price === undefined || price === null || String(price).trim() === '') {
        session.flash('errors', { form: 'Product price is required.' })
        return response.redirect().back()
      }
      
      let imagePath = null
      const image = request.file('imageUrl')
      if (image) {
        const fileName = `${Date.now()}-${image.clientName}`
        await image.move(app.makePath('public/uploads/products'), {
          name: fileName
        })
        imagePath = `/uploads/products/${fileName}`
      }
      
      const product = await Product.create({
        name: String(name).trim(),
        description: description || '',
        price: Number(price),
        size: size || '',
        stock: Number(stock || 0),
        storeCategory: store_category || null,
        imageUrl: imagePath,
        colorVariations: this.stringifyJsonField(color_variations, []),
        tailorMeasurements: this.stringifyJsonField(tailor_measurements, ['chest', 'waist', 'hips', 'length']),
        allowCustomTailoring: allow_custom_tailoring !== 'false',
        isActive: true
      })
      
      const images = request.file('images')
      if (images && Array.isArray(images)) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          const fileName = `${Date.now()}-${i}-${img.clientName}`
          await img.move(app.makePath('public/uploads/products'), { name: fileName })
          await ProductImage.create({
            productId: product.id,
            imageUrl: `/uploads/products/${fileName}`,
            sortOrder: i
          })
        }
      }
      
      return response.redirect().back()
    } catch (error) {
      console.error('Error creating product:', error)
      if (request.accepts(['json', 'html']) === 'json') {
        return response.status(500).json({ error: 'Failed to create product', detail: this.errorMessage(error) })
      }
      session.flash('errors', { form: `Failed to create product: ${this.errorMessage(error)}` })
      return response.redirect().back()
    }
  }

  async updateProduct({ params, request, response, session }: HttpContext) {
    try {
      const product = await Product.findOrFail(params.id)
      const {
        name,
        description,
        price,
        size,
        stock,
        store_category,
        color_variations,
        tailor_measurements,
        allow_custom_tailoring,
      } = request.all()
      if (!name || !String(name).trim()) {
        session.flash('errors', { form: 'Product name is required.' })
        return response.redirect().back()
      }
      if (price === undefined || price === null || String(price).trim() === '') {
        session.flash('errors', { form: 'Product price is required.' })
        return response.redirect().back()
      }
      
      let imagePath = product.imageUrl
      const image = request.file('imageUrl')
      if (image) {
        const fileName = `${Date.now()}-${image.clientName}`
        await image.move(app.makePath('public/uploads/products'), {
          name: fileName
        })
        imagePath = `/uploads/products/${fileName}`
      }
      
      product.merge({
        name: String(name).trim(),
        description: description || '',
        price: Number(price),
        size: size || '',
        stock: Number(stock || 0),
        storeCategory: store_category || null,
        imageUrl: imagePath,
        colorVariations: this.stringifyJsonField(color_variations, []),
        tailorMeasurements: this.stringifyJsonField(tailor_measurements, ['chest', 'waist', 'hips', 'length']),
        allowCustomTailoring: allow_custom_tailoring !== 'false'
      })
      await product.save()
      
      const images = request.file('images')
      if (images && Array.isArray(images)) {
        const existingCount = await ProductImage.query().where('productId', product.id).count('* as total')
        const startOrder = Number(existingCount[0].$extras.total)
        
        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          const fileName = `${Date.now()}-${i}-${img.clientName}`
          await img.move(app.makePath('public/uploads/products'), { name: fileName })
          await ProductImage.create({
            productId: product.id,
            imageUrl: `/uploads/products/${fileName}`,
            sortOrder: startOrder + i
          })
        }
      }
      
      return response.redirect().back()
    } catch (error) {
      console.error('Error updating product:', error)
      if (request.accepts(['json', 'html']) === 'json') {
        return response.status(500).json({ error: 'Failed to update product', detail: this.errorMessage(error) })
      }
      session.flash('errors', { form: `Failed to update product: ${this.errorMessage(error)}` })
      return response.redirect().back()
    }
  }

  async deleteProduct({ params, response }: HttpContext) {
    try {
      const product = await Product.findOrFail(params.id)
      await product.related('images').query().delete()
      await product.delete()
      return response.redirect().back()
    } catch (error) {
      console.error('Error deleting product:', error)
      return response.redirect().back()
    }
  }

  async deleteProductImage({ params, response }: HttpContext) {
    try {
      const image = await ProductImage.findOrFail(params.id)
      await image.delete()
      return response.json({ success: true })
    } catch (error) {
      console.error('Error deleting product image:', error)
      return response.status(500).json({ error: 'Failed to delete image' })
    }
  }

  // ============ ORDERS ============
  
  async orders({ inertia }: HttpContext) {
    const orders = await Order.query()
      .preload('user', (userQuery) => {
        userQuery.select(['id', 'fullName', 'email'])
      })
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('product')
      })
      .orderBy('createdAt', 'desc')
    
    const totalOrders = await Order.query().count('* as total')
    const totalRevenue = await Order.query().sum('total_amount as sum')
    const pendingOrders = await Order.query().where('status', 'pending').count('* as total')
    const completedOrders = await Order.query().where('status', 'delivered').count('* as total')
    
    const orderStats = {
      totalOrders: Number(totalOrders[0].$extras.total),
      totalRevenue: Number(totalRevenue[0].$extras.sum || 0),
      pendingOrders: Number(pendingOrders[0].$extras.total),
      completedOrders: Number(completedOrders[0].$extras.total)
    }
    
    return inertia.render('dashboard/admin/index', { 
      activeTab: 'orders',
      orders: orders.map(o => ({
        id: o.id,
        order_number: o.orderNumber,
        customer_name: o.customerName,
        total_amount: o.totalAmount,
        status: o.status,
        tracking_stage: o.trackingStage || 'received',
        created_at: o.createdAt ? o.createdAt.toFormat('yyyy-MM-dd') : 'Unknown'
      })),
      stats: orderStats
    })
  }

  async updateOrderStatus({ params, request, response }: HttpContext) {
    try {
      const order = await Order.findOrFail(params.id)
      const { status, trackingStage } = request.all()
      
      if (status) order.status = status
      if (trackingStage) {
        order.trackingStage = trackingStage
        if (trackingStage === 'received' && !order.receivedAt) order.receivedAt = DateTime.now()
        if (trackingStage === 'packaged' && !order.packagedAt) order.packagedAt = DateTime.now()
        if (trackingStage === 'shipped' && !order.shippedAt) order.shippedAt = DateTime.now()
        if (trackingStage === 'delivered' && !order.deliveredAt) order.deliveredAt = DateTime.now()
      }
      await order.save()
      return response.redirect().back()
    } catch (error) {
      console.error('Error updating order:', error)
      return response.redirect().back()
    }
  }

  async getOrderDetails({ params, response }: HttpContext) {
    try {
      const order = await Order.query()
        .where('id', params.id)
        .preload('user', (userQuery) => {
          userQuery.select(['id', 'fullName', 'email'])
        })
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('product')
        })
        .firstOrFail()
      
      const formattedItems = order.items.map(item => ({
        id: item.id,
        product_name: item.product?.name || item.productName,
        quantity: item.quantity,
        price: item.price,
        size: item.size
      }))
      
      return response.json({
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customerName,
        total_amount: order.totalAmount,
        status: order.status,
        tracking_stage: order.trackingStage || 'received',
        created_at: order.createdAt ? order.createdAt.toFormat('yyyy-MM-dd') : 'Unknown',
        items: formattedItems,
        user: order.user ? {
          fullName: order.user.fullName,
          email: order.user.email
        } : null
      })
    } catch (error) {
      console.error('Error fetching order details:', error)
      return response.status(404).json({ error: 'Order not found' })
    }
  }

  // ============ ACTIVITY ============
  
  async activity({ inertia }: HttpContext) {
    const activities = await Activity.query()
      .orderBy('createdAt', 'desc')
      .limit(100)
    
    const totalWishlists = await Activity.query()
      .where('type', 'wishlist')
      .count('* as total')
    const totalCartAdds = await Activity.query()
      .where('type', 'cart')
      .count('* as total')
    const totalViews = await Activity.query()
      .where('type', 'view')
      .count('* as total')
    
    const activityStats = {
      totalWishlists: Number(totalWishlists[0].$extras.total),
      totalCartAdds: Number(totalCartAdds[0].$extras.total),
      totalViews: Number(totalViews[0].$extras.total)
    }
    
    return inertia.render('dashboard/admin/index', { 
      activeTab: 'activity',
      activities: activities.map(a => ({
        ...a.toJSON(),
        created_at: a.createdAt ? a.createdAt.toFormat('yyyy-MM-dd HH:mm') : 'Just now'
      })),
      stats: activityStats
    })
  }

  // ============ USERS ============
  
  async users({ inertia }: HttpContext) {
    const users = await User.query()
      .orderBy('createdAt', 'desc')
    
    const userStats = {
      totalUsers: await User.query().count('* as total').then(r => Number(r[0].$extras.total)),
      activeUsers: await User.query().where('isActive', true).count('* as total').then(r => Number(r[0].$extras.total)),
      adminUsers: await User.query().where('role', 'admin').count('* as total').then(r => Number(r[0].$extras.total))
    }
    
    return inertia.render('dashboard/admin/index', {
      activeTab: 'users',
      users: users.map(u => u.toJSON()),
      stats: userStats
    })
  }

  async updateUserStatus({ params, request, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)
      const { isActive, role } = request.all()
      
      if (isActive !== undefined) user.isActive = isActive
      if (role) user.role = role
      await user.save()
      return response.redirect().back()
    } catch (error) {
      console.error('Error updating user:', error)
      return response.redirect().back()
    }
  }

  async deleteUser({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)
      await user.delete()
      return response.redirect().back()
    } catch (error) {
      console.error('Error deleting user:', error)
      return response.redirect().back()
    }
  }

  // ============ API ROUTES ============
  
  async stats({ response }: HttpContext) {
    const productsCount = await Product.query().count('* as total')
    const ordersCount = await Order.query().count('* as total')
    const worksCount = await Work.query().count('* as total')
    const categoriesCount = await Category.query().count('* as total')
    const totalWishlists = await Activity.query().where('type', 'wishlist').count('* as total')
    const totalRevenue = await Order.query().sum('total_amount as sum')
    const pendingOrders = await Order.query().where('status', 'pending').count('* as total')
    
    return response.json({
      totalProducts: Number(productsCount[0].$extras.total),
      totalOrders: Number(ordersCount[0].$extras.total),
      totalWorks: Number(worksCount[0].$extras.total),
      totalCategories: Number(categoriesCount[0].$extras.total),
      totalWishlists: Number(totalWishlists[0].$extras.total),
      totalRevenue: Number(totalRevenue[0].$extras.sum || 0),
      pendingOrders: Number(pendingOrders[0].$extras.total)
    })
  }

  async recentActivity({ response }: HttpContext) {
    const activities = await Activity.query()
      .orderBy('createdAt', 'desc')
      .limit(10)
    
    return response.json(activities.map(a => ({
      id: a.id,
      action: a.description || `${a.type} activity`,
      created_at: a.createdAt ? a.createdAt.toFormat('yyyy-MM-dd HH:mm') : 'Just now'
    })))
  }

  async popularProducts({ response }: HttpContext) {
    const results = await Activity.query()
      .where('entityType', 'product')
      .select('entityId')
      .count('* as count')
      .groupBy('entityId')
      .orderBy('count', 'desc')
      .limit(5)
    
    const popularWithProducts = []
    for (const r of results) {
      const product = await Product.find(r.$extras.entityId || r.entityId)
      if (product) {
        popularWithProducts.push({
          id: product.id,
          title: product.name,
          category: product.storeCategory || 'Uncategorized',
          wishlist_count: Number(r.$extras.count)
        })
      }
    }
    
    return response.json(popularWithProducts)
  }
}

import db from '@adonisjs/lucid/services/db'
import {
  Category,
  Work,
  Product,
  Order,
  Activity,
  Collection,
  User,
  StoreCategory,
  WishlistItem,
  CartItem,
} from '#models/index'

export function safeUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.isActive),
    createdAt: user.createdAt?.toISO(),
  }
}
export function orderData(order: Order) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    shipping_address: order.shippingAddress,
    total_amount: Number(order.totalAmount),
    status: order.status,
    payment_status: order.paymentStatus,
    tracking_stage: order.trackingStage || 'received',
    created_at: order.createdAt?.toISODate(),
    items: order.items?.map((item) => ({
      id: item.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: Number(item.price),
      size: item.size,
      color: item.color,
      isCustomTailored: Boolean(item.isCustomTailored),
      tailorMeasurements: item.tailorMeasurements,
    })),
    user: order.user ? safeUser(order.user) : null,
  }
}
export async function adminData() {
  const [
    categories,
    works,
    products,
    orders,
    activities,
    collection,
    users,
    storeCategories,
    wishlists,
    cart,
    fittings,
  ] = await Promise.all([
    Category.query().withCount('works').orderBy('order'),
    Work.query().preload('category').orderBy('createdAt', 'desc'),
    Product.query().preload('images').orderBy('createdAt', 'desc'),
    Order.query().preload('user').preload('items').orderBy('createdAt', 'desc'),
    Activity.query().orderBy('id', 'desc').limit(300),
    Collection.first(),
    User.query().orderBy('createdAt', 'desc'),
    StoreCategory.query().where('isActive', true).orderBy('order'),
    WishlistItem.all(),
    CartItem.all(),
    db.from('fitting_requests').orderBy('created_at', 'desc'),
  ])
  const popularCounts = new Map<number, number>()
  for (const item of wishlists)
    popularCounts.set(item.productId, (popularCounts.get(item.productId) || 0) + 1)
  const popularProducts = [...popularCounts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .flatMap(([id, count]) => {
      const product = products.find((p) => p.id === id)
      return product
        ? [{ id, title: product.name, category: product.storeCategory, wishlist_count: count }]
        : []
    })
  const views = await Activity.query().where('type', 'view').count('* as total')
  const lastActivities = await Activity.query().whereIn(
    'id',
    db.from('activities').select(db.raw('MAX(id)')).whereNotNull('user_id').groupBy('user_id')
  )
  return {
    categories: categories.map((item) => ({
      ...item.toJSON(),
      works_count: Number(item.$extras.works_count || 0),
    })),
    works: works.map((item) => item.toJSON()),
    products: products.map((item) => ({
      ...item.toJSON(),
      price: Number(item.price),
      wishlist_count: popularCounts.get(item.id) || 0,
    })),
    orders: orders.map(orderData),
    activities: activities.map((item) => ({
      ...item.toJSON(),
      created_at: item.createdAt?.toFormat('yyyy-MM-dd HH:mm'),
    })),
    collection: collection?.toJSON() || {
      title: "Annie's Stitches",
      bio: '',
      journeyText: '',
      happyClients: 0,
      yearsExperience: 0,
      services: [],
    },
    pageContent: { bio: collection?.bio || '', middleInfo: collection?.journeyText || '' },
    users: users.map((user) => ({
      ...safeUser(user),
      lastSeenAt: user.lastSeenAt?.toISO() || null,
      isOnline: user.isActive && user.presenceOnline,
      lastActivity:
        lastActivities.find((activity) => activity.userId === user.id)?.description || null,
    })),
    storeCategories: storeCategories.map((item) => item.toJSON()),
    fittings: fittings.map((item) => ({
      ...item,
      hasReference: Boolean(item.reference_image),
      reference_image: undefined,
    })),
    recentActivity: activities.slice(0, 10).map((item) => ({
      id: item.id,
      action: item.description || item.type,
      created_at: item.createdAt?.toFormat('yyyy-MM-dd HH:mm'),
    })),
    stats: {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalWorks: works.length,
      totalCategories: categories.length,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      adminUsers: users.filter((u) => u.role === 'admin').length,
      totalRevenue: orders
        .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.totalAmount), 0),
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      completedOrders: orders.filter((o) => o.status === 'delivered').length,
      totalWishlists: wishlists.length,
      totalCartAdds: cart.reduce((sum, item) => sum + item.quantity, 0),
      totalViews: Number(views[0].$extras.total),
      pendingFittings: fittings.filter((f) => f.status === 'pending').length,
      popularProducts,
    },
  }
}

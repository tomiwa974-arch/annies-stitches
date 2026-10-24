/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import AuthsController from '#controllers/auths_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import './auth.js'

const GuestsController = () => import('#controllers/guests_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const MagazinesController = () => import('#controllers/magazines_controller')

// Home page
router.on('/').renderInertia('home')
router.on('/collection').renderInertia('dashboard/user/userdashboard')
router.get('/magazine', [MagazinesController, 'index'])
router.get('/magazine/:id', [MagazinesController, 'index'])
router.on('/custom').renderInertia('custom')
router.on('/about').renderInertia('about')
router
  .post('/custom/bookings', [() => import('#controllers/fittings_controller'), 'store'])
  .use(middleware.auth())
router
  .post('/api/shopping/merge', [() => import('#controllers/shopping_controller'), 'merge'])
  .use(middleware.auth())

// ============ GUEST / PUBLIC ROUTES ============
// Works page (category view)
router.get('/guests/:slug', [GuestsController, 'show'])

// Store page
router.get('/store', [GuestsController, 'store'])
router.get('/products', [GuestsController, 'store'])

// ============ API ROUTES FOR FRONTEND ============
router.get('/api/collection', [GuestsController, 'getCollection'])
router.get('/api/categories', [GuestsController, 'getCategories'])
router.get('/api/works', [GuestsController, 'getWorks'])
router.get('/api/works/category/:categoryId', [GuestsController, 'getWorksByCategory'])
router.get('/api/products', [GuestsController, 'getProducts'])
router.get('/api/user', [AuthsController, 'getUserData'])
router.post('/api/cart', [GuestsController, 'addToCart']).use(middleware.auth())
router.get('/api/cart', [GuestsController, 'getCart']).use(middleware.auth())
router.put('/api/cart/:id', [GuestsController, 'updateCartItem']).use(middleware.auth())
router.delete('/api/cart/:id', [GuestsController, 'removeFromCart']).use(middleware.auth())
router.post('/api/wishlist', [GuestsController, 'addToWishlist']).use(middleware.auth())
router.get('/api/wishlist', [GuestsController, 'getWishlist']).use(middleware.auth())
router.delete('/api/wishlist/:id', [GuestsController, 'removeFromWishlist']).use(middleware.auth())
router.post('/api/orders', [GuestsController, 'createOrder']).use(middleware.auth())
router.get('/api/orders', [GuestsController, 'getMyOrders']).use(middleware.auth())

// ============ AUTH ROUTES ============
router.get('/login', [AuthsController, 'showLogin']).as('auth.login')
router.post('/login', [AuthsController, 'login'])
router.get('/register', [AuthsController, 'showRegister']).as('auth.register')
router.post('/register', [AuthsController, 'register'])
router.post('/logout', [AuthsController, 'logout']).as('auth.logout')
router.get('/logged-out', [AuthsController, 'signedOut'])

// Password reset routes
router.get('/forgot-password', [AuthsController, 'showForgotPassword']).as('auth.forgot-password')
router.post('/forgot-password', [AuthsController, 'forgotPassword'])
router
  .get('/reset-password/:token', [AuthsController, 'showResetPassword'])
  .as('auth.reset-password')
router.post('/reset-password', [AuthsController, 'resetPassword'])

// User dashboard (protected)
router.get('/userdashboard', [AuthsController, 'userdashboard']).as('user.dashboard')

// ============ ADMIN ROUTES ============
// Page views
router.get('/admin/login', [AuthsController, 'showLogin'])
router.post('/admin/login', [AuthsController, 'login'])
router.post('/admin/logout', [AuthsController, 'logout'])
router.get('/admin/logged-out', [AuthsController, 'signedOut'])
router
  .group(() => {
    router.get('/admin/magazines', [MagazinesController, 'admin'])
    router.post('/admin/magazines', [MagazinesController, 'save'])
    router.post('/admin/magazines/:id', [MagazinesController, 'save'])
    router.delete('/admin/magazines/:id', [MagazinesController, 'destroy'])
    router.get('/admin', [DashboardController, 'index'])
    router.get('/admin/account', [() => import('#controllers/account_controller'), 'show'])
    router.put('/admin/account/delivery', [
      () => import('#controllers/account_controller'),
      'saveDelivery',
    ])
    router.put('/admin/account', [() => import('#controllers/account_controller'), 'update'])
    router.post('/admin/account/presence', [
      () => import('#controllers/account_controller'),
      'presence',
    ])
    router.get('/admin/collections', [DashboardController, 'collections'])
    router.get('/admin/works', [DashboardController, 'works'])
    router.get('/admin/store', [DashboardController, 'store'])
    router.get('/admin/orders', [DashboardController, 'orders'])
    router.get('/admin/activity', [DashboardController, 'activity'])
    router.get('/admin/users', [DashboardController, 'users'])
    router.put('/admin/users/:id', [DashboardController, 'updateUserStatus'])
    router.delete('/admin/users/:id', [DashboardController, 'deleteUser'])
    router.get('/admin/fittings', [DashboardController, 'fittings'])
    router.put('/admin/fittings/:id', [DashboardController, 'updateFitting'])
    router.get('/admin/fittings/:id/reference', [DashboardController, 'fittingReference'])

    // API Routes for dashboard data
    router.get('/admin/stats', [DashboardController, 'stats'])
    router.get('/admin/recent-activity', [DashboardController, 'recentActivity'])
    router.get('/admin/popular-products', [DashboardController, 'popularProducts'])

    // ============ COLLECTION CATEGORIES CRUD (for homepage/works) ============
    router.post('/admin/categories', [DashboardController, 'storeCategory'])
    router.put('/admin/categories/:id', [DashboardController, 'updateCategory'])
    router.delete('/admin/categories/:id', [DashboardController, 'deleteCategory'])

    // ============ STORE CATEGORIES CRUD (for store products) ============
    router.get('/admin/store-categories', [DashboardController, 'getStoreCategories'])
    router.post('/admin/store-categories', [DashboardController, 'storeStoreCategory'])
    router.put('/admin/store-categories/:id', [DashboardController, 'updateStoreCategory'])
    router.delete('/admin/store-categories/:id', [DashboardController, 'deleteStoreCategory'])

    // Collection update (homepage content)
    router.put('/admin/collection', [DashboardController, 'updateCollection'])

    // Works CRUD
    router.post('/admin/works', [DashboardController, 'storeWork'])
    router.put('/admin/works/:id', [DashboardController, 'updateWork'])
    router.delete('/admin/works/:id', [DashboardController, 'deleteWork'])

    // Products CRUD
    router.post('/admin/products', [DashboardController, 'storeProduct'])
    router.put('/admin/products/:id', [DashboardController, 'updateProduct'])
    router.delete('/admin/products/:id', [DashboardController, 'deleteProduct'])

    // Orders
    router.put('/admin/orders/:id/status', [DashboardController, 'updateOrderStatus'])
    router.get('/admin/orders/:id', [DashboardController, 'getOrderDetails'])

    router.delete('/admin/product-images/:id', [DashboardController, 'deleteProductImage'])
  })
  .use([middleware.auth(), middleware.admin()])
router
  .get('/api/account', [() => import('#controllers/account_controller'), 'show'])
  .use(middleware.auth())
router
  .put('/api/account', [() => import('#controllers/account_controller'), 'update'])
  .use(middleware.auth())
router
  .post('/api/account/presence', [() => import('#controllers/account_controller'), 'presence'])
  .use(middleware.auth())

router
  .put('/api/account/delivery', [() => import('#controllers/account_controller'), 'saveDelivery'])
  .use(middleware.auth())

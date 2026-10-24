import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { readFile, unlink } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { User, Order } from '#models/index'
import { browser, json, page } from '../helpers/http.js'

test('admin CRUD, uploads, renamed categories, checkout, tracking, users, fittings and activity stay in sync', async ({
  assert,
}) => {
  const key = randomUUID(),
    password = 'Test-pass-' + key
  const admin = await User.create({
    fullName: 'Workflow admin',
    email: `admin-${key}@example.com`,
    password: await hash.make(password),
    role: 'admin',
    isActive: true,
  })
  const customer = await User.create({
    fullName: 'Workflow customer',
    email: `customer-${key}@example.com`,
    password: await hash.make(password),
    role: 'user',
    isActive: true,
  })
  const owner = browser(),
    shopper = browser(),
    guest = browser()
  let categoryId: number | undefined,
    workId: number | undefined,
    productId: number | undefined,
    storeCategoryId: number | undefined,
    orderId: number | undefined,
    fittingId: number | undefined
  const files: string[] = []
  const accepted = (response: Response) => assert.include([302, 303], response.status)
  async function login(client: ReturnType<typeof browser>, user: User, remember = false) {
    const route = user.role === 'admin' ? '/admin/login' : '/login'
    await client(route)
    accepted(await client(route, json('POST', { email: user.email, password, remember })))
    assert.equal(
      (
        await client(user.role === 'admin' ? '/admin/account' : '/api/account', {
          headers: { Accept: 'application/json' },
        })
      ).status,
      200
    )
  }
  try {
    assert.equal((await guest('/admin/magazines')).status, 302)
    assert.equal(
      (await guest('/api/account', { headers: { Accept: 'application/json' } })).status,
      401
    )
    await login(owner, admin, true)
    await login(shopper, customer)
    for (const route of [
      '/admin',
      '/admin/users',
      '/admin/orders',
      '/admin/stats',
      '/admin/magazines',
    ]) {
      assert.equal((await guest(route)).status, 302)
      assert.equal((await shopper(route)).status, 302)
    }
    assert.equal(
      (await shopper(`/admin/users/${customer.id}`, json('PUT', { role: 'admin' }))).status,
      302
    )
    assert.equal(
      (await guest(`/admin/users/${customer.id}`, json('PUT', { role: 'admin' }))).status,
      302
    )
    assert.equal((await db.from('users').where('id', customer.id).first()).role, 'user')
    assert.equal((await shopper('/api/account/presence', { method: 'POST' })).status, 204)
    let accountListing = (await page(owner, '/admin/users')).props.users.find(
      (item: { id: number }) => item.id === customer.id
    )
    assert.isTrue(accountListing.isOnline)
    assert.isString(accountListing.lastSeenAt)
    accepted(await owner(`/admin/users/${customer.id}`, json('PUT', { role: 'admin' })))
    await shopper('/admin/login')
    accepted(await shopper('/admin/login', json('POST', { email: customer.email, password })))
    assert.equal((await shopper('/admin/users')).status, 200)
    assert.equal(
      (await page(owner, '/admin/users')).props.users.find(
        (item: { id: number }) => item.id === customer.id
      ).role,
      'admin'
    )
    accepted(await owner(`/admin/users/${customer.id}`, json('PUT', { role: 'user' })))
    assert.equal((await shopper('/admin/users')).status, 302)
    assert.isAbove(
      Number(
        (
          await db
            .from('remember_me_tokens')
            .where('tokenable_id', admin.id)
            .count('* as total')
            .first()
        ).total
      ),
      0
    )
    const bytes = await readFile(app.publicPath('images/generated/evening.png'))
    const categoryForm = new FormData()
    categoryForm.set('name', 'Workflow ' + key)
    categoryForm.set('description', 'Original description')
    categoryForm.set('cover_image', new Blob([bytes], { type: 'image/png' }), 'cover.png')
    accepted(await owner('/admin/categories', { method: 'POST', body: categoryForm }))
    let category = await db
      .from('categories')
      .where('name', 'Workflow ' + key)
      .first()
    assert.exists(category)
    categoryId = Number(category.id)
    files.push(category.cover_image)
    const originalSlug = category.slug
    const edit = new FormData()
    edit.set('name', 'Renamed ' + key)
    edit.set('description', 'Saved multipart edit')
    edit.set('cover_image', new Blob([bytes], { type: 'image/png' }), 'updated.png')
    accepted(
      await owner(`/admin/categories/${categoryId}?_method=PUT`, { method: 'POST', body: edit })
    )
    category = await db.from('categories').where('id', categoryId!).first()
    files.push(category.cover_image)
    assert.equal(category.description, 'Saved multipart edit')
    assert.equal(category.slug, originalSlug)
    const work = new FormData()
    work.set('title', 'Work ' + key)
    work.set('description', 'A published work')
    work.set('categoryId', String(categoryId))
    work.set('imageUrl', new Blob([bytes], { type: 'image/png' }), 'work.png')
    accepted(await owner('/admin/works', { method: 'POST', body: work }))
    const storedWork = await db
      .from('works')
      .where('title', 'Work ' + key)
      .first()
    assert.exists(storedWork)
    workId = Number(storedWork.id)
    files.push(storedWork.image_url)
    assert.equal(
      (await page(owner, '/admin/collections')).props.categories.find(
        (item: { id: number }) => item.id === categoryId
      ).works_count,
      1
    )
    assert.include(
      (await page(shopper, '/guests/' + originalSlug)).props.works.map(
        (item: { id: number }) => item.id
      ),
      workId
    )
    accepted(
      await owner(
        `/admin/works/${workId}`,
        json('PUT', { categoryId, title: 'Edited work ' + key, description: 'Updated' })
      )
    )
    assert.equal((await db.from('works').where('id', workId!).first()).title, 'Edited work ' + key)
    accepted(await owner('/admin/store-categories', json('POST', { name: 'Store ' + key })))
    storeCategoryId = Number(
      (
        await db
          .from('store_categories')
          .where('name', 'Store ' + key)
          .first()
      ).id
    )
    const product = new FormData()
    for (const [field, value] of Object.entries({
      name: 'Product ' + key,
      description: 'Test product',
      price: '125',
      stock: '8',
      size: 'S,M',
      store_category: 'Store ' + key,
      color_variations: JSON.stringify([{ name: 'Wine', hex: '#75444d' }]),
      tailor_measurements: JSON.stringify(['waist']),
      allow_custom_tailoring: 'false',
    }))
      product.set(field, value)
    product.set('imageUrl', new Blob([bytes], { type: 'image/png' }), 'product.png')
    product.append('galleryImages', new Blob([bytes], { type: 'image/png' }), 'front.png')
    product.append('galleryImages', new Blob([bytes], { type: 'image/png' }), 'back.png')
    accepted(await owner('/admin/products', { method: 'POST', body: product }))
    const storedProduct = await db
      .from('products')
      .where('name', 'Product ' + key)
      .first()
    assert.exists(storedProduct)
    productId = Number(storedProduct.id)
    files.push(storedProduct.image_url)
    const gallery = await db
      .from('product_images')
      .where('product_id', productId)
      .orderBy('sort_order')
    assert.equal(gallery.length, 2)
    for (const image of gallery) {
      files.push(image.image_url)
      assert.match(image.image_url, /^\/uploads\/products\//)
    }
    assert.equal(Number(storedProduct.allow_custom_tailoring), 0)
    accepted(
      await owner(
        `/admin/store-categories/${storeCategoryId}`,
        json('PUT', { name: 'New store ' + key })
      )
    )
    assert.equal(
      (await db.from('products').where('id', productId!).first()).store_category,
      'New store ' + key
    )
    const productEdit = new FormData()
    for (const [field, value] of Object.entries({
      name: 'Product ' + key,
      price: '150',
      stock: '8',
      size: 'M',
      store_category: 'New store ' + key,
      allow_custom_tailoring: 'false',
      color_variations: '[]',
      tailor_measurements: '[]',
    }))
      productEdit.set(field, value)
    productEdit.set('removed_images', JSON.stringify([gallery[0].id]))
    accepted(
      await owner(`/admin/products/${productId}?_method=PUT`, { method: 'POST', body: productEdit })
    )
    const publicProducts = (await (await shopper('/api/products')).json()) as {
      id: number
      price: number
      allowCustomTailoring: boolean
      images: { id: number }[]
    }[]
    assert.equal(Number(publicProducts.find((item) => item.id === productId)!.price), 150)
    assert.isFalse(publicProducts.find((item) => item.id === productId)!.allowCustomTailoring)
    assert.deepEqual(
      publicProducts.find((item) => item.id === productId)!.images.map((image) => image.id),
      [gallery[1].id]
    )
    const tooManyPhotos = new FormData()
    productEdit.forEach((value, field) => tooManyPhotos.append(field, value))
    for (let index = 0; index < 3; index++)
      tooManyPhotos.append(
        'galleryImages',
        new Blob([bytes], { type: 'image/png' }),
        `extra-${index}.png`
      )
    accepted(
      await owner(`/admin/products/${productId}?_method=PUT`, {
        method: 'POST',
        body: tooManyPhotos,
      })
    )
    assert.property((await page(owner, '/admin/store')).props.errors, 'galleryImages')
    assert.equal(
      (await db.from('product_images').where('product_id', productId).count('* as total').first())
        .total,
      1
    )
    const invalidProduct = new FormData()
    productEdit.forEach((value, field) => invalidProduct.set(field, value))
    invalidProduct.set('price', '-2')
    accepted(
      await owner(`/admin/products/${productId}?_method=PUT`, {
        method: 'POST',
        body: invalidProduct,
      })
    )
    assert.property((await page(owner, '/admin/store')).props.errors, 'price')
    assert.equal(Number((await db.from('products').where('id', productId!).first()).price), 150)
    assert.equal((await shopper('/api/wishlist', json('POST', { productId }, true))).status, 200)
    assert.equal(
      (await shopper('/api/cart', json('POST', { productId, size: 'M', quantity: 2 }, true)))
        .status,
      200
    )
    const deliveryAddress = {
      recipient: 'Delivery fixture',
      phone: '+2348012345678',
      address: '12 Studio Street',
      city: 'Ikeja',
      state: 'Lagos',
      country: 'Nigeria',
    }
    assert.equal((await shopper('/api/account/delivery', json('PUT', {}, true))).status, 422)
    assert.equal(
      (await shopper('/api/account/delivery', json('PUT', deliveryAddress, true))).status,
      200
    )
    const savedAccount = await (await shopper('/api/account')).json() as { deliveryAddress: { city: string } }
    assert.equal(savedAccount.deliveryAddress.city, 'Ikeja')
    const otherAccount = await (await owner('/admin/account')).json() as { deliveryAddress: unknown }
    assert.isNull(otherAccount.deliveryAddress)
    assert.equal((await guest('/api/account/delivery', json('PUT', deliveryAddress, true))).status, 401)
    const checkoutOptions = json(
      'POST',
      {
        items: [{ id: productId, name: 'Forged title', price: 1, quantity: 2, selectedSize: 'M' }],
      },
      true
    )
    checkoutOptions.headers = { ...checkoutOptions.headers, 'Idempotency-Key': key }
    let checkout = await shopper('/api/orders', checkoutOptions)
    assert.equal(checkout.status, 200)
    let order = ((await checkout.json()) as { order: { id: number; totalAmount: number } }).order
    orderId = order.id
    const originalDelivery = await Order.findOrFail(orderId)
    assert.include(originalDelivery.shippingAddress!, '12 Studio Street')
    assert.equal(originalDelivery.customerPhone, deliveryAddress.phone)
    await shopper(
      '/api/account/delivery',
      json('PUT', { ...deliveryAddress, address: '45 New Street' }, true)
    )
    assert.include((await Order.findOrFail(orderId)).shippingAddress!, '12 Studio Street')
    assert.equal(Number(order.totalAmount), 300)
    assert.equal((await db.from('orders').where('id', orderId).first()).payment_status, 'pending')
    assert.equal(Number((await db.from('products').where('id', productId!).first()).stock), 6)
    checkout = await shopper('/api/orders', checkoutOptions)
    assert.equal(checkout.status, 200)
    assert.equal(((await checkout.json()) as { order: { id: number } }).order.id, orderId)
    assert.equal(Number((await db.from('products').where('id', productId!).first()).stock), 6)
    const detail = (await (await owner(`/admin/orders/${orderId}`)).json()) as {
      items: { product_name: string }[]
      customer_email: string
    }
    assert.equal(detail.items[0].product_name, 'Product ' + key)
    assert.equal(detail.customer_email, customer.email)
    accepted(
      await owner(
        `/admin/orders/${orderId}/status`,
        json('PUT', { trackingStage: 'shipped', paymentStatus: 'paid' })
      )
    )
    let row = await db.from('orders').where('id', orderId).first()
    assert.equal(row.status, 'shipped')
    assert.isNotNull(row.shipped_at)
    const mine = (await (await shopper('/api/orders')).json()) as {
      orders: { id: number; trackingStage: string }[]
    }
    assert.equal(mine.orders.find((item) => item.id === orderId)!.trackingStage, 'shipped')
    const account = (await (await shopper('/api/account')).json()) as {
      notifications: { id: string; title: string }[]
    }
    assert.include(
      account.notifications.find((item) => item.id === 'order-' + orderId)!.title,
      'shipped'
    )
    accepted(await owner(`/admin/orders/${orderId}/status`, json('PUT', { status: 'cancelled' })))
    assert.equal(Number((await db.from('products').where('id', productId!).first()).stock), 8)
    accepted(await owner(`/admin/orders/${orderId}/status`, json('PUT', { status: 'cancelled' })))
    assert.equal(Number((await db.from('products').where('id', productId!).first()).stock), 8)
    accepted(await owner(`/admin/orders/${orderId}/status`, json('PUT', { status: 'delivered' })))
    row = await db.from('orders').where('id', orderId).first()
    assert.equal(row.tracking_stage, 'delivered')
    assert.isNotNull(row.delivered_at)
    assert.equal(Number((await db.from('products').where('id', productId!).first()).stock), 6)
    const invalid = await owner(
      `/admin/orders/${orderId}/status`,
      json('PUT', { status: 'made-up' }, true)
    )
    assert.equal(invalid.status, 422)
    const inserted = await db.table('fitting_requests').insert({
      name: 'Test fitting',
      email: customer.email,
      phone: '08012345678',
      service: 'Consultation',
      preferred_date: '2099-01-01',
      notes: 'Fixture fitting request',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    })
    fittingId = Number(inserted[0])
    accepted(await owner(`/admin/fittings/${fittingId}`, json('PUT', { status: 'contacted' })))
    assert.equal(
      (await db.from('fitting_requests').where('id', fittingId).first()).status,
      'contacted'
    )
    for (const tab of [
      'collections',
      'works',
      'store',
      'orders',
      'users',
      'activity',
      'fittings',
    ]) {
      const rendered = await page(owner, '/admin/' + tab)
      assert.equal(rendered.props.activeTab, tab)
      assert.include(
        rendered.props.users.map((item: { id: number }) => item.id),
        customer.id
      )
      assert.notProperty(
        rendered.props.users.find((item: { id: number }) => item.id === customer.id),
        'password'
      )
      assert.notProperty(
        rendered.props.users.find((item: { id: number }) => item.id === customer.id),
        'resetToken'
      )
    }
    const dashboard = await page(owner, '/admin')
    assert.include(
      dashboard.props.activities.map((item: { type: string }) => item.type),
      'order_update'
    )
    assert.include(
      dashboard.props.activities.map((item: { type: string }) => item.type),
      'cart'
    )
    assert.isAtLeast(dashboard.props.stats.totalRevenue, 300)
    accepted(await owner(`/admin/users/${customer.id}`, json('PUT', { isActive: false })))
    assert.equal((await shopper('/admin')).status, 302)
    assert.equal(
      (
        await shopper('/api/account/presence', {
          method: 'POST',
          headers: { Accept: 'application/json' },
        })
      ).status,
      401
    )
    assert.equal(
      (await shopper('/api/account', { headers: { Accept: 'application/json' } })).status,
      401
    )
    accepted(await owner(`/admin/users/${customer.id}`, json('PUT', { isActive: true })))
    assert.equal(
      (await shopper('/api/account', { headers: { Accept: 'application/json' } })).status,
      200
    )
    accepted(await owner(`/admin/users/${admin.id}`, json('PUT', { isActive: false })))
    assert.property((await page(owner, '/admin/users')).props.errors, 'form')
    assert.equal(Number((await db.from('users').where('id', admin.id).first()).is_active), 1)
    accepted(await owner(`/admin/works/${workId}`, { method: 'DELETE' }))
    workId = undefined
    accepted(await owner(`/admin/categories/${categoryId}`, { method: 'DELETE' }))
    categoryId = undefined
    accepted(await owner(`/admin/store-categories/${storeCategoryId}`, { method: 'DELETE' }))
    storeCategoryId = undefined
    assert.isNull((await db.from('products').where('id', productId!).first()).store_category)
    accepted(await owner(`/admin/products/${productId}`, { method: 'DELETE' }))
    productId = undefined
    assert.isNull((await db.from('order_items').where('order_id', orderId).first()).product_id)
  } finally {
    await db.from('activities').whereIn('user_id', [admin.id, customer.id]).delete()
    if (categoryId) {
      await db
        .from('activities')
        .where('entity_type', 'category')
        .where('entity_id', categoryId)
        .delete()
      await db.from('categories').where('id', categoryId).delete()
    }
    if (workId) await db.from('works').where('id', workId).delete()
    if (orderId) await db.from('orders').where('id', orderId).delete()
    if (productId) await db.from('products').where('id', productId).delete()
    if (storeCategoryId) await db.from('store_categories').where('id', storeCategoryId).delete()
    if (fittingId) await db.from('fitting_requests').where('id', fittingId).delete()
    await customer.delete()
    await admin.delete()
    await Promise.all(
      files.filter(Boolean).map((url) => unlink(app.publicPath(url.slice(1))).catch(() => {}))
    )
  }
}).timeout(120000)

test('profile updates persist, protect password changes, and keep sessions', async ({ assert }) => {
  const key = randomUUID(),
    password = 'Profile-old-' + key,
    next = 'Profile-new-' + key
  const user = await User.create({
    fullName: 'Profile test',
    email: `profile-${key}@example.com`,
    password: await hash.make(password),
    role: 'user',
    isActive: true,
  })
  const client = browser()
  try {
    await client('/login')
    await client('/login', json('POST', { email: user.email, password, remember: true }))
    assert.equal((await client('/api/account')).status, 200)
    const initial = (await page(client, '/custom')).props.auth.user
    assert.equal(initial.id, user.id)
    assert.notProperty(initial, 'password')
    const name = await client(
      '/api/account',
      json('PUT', { fullName: 'New profile name', email: user.email }, true)
    )
    assert.equal(name.status, 200)
    assert.equal(
      (await db.from('users').where('id', user.id).first()).full_name,
      'New profile name'
    )
    const newEmail = `new-${key}@example.com`
    assert.equal(
      (
        await client(
          '/api/account',
          json('PUT', { fullName: 'New profile name', email: newEmail }, true)
        )
      ).status,
      422
    )
    assert.equal((await db.from('users').where('id', user.id).first()).email, user.email)
    const update = await client(
      '/api/account',
      json(
        'PUT',
        {
          fullName: 'New profile name',
          email: newEmail,
          currentPassword: password,
          newPassword: next,
          passwordConfirmation: next,
        },
        true
      )
    )
    assert.equal(update.status, 200)
    const saved = await db.from('users').where('id', user.id).first()
    assert.equal(saved.email, newEmail)
    assert.isTrue(await hash.verify(saved.password, next))
    assert.equal(
      Number(
        (
          await db
            .from('remember_me_tokens')
            .where('tokenable_id', user.id)
            .count('* as total')
            .first()
        ).total
      ),
      0
    )
    assert.equal((await client('/login')).status, 302)
    assert.equal((await client('/api/account')).status, 200)
    await client('/logout', { method: 'POST' })
    assert.equal(
      (await client('/api/account', { headers: { Accept: 'application/json' } })).status,
      401
    )
    await client('/login')
    await client('/login', json('POST', { email: newEmail, password: next }))
    assert.equal((await client('/api/account')).status, 200)
  } finally {
    await user.delete()
  }
}).timeout(60000)

test('only the reserved first-admin signup grants admin; later registrations cannot choose their role', async ({
  assert,
}) => {
  const key = randomUUID()
  const reserved = 'setup-' + key + '@example.com'
  const original = await db.from('admin_setup').where('id', 1).firstOrFail()
  const hasAdmin = Boolean(await User.query().where('role', 'admin').first())
  const createdIds: number[] = []
  const regular = browser(),
    first = browser(),
    later = browser()
  const password = 'Setup-password-' + key
  const signup = async (client: ReturnType<typeof browser>, email: string) => {
    await client('/register')
    const response = await client(
      '/register',
      json('POST', {
        fullName: 'Setup fixture',
        email,
        password,
        passwordConfirmation: password,
        terms: true,
        role: 'admin',
        isActive: true,
      })
    )
    assert.equal(response.status, 302)
    const user = await User.findByOrFail('email', email)
    createdIds.push(user.id)
    return user
  }
  try {
    if (!hasAdmin)
      await db
        .from('admin_setup')
        .where('id', 1)
        .update({ reserved_email: reserved, claimed_at: null })
    const ordinary = await signup(regular, 'regular-' + key + '@example.com')
    assert.equal(ordinary.role, 'user')
    assert.equal((await regular('/admin')).status, 302)
    const admin = await signup(first, reserved)
    assert.equal(admin.role, hasAdmin ? 'user' : 'admin')
    if (hasAdmin) {
      assert.equal((await first('/admin')).status, 302)
      admin.role = 'admin'
      await admin.save()
    }
    await first('/admin/login')
    await first('/admin/login', json('POST', { email: reserved, password }))
    assert.equal((await first('/admin')).status, 200)
    if (!hasAdmin)
      assert.isNotNull((await db.from('admin_setup').where('id', 1).first()).claimed_at)
    const subsequent = await signup(later, 'later-' + key + '@example.com')
    assert.equal(subsequent.role, 'user')
    assert.equal((await later('/admin')).status, 302)
    const beforeLogout = await User.findOrFail(admin.id)
    const protectedPage = await first('/admin', {
      headers: { 'X-Inertia': 'true', 'Accept': 'application/json' },
    })
    assert.include(protectedPage.headers.get('Cache-Control') || '', 'no-store')
    assert.isTrue(((await protectedPage.json()) as { encryptHistory: boolean }).encryptHistory)
    const logout = await first('/admin/logout', { method: 'POST' })
    assert.equal(logout.headers.get('Location'), '/admin/logged-out')
    const signedOut = await first('/admin/logged-out', {
      headers: { 'X-Inertia': 'true', 'Accept': 'application/json' },
    })
    const screen = (await signedOut.json()) as { component: string; clearHistory: boolean }
    assert.equal(screen.component, 'auth/logged-out')
    assert.isTrue(screen.clearHistory)
    assert.equal((await first('/admin')).status, 302)
    assert.equal((await first('/admin/users')).status, 302)
    assert.equal(
      (await first('/admin/account', { headers: { Accept: 'application/json' } })).status,
      401
    )
    const afterLogout = await User.findOrFail(admin.id)
    assert.isFalse(afterLogout.presenceOnline)
    assert.equal(afterLogout.lastSeenAt?.toISO(), beforeLogout.lastSeenAt?.toISO())
  } finally {
    await db.from('users').whereIn('id', createdIds).delete()
    await db
      .from('admin_setup')
      .where('id', 1)
      .where('reserved_email', reserved)
      .update({ reserved_email: original.reserved_email, claimed_at: original.claimed_at })
  }
}).timeout(60000)


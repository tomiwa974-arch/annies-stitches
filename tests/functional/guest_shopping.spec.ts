import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { User, Product, CartItem, WishlistItem } from '#models/index'
import { browser, json } from '../helpers/http.js'

test('guest lists merge once into existing account lists, preserve variants and ignore client prices', async ({
  assert,
}) => {
  const key = randomUUID(),
    password = 'Shopping-' + key
  const user = await User.create({
    email: 'shopping-' + key + '@example.com',
    fullName: 'Shopping fixture',
    password: await hash.make(password),
    role: 'user',
    isActive: true,
  })
  const product = await Product.create({
    name: 'Guest shopping fixture',
    description: 'Fixture',
    price: 150,
    stock: 20,
    size: 'M,L',
    isActive: true,
  })
  const client = browser(),
    guest = browser()
  const payload = {
    id: randomUUID(),
    cart: [
      {
        id: product.id,
        name: 'Forged',
        price: 1,
        selectedSize: 'M',
        quantity: 2,
        color: 'Green',
        isCustomTailored: true,
        tailorMeasurements: { waist: '28' },
      },
    ],
    wishlist: [product.id],
  }
  try {
    await client('/login')
    await guest('/store')
    assert.equal((await guest('/api/orders', json('POST', { items: [] }, true))).status, 401)
    assert.equal((await guest('/api/shopping/merge', json('POST', payload, true))).status, 401)
    const login = await client(
      '/login',
      json('POST', { email: user.email, password, redirect: '/store?checkout=1' })
    )
    assert.equal(login.headers.get('Location'), '/store?checkout=1')
    await CartItem.create({
      userId: user.id,
      productId: product.id,
      size: 'M',
      color: 'Green',
      quantity: 1,
    })
    await WishlistItem.create({ userId: user.id, productId: product.id })
    for (let i = 0; i < 2; i++)
      assert.equal((await client('/api/shopping/merge', json('POST', payload, true))).status, 200)
    const cart = (await (await client('/api/cart')).json()) as {
      cart: { price: number; quantity: number; color: string }[]
    }
    assert.equal(cart.cart.length, 1)
    assert.equal(cart.cart[0].quantity, 3)
    assert.equal(Number(cart.cart[0].price), 150)
    assert.equal(cart.cart[0].color, 'Green')
    assert.equal(
      Number(
        (await db.from('wishlist_items').where('user_id', user.id).count('* as total').first())
          .total
      ),
      1
    )
    const variant = { ...payload, id: randomUUID(), cart: [{ ...payload.cart[0], color: 'Blue' }] }
    assert.equal((await client('/api/shopping/merge', json('POST', variant, true))).status, 200)
    const stored = await CartItem.query()
      .where('userId', user.id)
      .where('color', 'Blue')
      .firstOrFail()
    assert.deepEqual(stored.tailorMeasurements, { waist: '28' })
    assert.isTrue(stored.isCustomTailored)
    const invalid = { ...payload, id: randomUUID(), cart: [{ ...payload.cart[0], quantity: -1 }] }
    assert.equal((await client('/api/shopping/merge', json('POST', invalid, true))).status, 422)
  } finally {
    await db.from('users').where('id', user.id).delete()
    await product.delete()
  }
}).timeout(60000)

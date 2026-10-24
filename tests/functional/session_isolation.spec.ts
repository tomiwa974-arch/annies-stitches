import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import { User } from '#models/index'
import { browser, json } from '../helpers/http.js'

test('admin and customer sessions remain independent in one cookie jar, including remembered logins and CSRF', async ({
  assert,
}) => {
  const key = randomUUID(),
    password = 'Isolation-' + key
  const owner = await User.create({
    email: 'owner-' + key + '@example.com',
    fullName: 'Isolation admin',
    password: await hash.make(password),
    role: 'admin',
    isActive: true,
  })
  const customer = await User.create({
    email: 'customer-' + key + '@example.com',
    fullName: 'Isolation customer',
    password: await hash.make(password),
    role: 'user',
    isActive: true,
  })
  const client = browser()
  const account = async (path: string) => {
    const response = await client(path, { headers: { Accept: 'application/json' } })
    return { status: response.status, data: (await response.json()) as { user?: { id: number } } }
  }
  try {
    await client('/admin/login')
    assert.equal(
      (await client('/admin/login', json('POST', { email: owner.email, password, remember: true })))
        .status,
      302
    )
    assert.equal((await account('/admin/account')).data.user?.id, owner.id)
    assert.equal((await account('/api/account')).status, 401)
    await client('/login')
    await client('/login', json('POST', { email: customer.email, password, remember: true }))
    assert.equal((await account('/api/account')).data.user?.id, customer.id)
    assert.equal((await account('/admin/account')).data.user?.id, owner.id)
    assert.equal((await client('/admin/account/presence', { method: 'POST' })).status, 204)
    assert.equal((await client('/api/account/presence', { method: 'POST' })).status, 204)
    await client('/logout', { method: 'POST' })
    assert.equal((await account('/api/account')).status, 401)
    assert.equal((await account('/admin/account')).data.user?.id, owner.id)
    await client('/login')
    await client('/login', json('POST', { email: owner.email, password, remember: true }))
    assert.equal((await account('/api/account')).data.user?.id, owner.id)
    const logout = await client('/admin/logout', { method: 'POST' })
    assert.equal(logout.headers.get('Location'), '/admin/logged-out')
    assert.equal((await account('/admin/account')).status, 401)
    assert.equal((await account('/api/account')).data.user?.id, owner.id)
    await client('/admin/login')
    await client('/admin/login', json('POST', { email: customer.email, password }))
    const denied = await client('/admin')
    assert.equal(denied.status, 302)
    assert.include(denied.headers.get('Location') || '', '/admin/login')
  } finally {
    await owner.delete()
    await customer.delete()
  }
}).timeout(60000)

import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { readFile, unlink } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'

test('fitting requests save optional reference images and reject invalid uploads', async ({
  assert,
}) => {
  const base = `http://${env.get('HOST')}:${env.get('PORT')}`
  const cookies = new Map<string, string>()
  async function visit(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers)
    headers.set('Cookie', Array.from(cookies, ([key, value]) => key + '=' + value).join('; '))
    headers.set('Referer', base + '/custom')
    if (cookies.has('XSRF-TOKEN'))
      headers.set('X-XSRF-TOKEN', decodeURIComponent(cookies.get('XSRF-TOKEN')!))
    const response = await fetch(base + path, { ...options, headers, redirect: 'manual' })
    for (const cookie of response.headers.getSetCookie()) {
      const first = cookie.split(';')[0],
        equals = first.indexOf('=')
      cookies.set(first.slice(0, equals), first.slice(equals + 1))
    }
    return response
  }
  const email = 'fitting-' + randomUUID() + '@example.com'
  function form() {
    const body = new FormData()
    for (const [key, value] of Object.entries({
      name: 'Upload test',
      email,
      phone: '+2348012345678',
      service: 'Consultation',
      preferredDate: '2099-01-01',
      notes: 'Please use this reference for my dress inspiration.',
    }))
      body.set(key, value)
    return body
  }
  try {
    await visit('/custom')
    assert.equal((await visit('/custom/bookings', { method: 'POST', body: form() })).status, 302)
    const basic = await db.from('fitting_requests').where('email', email).first()
    assert.isNotNull(basic)
    assert.isNull(basic.reference_image)
    const bytes = await readFile(app.publicPath('images/generated/evening.png'))
    const body = form()
    body.set('referenceImage', new Blob([bytes], { type: 'image/png' }), 'inspiration.png')
    assert.equal((await visit('/custom/bookings', { method: 'POST', body })).status, 302)
    const saved = await db
      .from('fitting_requests')
      .where('email', email)
      .whereNotNull('reference_image')
      .first()
    assert.isNotNull(saved)
    assert.match(saved.reference_image, /^[a-f0-9-]+\.png$/)
    assert.deepEqual(
      await readFile(app.makePath('storage/fitting-references', saved.reference_image)),
      bytes
    )
    assert.equal((await visit('/uploads/fitting-references/' + saved.reference_image)).status, 404)
    for (const [name, image] of [
      ['invalid.svg', new Blob(['<svg></svg>'], { type: 'image/svg+xml' })],
      ['large.png', new Blob([bytes, new Uint8Array(8 * 1024 * 1024)], { type: 'image/png' })],
    ] as const) {
      const invalid = form()
      invalid.set('referenceImage', image, name)
      assert.equal((await visit('/custom/bookings', { method: 'POST', body: invalid })).status, 302)
      const result = await visit('/custom', { headers: { 'X-Inertia': 'true' } })
      const page = (await result.json()) as { props: { errors: Record<string, string> } }
      assert.isString(page.props.errors.referenceImage)
    }
    const count = await db
      .from('fitting_requests')
      .where('email', email)
      .count('* as total')
      .first()
    assert.equal(Number(count.total), 2)
  } finally {
    const rows = await db
      .from('fitting_requests')
      .where('email', email)
      .whereNotNull('reference_image')
    await db.from('fitting_requests').where('email', email).delete()
    await Promise.all(
      rows.map((row) =>
        unlink(app.makePath('storage/fitting-references', row.reference_image)).catch(() => {})
      )
    )
  }
})

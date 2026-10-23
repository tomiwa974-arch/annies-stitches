import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { readFile, unlink } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import { User } from '#models/index'

const base = () => `http://${env.get('HOST')}:${env.get('PORT')}`
function browser() {
  const cookies = new Map<string, string>()
  return async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)
    headers.set('Cookie', Array.from(cookies, ([name, value]) => name + '=' + value).join('; '))
    headers.set('Referer', base() + '/admin/magazines')
    if (cookies.has('XSRF-TOKEN'))
      headers.set('X-XSRF-TOKEN', decodeURIComponent(cookies.get('XSRF-TOKEN')!))
    const response = await fetch(base() + path, { ...options, headers, redirect: 'manual' })
    for (const cookie of response.headers.getSetCookie()) {
      const first = cookie.split(';')[0],
        equals = first.indexOf('=')
      cookies.set(first.slice(0, equals), first.slice(equals + 1))
    }
    return response
  }
}
async function page(response: Response) {
  const html = await response.text(),
    data = html.match(/data-page="([^"]+)"/)
  if (!data) throw new Error('Expected an Inertia page, got ' + response.status)
  return JSON.parse(
    data[1]
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
  )
}

test('admin can upload, reorder, publish, unpublish, and delete an issue; guests cannot edit or see drafts', async ({
  assert,
}) => {
  const token = randomUUID(),
    password = 'Magazine-test-' + token
  const title = 'Functional magazine ' + token
  const users: User[] = []
  const uploads: string[] = []
  let issueId: number | undefined
  try {
    const guest = browser()
    const blocked = await guest('/admin/magazines')
    assert.equal(blocked.status, 302)
    assert.include(blocked.headers.get('location') || '', '/login')
    for (const role of ['admin', 'user'])
      users.push(
        await User.create({
          fullName: 'Magazine test',
          email: `magazine-${role}-${token}@example.com`,
          password: await hash.make(password),
          role,
          isActive: true,
        })
      )
    const admin = browser()
    await admin('/login')
    const login = await admin('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: users[0].email, password }),
    })
    assert.equal(login.status, 302)
    assert.equal((await admin('/admin/magazines')).status, 200)
    const nonAdmin = browser()
    await nonAdmin('/login')
    await nonAdmin('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: users[1].email, password }),
    })
    assert.equal((await nonAdmin('/admin/magazines')).status, 302)
    const issuePages = [
      {
        layout: 'photo',
        title: 'Uploaded page',
        body: '',
        imageUrl: null,
        imageAlt: 'Generated fashion test image',
      },
      {
        layout: 'paper',
        title: 'Written page',
        body: 'A write-up for the saved magazine.',
        imageUrl: null,
        imageAlt: '',
      },
    ]
    const form = new FormData()
    form.set('title', title)
    form.set('issueLabel', 'Test')
    form.set('status', 'draft')
    form.set('pages', JSON.stringify(issuePages))
    form.set(
      'page_image_0',
      new Blob([await readFile(app.publicPath('images/generated/corset.png'))], {
        type: 'image/png',
      }),
      'generated-test.png'
    )
    form.set(
      'page_image_1',
      new Blob([await readFile(app.publicPath('images/generated/menswear.png'))], {
        type: 'image/png',
      }),
      'generated-menswear.png'
    )
    const created = await admin('/admin/magazines', { method: 'POST', body: form })
    assert.equal(created.status, 302)
    let saved = await db.from('magazines').where('title', title).first()
    assert.exists(saved)
    issueId = Number(saved.id)
    assert.match(saved.cover_image, /^\/uploads\/magazines\/[\w-]+\.png$/)
    uploads.push(saved.cover_image)
    assert.equal((await guest(`/magazine/${issueId}`)).status, 404)
    const storedPages = await db
      .from('magazine_pages')
      .where('magazine_id', issueId)
      .orderBy('sort_order')
    for (const stored of storedPages)
      if (stored.image_url && !uploads.includes(stored.image_url)) uploads.push(stored.image_url)
    const update = {
      title,
      issueLabel: 'Test',
      status: 'published',
      coverImage: saved.cover_image,
      pages: JSON.stringify([
        { ...issuePages[1], imageUrl: storedPages[1].image_url },
        { ...issuePages[0], imageUrl: storedPages[0].image_url },
      ]),
    }
    const published = await admin(`/admin/magazines/${issueId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    assert.equal(published.status, 302)
    const publicIssue = await page(await guest(`/magazine/${issueId}`))
    const issue = publicIssue.props.magazines.find((item: { id: number }) => item.id === issueId)
    assert.deepEqual(
      issue.pages.map((item: { title: string }) => item.title),
      ['Written page', 'Uploaded page']
    )
    assert.equal(publicIssue.props.selectedId, issueId)
    assert.equal(
      (
        await nonAdmin(`/admin/magazines/${issueId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...update, title: 'Unauthorized edit' }),
        })
      ).status,
      302
    )
    saved = await db.from('magazines').where('id', issueId).first()
    assert.equal(saved.title, title)
    const invalid = await admin(`/admin/magazines/${issueId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...update, coverImage: 'https://example.com/image.svg' }),
    })
    assert.equal(invalid.status, 302)
    const invalidPage = await page(await admin('/admin/magazines'))
    assert.property(invalidPage.props.errors, 'coverImage')
    const missingPhoto = await admin(`/admin/magazines/${issueId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...update,
        pages: JSON.stringify([{ layout: 'photo', title: 'Needs an image' }]),
      }),
    })
    assert.equal(missingPhoto.status, 302)
    const missingPhotoPage = await page(await admin('/admin/magazines'))
    assert.isString(missingPhotoPage.props.errors['pages.0.imageUrl'])
    const unpublish = await admin(`/admin/magazines/${issueId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...update, status: 'draft' }),
    })
    assert.equal(unpublish.status, 302)
    assert.equal((await guest(`/magazine/${issueId}`)).status, 404)
    const removed = await admin(`/admin/magazines/${issueId}`, { method: 'DELETE' })
    assert.equal(removed.status, 302)
    assert.isNull(await db.from('magazines').where('id', issueId).first())
    assert.lengthOf(await db.from('magazine_pages').where('magazine_id', issueId), 0)
  } finally {
    if (issueId) await db.from('magazines').where('id', issueId).delete()
    for (const user of users) await user.delete()
    for (const image of uploads) await unlink(app.publicPath(image.slice(1))).catch(() => {})
  }
}).timeout(60000)

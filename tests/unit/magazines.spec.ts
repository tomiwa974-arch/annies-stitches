import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import { magazineValidator } from '#validators/magazine'
import { listMagazines, saveMagazine } from '#services/magazines'
import type { MagazineData } from '../../shared/magazine.js'

function fixture(): Omit<MagazineData, 'id'> {
  return {
    title: 'Magazine test ' + randomUUID(),
    issueLabel: 'Test issue',
    description: 'Test fixture',
    status: 'draft',
    coverImage: '/images/generated/evening.png',
    pages: [
      {
        layout: 'paper',
        title: 'First page',
        kicker: '',
        body: 'Original first page.',
        imageUrl: null,
        imageAlt: '',
      },
      {
        layout: 'photo',
        title: 'Second page',
        kicker: '',
        body: '',
        imageUrl: '/images/generated/menswear.png',
        imageAlt: 'Menswear',
      },
    ],
  }
}

test('magazine validation accepts writing, image pages, and empty optional fields', async ({
  assert,
}) => {
  const valid = await magazineValidator.validate(fixture())
  assert.equal(valid.pages.length, 2)
  assert.equal(valid.pages[1].layout, 'photo')
})
test('magazine validation rejects unsafe image paths, empty issues, and invalid visibility', async ({
  assert,
}) => {
  for (const invalid of [
    { coverImage: 'https://example.com/image.svg' },
    { coverImage: '/uploads/magazines/../secret' },
    { pages: [] },
    { status: 'publicly-visible' },
  ])
    await assert.rejects(() => magazineValidator.validate({ ...fixture(), ...invalid }))
})
test('magazines keep page order, hide drafts, update atomically, and cascade deletion', async ({
  assert,
}) => {
  let id: number | undefined
  try {
    const data = fixture()
    id = await saveMagazine(data)
    assert.isFalse((await listMagazines()).some((issue) => issue.id === id))
    let issue = (await listMagazines(false)).find((item) => item.id === id)!
    assert.deepEqual(
      issue.pages.map((page) => page.title),
      ['First page', 'Second page']
    )
    await saveMagazine({ ...data, status: 'published', pages: [data.pages[1], data.pages[0]] }, id)
    issue = (await listMagazines()).find((item) => item.id === id)!
    assert.deepEqual(
      issue.pages.map((page) => page.title),
      ['Second page', 'First page']
    )
    const brokenPage = {
      ...data.pages[0],
      get title(): string {
        throw new Error('Simulated page serialization failure')
      },
    }
    await assert.rejects(() =>
      saveMagazine({ ...data, title: 'Should roll back', pages: [brokenPage] }, id)
    )
    issue = (await listMagazines(false)).find((item) => item.id === id)!
    assert.equal(issue.title, data.title)
    assert.deepEqual(
      issue.pages.map((page) => page.title),
      ['Second page', 'First page']
    )
    await db.from('magazines').where('id', id).delete()
    const rows = await db.from('magazine_pages').where('magazine_id', id)
    assert.lengthOf(rows, 0)
  } finally {
    if (id) await db.from('magazines').where('id', id).delete()
  }
})

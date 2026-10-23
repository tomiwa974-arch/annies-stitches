import db from '@adonisjs/lucid/services/db'
import type { MagazineData, MagazinePageData } from '../../shared/magazine.js'

export async function listMagazines(publishedOnly = true): Promise<MagazineData[]> {
  const query = db.from('magazines').orderBy('id', 'asc')
  if (publishedOnly) query.where('status', 'published')
  const issues = await query
  if (!issues.length) return []
  const pages = await db
    .from('magazine_pages')
    .whereIn(
      'magazine_id',
      issues.map((issue) => issue.id)
    )
    .orderBy('sort_order', 'asc')
  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    issueLabel: issue.issue_label || '',
    description: issue.description || '',
    coverImage: issue.cover_image,
    status: issue.status,
    pages: pages
      .filter((page) => page.magazine_id === issue.id)
      .map((page) => ({
        id: page.id,
        layout: page.layout,
        kicker: page.kicker || '',
        title: page.title || '',
        body: page.body || '',
        imageUrl: page.image_url,
        imageAlt: page.image_alt || '',
      })),
  }))
}

export async function saveMagazine(data: Omit<MagazineData, 'id'>, id?: number) {
  return db.transaction(async (trx) => {
    const record = {
      title: data.title,
      issue_label: data.issueLabel,
      description: data.description,
      cover_image: data.coverImage,
      status: data.status,
      updated_at: new Date(),
    }
    let issueId = id
    if (issueId) {
      const existing = await trx.from('magazines').where('id', issueId).forUpdate().first()
      if (!existing) throw new Error('Magazine not found')
      await trx.from('magazines').where('id', issueId).update(record)
      await trx.from('magazine_pages').where('magazine_id', issueId).delete()
    } else {
      const inserted = await trx.table('magazines').insert({ ...record, created_at: new Date() })
      issueId = Number(inserted[0])
    }
    await trx.table('magazine_pages').multiInsert(
      data.pages.map((page: MagazinePageData, index: number) => ({
        magazine_id: issueId,
        layout: page.layout,
        kicker: page.kicker,
        title: page.title,
        body: page.body,
        image_url: page.imageUrl,
        image_alt: page.imageAlt,
        sort_order: index,
        created_at: new Date(),
        updated_at: new Date(),
      }))
    )
    return issueId
  })
}

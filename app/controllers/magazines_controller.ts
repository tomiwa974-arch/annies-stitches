import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import { mkdir, unlink } from 'node:fs/promises'
import { listMagazines, saveMagazine } from '#services/magazines'
import { magazineValidator } from '#validators/magazine'
import type { MagazineData } from '../../shared/magazine.js'

export default class MagazinesController {
  async index({ inertia, params, response }: HttpContext) {
    const magazines = await listMagazines()
    const selectedId = params.id ? Number(params.id) : null
    if (params.id && (!Number.isSafeInteger(selectedId) || Number(selectedId) < 1))
      return response.notFound()
    if (selectedId && !magazines.some((issue) => issue.id === selectedId))
      return response.notFound()
    return inertia.render('magazine', { magazines, selectedId })
  }
  async admin({ inertia }: HttpContext) {
    return inertia.render('dashboard/admin/magazines', { magazines: await listMagazines(false) })
  }
  async save({ request, response, session, params }: HttpContext) {
    const id = params.id ? Number(params.id) : undefined
    if (params.id && (!Number.isSafeInteger(id) || Number(id) < 1)) return response.notFound()
    if (id && !(await db.from('magazines').where('id', id).first())) return response.notFound()
    let pages: unknown
    try {
      pages =
        typeof request.input('pages') === 'string'
          ? JSON.parse(request.input('pages'))
          : request.input('pages')
    } catch {
      session.flashErrors({ pages: 'The pages could not be read. Please try saving again.' })
      return response.redirect().back()
    }
    const validated = await request.validateUsing(magazineValidator, {
      data: { ...request.all(), pages },
    })
    const cover = request.file('cover', { size: '8mb', extnames: ['jpg', 'jpeg', 'png', 'webp'] })
    const images = validated.pages.map((_, index) =>
      request.file('page_image_' + index, { size: '8mb', extnames: ['jpg', 'jpeg', 'png', 'webp'] })
    )
    const errors: Record<string, string> = {}
    if (cover && !cover.isValid)
      errors.cover = cover.errors.map((error) => error.message).join(', ')
    images.forEach((file, index) => {
      if (file && !file.isValid)
        errors['page_image_' + index] = file.errors.map((error) => error.message).join(', ')
    })
    validated.pages.forEach((page, index) => {
      if (
        validated.status === 'published' &&
        page.layout === 'photo' &&
        !images[index] &&
        !page.imageUrl
      )
        errors['pages.' + index + '.imageUrl'] = 'Choose an image for this photo page.'
      if (!page.title && !page.body && !page.imageUrl && !images[index])
        errors['pages.' + index + '.body'] = 'Add an image or some writing to this page.'
    })
    if (
      validated.status === 'published' &&
      !cover &&
      !validated.coverImage &&
      !validated.pages.some((page, index) => page.imageUrl || images[index])
    )
      errors.cover = 'A published issue needs a cover image or an image page.'
    if (Object.keys(errors).length) {
      session.flashErrors(errors)
      return response.redirect().back()
    }
    const moved: string[] = []
    try {
      await mkdir(app.publicPath('uploads/magazines'), { recursive: true })
      async function move(file: NonNullable<typeof cover>) {
        const name = randomUUID() + '.' + file.extname
        await file.move(app.publicPath('uploads/magazines'), { name })
        if (!file.fileName) throw new Error('Could not save the image')
        moved.push(app.publicPath('uploads/magazines/' + name))
        return '/uploads/magazines/' + name
      }
      const savedPages = []
      for (const [index, page] of validated.pages.entries())
        savedPages.push({
          layout: page.layout,
          kicker: page.kicker || '',
          title: page.title || '',
          body: page.body || '',
          imageUrl: images[index] ? await move(images[index]!) : page.imageUrl || null,
          imageAlt: page.imageAlt || '',
        })
      const data: Omit<MagazineData, 'id'> = {
        title: validated.title,
        issueLabel: validated.issueLabel || '',
        description: validated.description || '',
        status: validated.status,
        coverImage: cover
          ? await move(cover)
          : validated.coverImage || savedPages.find((page) => page.imageUrl)?.imageUrl || null,
        pages: savedPages,
      }
      await saveMagazine(data, id)
    } catch (error) {
      await Promise.all(moved.map((path) => unlink(path).catch(() => {})))
      throw error
    }
    return response.redirect().toPath('/admin/magazines')
  }
  async destroy({ params, response }: HttpContext) {
    await db.from('magazines').where('id', params.id).delete()
    return response.redirect().toPath('/admin/magazines')
  }
}

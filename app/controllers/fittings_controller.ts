import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { fittingValidator } from '#validators/fitting'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import { mkdir, unlink } from 'node:fs/promises'

export default class FittingsController {
  async store({ request, response, session, auth }: HttpContext) {
    const data = await request.validateUsing(fittingValidator())
    const image = request.file('referenceImage', {
      size: '8mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })
    if (image && !image.isValid) {
      session.flashErrors({ referenceImage: 'Choose a JPG, PNG, or WebP image up to 8 MB.' })
      return response.redirect().back()
    }
    let savedImage: string | null = null
    const directory = app.makePath('storage/fitting-references')
    try {
      if (image) {
        await mkdir(directory, { recursive: true })
        const name = randomUUID() + '.' + image.extname
        await image.move(directory, { name })
        if (!image.fileName) {
          session.flashErrors({
            referenceImage: 'The picture could not be saved. Please try again.',
          })
          return response.redirect().back()
        }
        savedImage = name
      }
      await db.table('fitting_requests').insert({
        user_id: auth.user!.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        service: data.service,
        preferred_date: DateTime.fromJSDate(data.preferredDate).toISODate(),
        occasion: data.occasion || null,
        notes: data.notes,
        reference_image: savedImage,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      })
    } catch (error) {
      if (savedImage)
        await unlink(app.makePath('storage/fitting-references', savedImage)).catch(() => {})
      throw error
    }
    return response.redirect().toPath('/custom')
  }
}

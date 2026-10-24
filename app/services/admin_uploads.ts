import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { mkdir, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { errors } from '@vinejs/vine'

export function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'valid' }])
}
export class AdminUploads {
  private paths: string[] = []
  async images(ctx: HttpContext, field: string, folder: string) {
    const files = ctx.request.files(field, {
      size: '8mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })
    if (files.length > 2) fieldError(field, 'Choose up to 2 additional photos.')
    for (const file of files)
      if (!file.isValid) fieldError(field, 'Each photo must be JPG, PNG or WebP, up to 8 MB.')
    const urls: string[] = []
    for (const file of files) urls.push(await this.saveImage(file, field, folder))
    return urls
  }
  async image(ctx: HttpContext, field: string, folder: string, existing: string | null = null) {
    const image = ctx.request.file(field, { size: '8mb', extnames: ['jpg', 'jpeg', 'png', 'webp'] })
    if (!image) return existing
    if (!image.isValid) fieldError(field, 'Choose a JPG, PNG or WebP image up to 8 MB.')
    return this.saveImage(image, field, folder)
  }
  private async saveImage(
    image: NonNullable<ReturnType<HttpContext['request']['file']>>,
    field: string,
    folder: string
  ) {
    const filename = randomUUID() + '.' + image.extname
    await mkdir(app.publicPath('uploads/' + folder), { recursive: true })
    await image.move(app.publicPath('uploads/' + folder), { name: filename })
    if (!image.fileName) fieldError(field, 'The image could not be saved. Try again.')
    const url = '/uploads/' + folder + '/' + filename
    this.paths.push(app.publicPath(url.slice(1)))
    return url
  }
  async rollback() {
    await Promise.all(this.paths.map((path) => unlink(path).catch(() => {})))
  }
}

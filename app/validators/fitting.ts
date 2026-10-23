import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

export function fittingValidator() {
  return vine.compile(
    vine.object({
      name: vine.string().trim().minLength(2).maxLength(120),
      email: vine.string().trim().email().maxLength(254),
      phone: vine.string().trim().minLength(7).maxLength(40),
      service: vine.enum([
        'Consultation',
        'First fitting',
        'Follow-up fitting',
        'Bridal consultation',
      ]),
      preferredDate: vine
        .date({ formats: ['YYYY-MM-DD'] })
        .afterOrEqual(DateTime.now().setZone('Africa/Lagos').toISODate()!),
      occasion: vine.string().trim().maxLength(160).optional(),
      notes: vine.string().trim().minLength(10).maxLength(3000),
    })
  )
}

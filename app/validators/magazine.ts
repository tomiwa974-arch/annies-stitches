import vine from '@vinejs/vine'

const imagePath = () =>
  vine
    .string()
    .trim()
    .regex(/^\/(?:images\/generated|uploads\/magazines)\/[a-zA-Z0-9_.-]+$/)
    .optional()
export const magazineValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(160),
    issueLabel: vine.string().trim().maxLength(80).optional(),
    description: vine.string().trim().maxLength(3000).optional(),
    status: vine.enum(['draft', 'published']),
    coverImage: imagePath(),
    pages: vine
      .array(
        vine.object({
          layout: vine.enum(['paper', 'photo', 'mixed', 'dark']),
          kicker: vine.string().trim().maxLength(120).optional(),
          title: vine.string().trim().maxLength(200).optional(),
          body: vine.string().trim().maxLength(10000).optional(),
          imageUrl: imagePath(),
          imageAlt: vine.string().trim().maxLength(250).optional(),
        })
      )
      .minLength(1)
      .maxLength(200),
  })
)

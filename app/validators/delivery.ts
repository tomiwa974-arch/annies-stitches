import vine from '@vinejs/vine'
export const deliveryValidator = vine.compile(
  vine.object({
    recipient: vine.string().trim().minLength(2).maxLength(120),
    phone: vine
      .string()
      .trim()
      .minLength(7)
      .maxLength(40)
      .regex(/^[+()\d\s.-]+$/),
    address: vine.string().trim().minLength(5).maxLength(300),
    addressExtra: vine.string().trim().maxLength(300).optional(),
    city: vine.string().trim().minLength(2).maxLength(120),
    state: vine.string().trim().minLength(2).maxLength(120),
    country: vine.string().trim().minLength(2).maxLength(120),
    postalCode: vine.string().trim().maxLength(30).optional(),
  })
)

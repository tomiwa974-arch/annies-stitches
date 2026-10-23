import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { fittingValidator } from '#validators/fitting'

const enquiry = () => ({
  name: 'Test Client',
  email: 'client@example.com',
  phone: '+2348012345678',
  service: 'Consultation',
  preferredDate: DateTime.now().setZone('Africa/Lagos').toISODate(),
  notes: 'I would like to discuss a dress for an upcoming event.',
})

test('fitting requests accept today in Lagos and trim contact details', async ({ assert }) => {
  const result = await fittingValidator().validate({ ...enquiry(), name: '  Test Client  ' })
  assert.equal(result.name, 'Test Client')
  assert.instanceOf(result.preferredDate, Date)
})

test('fitting requests reject past dates', async ({ assert }) => {
  await assert.rejects(() =>
    fittingValidator().validate({ ...enquiry(), preferredDate: '2000-01-01' })
  )
})

test('fitting requests reject invalid contact details and unsupported services', async ({
  assert,
}) => {
  for (const invalid of [
    { email: 'invalid' },
    { phone: '12' },
    { service: 'Confirmed booking' },
    { notes: '' },
  ]) {
    await assert.rejects(() => fittingValidator().validate({ ...enquiry(), ...invalid }))
  }
})

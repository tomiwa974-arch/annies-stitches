import { useForm, usePage, router } from '@inertiajs/react'
import { fittingDraft } from '../lib/fitting-draft'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import EditorialLayout from './components/EditorialLayout'

export default function Custom() {
  const { auth } = usePage().props as { auth?: { user?: { id: number } } }
  const [restored, setRestored] = useState(false)
  const [sent, setSent] = useState(false)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const referenceInput = useRef<HTMLInputElement>(null)
  const form = useForm({
    name: '',
    email: '',
    phone: '',
    service: 'Consultation',
    preferredDate: '',
    occasion: '',
    notes: '',
    referenceImage: null as File | null,
  })
  useEffect(() => {
    fittingDraft<typeof form.data>('read')
      .then((draft) => {
        if (draft) {
          form.setData(draft)
          setRestored(true)
        }
      })
      .catch(() => {})
  }, [])
  useEffect(() => {
    if (!form.data.referenceImage) {
      setReferencePreview(null)
      return
    }
    const preview = URL.createObjectURL(form.data.referenceImage)
    setReferencePreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [form.data.referenceImage])
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!auth?.user) {
      try {
        await fittingDraft('save', form.data)
        sessionStorage.setItem('redirectAfterLogin', '/custom#request-fitting')
        router.visit('/login?redirect=/custom%23request-fitting')
      } catch {
        form.setError(
          'notes',
          'Your browser could not save this draft. Please allow site storage and try again.'
        )
      }
      return
    }
    form.post('/custom/bookings', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setSent(true)
        setRestored(false)
        fittingDraft('clear').catch(() => {})
        form.reset()
      },
    })
  }
  return (
    <EditorialLayout title="Custom wear & fittings" variant="custom">
      <section className="atelier-custom-hero">
        <div>
          <p className="atelier-eyebrow">THE BESPOKE EXPERIENCE</p>
          <h1>
            Not just made.
            <br />
            Made <em>for you.</em>
          </h1>
          <p className="atelier-intro">
            The occasion. The silhouette. That detail you can't stop thinking about. Let's turn your
            ideas into a conversation about your next piece.
          </p>
          <a className="atelier-button" href="#booking">
            Request a fitting ↗
          </a>
          <span className="atelier-small-note">
            CUSTOM WEAR / OCCASION PIECES / PERSONAL FITTINGS
          </span>
          <div
            className="custom-materials"
            aria-label="Design inspiration: fabric, silhouette, detail"
          >
            <div>
              <i className="material-swatch swatch-ivory" aria-hidden="true" />
              <span>01 / FABRIC</span>
            </div>
            <div>
              <i className="material-swatch swatch-clay" aria-hidden="true" />
              <span>02 / FORM</span>
            </div>
            <div>
              <i className="material-swatch swatch-ink" aria-hidden="true" />
              <span>03 / FINISH</span>
            </div>
          </div>
        </div>
        <div className="atelier-custom-photo">
          <div className="custom-pattern-label">
            THE DESIGN ROOM <span>AN IDEA, MADE PERSONAL.</span>
          </div>
          <img
            src="/images/generated/evening.png"
            alt="Generated eveningwear inspiration: a sculpted burgundy gown"
          />
          <span>
            One of a kind.
            <br />
            <em>Just like you.</em>
          </span>
        </div>
      </section>
      <section className="atelier-process">
        <div className="atelier-section-heading">
          <p className="atelier-eyebrow">FROM FIRST IDEA TO FINAL FIT</p>
          <h2>
            A little inspiration.
            <br />A thoughtful <em>process.</em>
          </h2>
        </div>
        <div className="atelier-process-grid">
          {[
            [
              '01',
              'Let’s talk',
              'Tell us about your occasion, your ideas, and what you love to wear. Bring references if you have them.',
            ],
            [
              '02',
              'Shape the idea',
              'Discuss fabric, silhouette, measurements, budget, and timing with the studio before committing.',
            ],
            [
              '03',
              'Find your fit',
              'Arrange fittings with the studio to consider proportions, comfort, and the finer details.',
            ],
            [
              '04',
              'Make your entrance',
              'Confirm the final fit and collection arrangements. Your piece, ready for your moment.',
            ],
          ].map(([n, title, text]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="booking" className="atelier-booking">
        <div>
          <p className="atelier-eyebrow">YOUR FIRST STITCH STARTS HERE</p>
          <h2>
            Let's make
            <br />
            <em>an introduction.</em>
          </h2>
          <p>
            Request a consultation or fitting with Annabel's studio. Share a preferred day and a few
            details so the team can follow up.
          </p>
          <p className="atelier-booking-note">
            This is an appointment request. The studio will contact you to confirm availability,
            timing, and any costs. Your date is only reserved once confirmed.
          </p>
          <details>
            <summary>What should I bring to a fitting?</summary>
            <p>
              Bring your outfit references and, where relevant, the shoes and undergarments you plan
              to wear. The studio can advise on anything else when confirming.
            </p>
          </details>
          <details>
            <summary>How far ahead should I enquire?</summary>
            <p>
              Enquire as early as possible, especially for event wear. The studio will discuss a
              realistic timeline for your design before work begins.
            </p>
          </details>
        </div>
        {sent ? (
          <div className="atelier-success" role="status">
            <span>✓</span>
            <h3>Your request is with us.</h3>
            <p>
              Thank you for introducing yourself. Your enquiry has been saved for the studio to
              review. Please wait for the team to confirm your appointment.
            </p>
            <button type="button" className="atelier-button" onClick={() => setSent(false)}>
              Make another enquiry
            </button>
          </div>
        ) : (
          <form id="request-fitting" onSubmit={submit} className="atelier-form">
            {restored && (
              <p role="status">
                Your fitting details and reference image have been restored. Review them and send
                your request when ready.
              </p>
            )}
            <div className="atelier-form-row">
              {(['name', 'email'] as const).map((key) => (
                <label key={key}>
                  {key === 'name' ? 'Your name' : 'Email address'}
                  <input
                    required
                    type={key === 'email' ? 'email' : 'text'}
                    autoComplete={key}
                    maxLength={key === 'name' ? 120 : 254}
                    value={form.data[key]}
                    onChange={(e) => form.setData(key, e.target.value)}
                  />
                  {form.errors[key] && <span role="alert">{form.errors[key]}</span>}
                </label>
              ))}
            </div>
            <div className="atelier-form-row">
              <label>
                Phone number
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                  value={form.data.phone}
                  onChange={(e) => form.setData('phone', e.target.value)}
                />
                {form.errors.phone && <span role="alert">{form.errors.phone}</span>}
              </label>
              <label>
                I'd like to book
                <select
                  value={form.data.service}
                  onChange={(e) => form.setData('service', e.target.value)}
                >
                  <option>Consultation</option>
                  <option>First fitting</option>
                  <option>Follow-up fitting</option>
                  <option>Bridal consultation</option>
                </select>
                {form.errors.service && <span role="alert">{form.errors.service}</span>}
              </label>
            </div>
            <div className="atelier-form-row">
              <label>
                Preferred date (Lagos time)
                <input
                  required
                  type="date"
                  min={today}
                  value={form.data.preferredDate}
                  onChange={(e) => form.setData('preferredDate', e.target.value)}
                />
                {form.errors.preferredDate && <span role="alert">{form.errors.preferredDate}</span>}
              </label>
              <label>
                Occasion (optional)
                <input
                  maxLength={160}
                  placeholder="A wedding, a celebration, just because…"
                  value={form.data.occasion}
                  onChange={(e) => form.setData('occasion', e.target.value)}
                />
                {form.errors.occasion && <span role="alert">{form.errors.occasion}</span>}
              </label>
            </div>
            <label>
              Tell us what you're imagining
              <textarea
                required
                rows={4}
                maxLength={3000}
                placeholder="Your ideas, event date, budget, or any questions…"
                value={form.data.notes}
                onChange={(e) => form.setData('notes', e.target.value)}
              />
              {form.errors.notes && <span role="alert">{form.errors.notes}</span>}
            </label>
            <div className="fitting-reference">
              <label htmlFor="fitting-reference-image">
                <ImagePlus size={18} aria-hidden="true" /> Reference picture (optional)
              </label>
              <p id="fitting-reference-help">
                A silhouette, fabric, or outfit you love. JPG, PNG, or WebP, up to 8 MB.
              </p>
              <input
                ref={referenceInput}
                id="fitting-reference-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby="fitting-reference-help"
                aria-invalid={Boolean(form.errors.referenceImage)}
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  form.clearErrors('referenceImage')
                  if (
                    file &&
                    (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                      file.size > 8 * 1024 * 1024)
                  ) {
                    form.setError('referenceImage', 'Choose a JPG, PNG, or WebP image up to 8 MB.')
                    form.setData('referenceImage', null)
                    event.target.value = ''
                    return
                  }
                  form.setData('referenceImage', file)
                }}
              />
              {form.errors.referenceImage && (
                <span className="fitting-reference-error" role="alert">
                  {form.errors.referenceImage}
                </span>
              )}
              {referencePreview && (
                <div className="fitting-reference-preview">
                  <img src={referencePreview} alt="Your chosen fitting reference" />
                  <div>
                    <p>{form.data.referenceImage?.name}</p>
                    <button
                      type="button"
                      onClick={() => {
                        form.setData('referenceImage', null)
                        form.clearErrors('referenceImage')
                        if (referenceInput.current) referenceInput.current.value = ''
                      }}
                    >
                      <X size={14} aria-hidden="true" /> Remove picture
                    </button>
                  </div>
                </div>
              )}
              {form.progress && (
                <p role="status">Uploading your request: {form.progress.percentage}%</p>
              )}
            </div>
            <p className="atelier-form-privacy">
              Your details will be used by the studio to respond to this enquiry.
            </p>
            <button className="atelier-button" disabled={form.processing}>
              {form.processing ? 'Sending your request…' : 'Send appointment request ↗'}
            </button>
          </form>
        )}
      </section>
    </EditorialLayout>
  )
}

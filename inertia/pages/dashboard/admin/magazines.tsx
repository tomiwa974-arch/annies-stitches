import { useEffect, useState, type FormEvent } from 'react'
import { router, useForm } from '@inertiajs/react'
import { ArrowDown, ArrowUp, BookOpen, Plus, Trash2 } from 'lucide-react'
import MagazineFullscreen from '../../components/MagazineFullscreen'
import type { MagazineData, MagazinePageData, MagazineLayout } from '../../../../shared/magazine'

import '../../../css/admin-atelier.css'

type EditablePage = MagazinePageData & { key: string; file: File | null }
function pageKey() {
  return 'page-' + Date.now() + '-' + Math.random().toString(36).slice(2)
}
function emptyPage(): EditablePage {
  return {
    key: pageKey(),
    layout: 'paper',
    title: '',
    kicker: '',
    body: '',
    imageUrl: null,
    imageAlt: '',
    file: null,
  }
}
function UploadPreview({
  file,
  existing,
  alt,
}: {
  file: File | null
  existing: string | null
  alt: string
}) {
  const [url, setUrl] = useState<string | null>(existing)
  useEffect(() => {
    if (!file) {
      setUrl(existing)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file, existing])
  return url ? <img src={url} alt={alt} className="magazine-upload-preview" /> : null
}

export default function AdminMagazines({ magazines }: { magazines: MagazineData[] }) {
  const [editing, setEditing] = useState(false)
  const [id, setId] = useState<number | null>(null)
  const [pages, setPages] = useState<EditablePage[]>([emptyPage()])
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState<MagazineData | null>(null)
  const form = useForm<{
    title: string
    issueLabel: string
    description: string
    status: 'draft' | 'published'
    coverImage: string
    coverFile: File | null
  }>({
    title: '',
    issueLabel: '',
    description: '',
    status: 'draft',
    coverImage: '',
    coverFile: null,
  })
  const errors = form.errors as Record<string, string>
  function start(issue?: MagazineData) {
    setId(issue?.id || null)
    setEditing(true)
    setNotice('')
    form.clearErrors()
    form.setData({
      title: issue?.title || '',
      issueLabel: issue?.issueLabel || '',
      description: issue?.description || '',
      status: issue?.status || 'draft',
      coverImage: issue?.coverImage || '',
      coverFile: null,
    })
    setPages(
      issue?.pages.length
        ? issue.pages.map((page) => ({ ...page, key: pageKey(), file: null }))
        : [emptyPage()]
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function change(index: number, update: Partial<EditablePage>) {
    setPages((current) => current.map((page, i) => (i === index ? { ...page, ...update } : page)))
  }
  function move(index: number, offset: number) {
    setPages((current) => {
      const next = [...current]
      ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
      return next
    })
  }
  function save(event: FormEvent) {
    event.preventDefault()
    form.transform((data) => {
      const payload: Record<string, string | File> = {
        title: data.title,
        issueLabel: data.issueLabel,
        description: data.description,
        status: data.status,
        coverImage: data.coverImage,
        pages: JSON.stringify(pages.map(({ key, file, ...page }) => page)),
      }
      if (data.coverFile) payload.cover = data.coverFile
      pages.forEach((page, index) => {
        if (page.file) payload['page_image_' + index] = page.file
      })
      return payload
    })
    form.post(id ? `/admin/magazines/${id}` : '/admin/magazines', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setEditing(false)
        setNotice(
          form.data.status === 'published'
            ? 'Magazine published. It is now in the reading room.'
            : 'Draft saved. It is visible only in admin.'
        )
      },
    })
  }
  function remove(issue: MagazineData) {
    if (window.confirm(`Delete “${issue.title}” and all its pages?`))
      router.delete(`/admin/magazines/${issue.id}`, {
        preserveScroll: true,
        onSuccess: () => setNotice('Magazine deleted.'),
      })
  }
  return (
    <div className="magazine-admin admin-magazine-atelier magazine-admin-embedded">
      <section className="magazine-admin-panel">
        <header className="magazine-admin-heading">
          <div>
            <p>THE READING ROOM / PUBLISHING</p>
            <h1>{editing ? (id ? 'Edit magazine' : 'New magazine') : 'Magazines'}</h1>
            <span>Create issues, arrange their pages, and publish when ready.</span>
          </div>
          {editing ? (
            <button type="button" onClick={() => setEditing(false)} disabled={form.processing}>
              Back to issues
            </button>
          ) : (
            <button type="button" className="magazine-admin-primary" onClick={() => start()}>
              <Plus size={16} /> New magazine
            </button>
          )}
        </header>
        {notice && (
          <p role="status" className="magazine-admin-notice">
            {notice}
          </p>
        )}
        {!editing ? (
          <div className="magazine-admin-list">
            {magazines.map((issue) => (
              <article key={issue.id} className="magazine-admin-card">
                {issue.coverImage ? (
                  <img src={issue.coverImage} alt={`${issue.title} cover`} />
                ) : (
                  <div className="magazine-admin-cover-empty">
                    <BookOpen size={35} />
                  </div>
                )}
                <div>
                  <span className={`magazine-status magazine-status-${issue.status}`}>
                    {issue.status}
                  </span>
                  <h2>{issue.title}</h2>
                  <p>
                    {issue.issueLabel} · {issue.pages.length} inside pages
                  </p>
                  <p>{issue.description}</p>
                  <div className="magazine-admin-card-actions">
                    <button type="button" onClick={() => start(issue)}>
                      Edit issue
                    </button>
                    <button type="button" onClick={() => setPreview(issue)}>
                      Preview saved issue
                    </button>
                    <button
                      type="button"
                      className="magazine-admin-danger"
                      onClick={() => remove(issue)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!magazines.length && <p>No issues yet. Create your first magazine to begin.</p>}
          </div>
        ) : (
          <form onSubmit={save} className="magazine-editor">
            <fieldset disabled={form.processing}>
              <section className="magazine-editor-section">
                <h2>Issue details</h2>
                <div className="magazine-editor-grid">
                  <label>
                    Title
                    <input
                      required
                      maxLength={160}
                      value={form.data.title}
                      onChange={(event) => form.setData('title', event.target.value)}
                    />
                    {errors.title && <small role="alert">{errors.title}</small>}
                  </label>
                  <label>
                    Issue label
                    <input
                      maxLength={80}
                      placeholder="Volume 03 / The Summer Edit"
                      value={form.data.issueLabel}
                      onChange={(event) => form.setData('issueLabel', event.target.value)}
                    />
                    {errors.issueLabel && <small role="alert">{errors.issueLabel}</small>}
                  </label>
                </div>
                <label>
                  Description
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={form.data.description}
                    onChange={(event) => form.setData('description', event.target.value)}
                  />
                  {errors.description && <small role="alert">{errors.description}</small>}
                </label>
                <div className="magazine-editor-grid">
                  <label>
                    Cover image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) =>
                        form.setData('coverFile', event.target.files?.[0] || null)
                      }
                    />
                    <span>If left empty, the first page image becomes the cover.</span>
                    {errors.cover && <small role="alert">{errors.cover}</small>}
                    <UploadPreview
                      file={form.data.coverFile}
                      existing={form.data.coverImage || null}
                      alt="Cover preview"
                    />
                  </label>
                  <label>
                    Visibility
                    <select
                      value={form.data.status}
                      onChange={(event) =>
                        form.setData('status', event.target.value as 'draft' | 'published')
                      }
                    >
                      <option value="draft">Draft — only visible in admin</option>
                      <option value="published">Published — visible in the reading room</option>
                    </select>
                    {errors.status && <small role="alert">{errors.status}</small>}
                    <span>The cover is page 1. Your pages below follow in order.</span>
                  </label>
                </div>
              </section>
              <section className="magazine-editor-section">
                <div className="magazine-editor-pages-heading">
                  <div>
                    <h2>Inside pages</h2>
                    <p>
                      Choose a layout, add writing and images, then move pages into the order you
                      want.
                    </p>
                  </div>
                  <label className="magazine-add-images">
                    Add image pages
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        const files = Array.from(event.target.files || [])
                        setPages((current) => [
                          ...current,
                          ...files.map((file) => ({
                            ...emptyPage(),
                            layout: 'photo' as MagazineLayout,
                            file,
                          })),
                        ])
                        event.target.value = ''
                      }}
                    />
                  </label>
                </div>
                {errors.pages && (
                  <p role="alert" className="magazine-editor-error">
                    {errors.pages}
                  </p>
                )}
                {pages.map((page, index) => (
                  <article key={page.key} className="magazine-editor-page">
                    <header>
                      <h3>Page {index + 2}</h3>
                      <div>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                          aria-label={`Move page ${index + 2} up`}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={index === pages.length - 1}
                          onClick={() => move(index, 1)}
                          aria-label={`Move page ${index + 2} down`}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={pages.length === 1}
                          onClick={() =>
                            setPages((current) => current.filter((_, i) => i !== index))
                          }
                          aria-label={`Remove page ${index + 2}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </header>
                    <div className="magazine-editor-grid">
                      <label>
                        Layout
                        <select
                          value={page.layout}
                          onChange={(event) =>
                            change(index, { layout: event.target.value as MagazineLayout })
                          }
                        >
                          <option value="paper">Writing / cream paper</option>
                          <option value="photo">Full image with caption</option>
                          <option value="mixed">Image and writing</option>
                          <option value="dark">Writing / wine background</option>
                        </select>
                      </label>
                      <label>
                        Small heading
                        <input
                          maxLength={120}
                          value={page.kicker}
                          onChange={(event) => change(index, { kicker: event.target.value })}
                        />
                      </label>
                    </div>
                    <label>
                      Page title
                      <input
                        maxLength={200}
                        value={page.title}
                        onChange={(event) => change(index, { title: event.target.value })}
                      />
                    </label>
                    <label>
                      Writing
                      <textarea
                        rows={5}
                        maxLength={10000}
                        value={page.body}
                        onChange={(event) => change(index, { body: event.target.value })}
                      />
                    </label>
                    <div className="magazine-editor-grid">
                      <label>
                        Image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) =>
                            change(index, { file: event.target.files?.[0] || null })
                          }
                        />
                        <UploadPreview
                          file={page.file}
                          existing={page.imageUrl}
                          alt="Page image preview"
                        />
                        {(page.imageUrl || page.file) && (
                          <button
                            type="button"
                            onClick={() => change(index, { imageUrl: null, file: null })}
                          >
                            Remove image
                          </button>
                        )}
                      </label>
                      <label>
                        Image description
                        <input
                          maxLength={250}
                          value={page.imageAlt}
                          onChange={(event) => change(index, { imageAlt: event.target.value })}
                        />
                        <span>Describe the image for readers using a screen reader.</span>
                      </label>
                    </div>
                    {Object.entries(errors)
                      .filter(
                        ([key]) =>
                          key.startsWith(`pages.${index}.`) || key === `page_image_${index}`
                      )
                      .map(([key, message]) => (
                        <p key={key} role="alert" className="magazine-editor-error">
                          {message}
                        </p>
                      ))}
                  </article>
                ))}
                <button
                  type="button"
                  onClick={() => setPages((current) => [...current, emptyPage()])}
                >
                  <Plus size={16} /> Add a page
                </button>
              </section>
              <div className="magazine-editor-save">
                <div>
                  <p>JPG, PNG, or WebP · up to 8 MB per image, 20 MB per save.</p>
                  {form.progress && <p role="status">Uploading {form.progress.percentage}%</p>}
                </div>
                <button type="submit" className="magazine-admin-primary">
                  {form.processing
                    ? 'Saving…'
                    : form.data.status === 'published'
                      ? 'Save & publish'
                      : 'Save draft'}
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </section>
      {preview && <MagazineFullscreen issue={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

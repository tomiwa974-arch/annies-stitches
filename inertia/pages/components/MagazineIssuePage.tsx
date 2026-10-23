import type { MagazineData, MagazinePageData } from '../../../shared/magazine'

export function IssuePage({
  page,
  issue,
  number,
  cover = false,
}: {
  page: MagazinePageData
  issue: MagazineData
  number: number
  cover?: boolean
}) {
  if (cover)
    return (
      <div className="journal-page journal-cover">
        {issue.coverImage && <img src={issue.coverImage} alt={`${issue.title} cover`} />}
        <div>
          <span>{issue.issueLabel}</span>
          <h2>annie's</h2>
          <p>{issue.title}</p>
          <small>THE ATELIER EDIT / FASHION & INDIVIDUALITY</small>
        </div>
        <span className="journal-folio">01</span>
      </div>
    )
  const photo = page.layout === 'photo'
  return (
    <div
      className={`journal-page issue-page issue-page-${page.layout}${photo ? ' journal-photo' : ''}${page.layout === 'dark' ? ' journal-end' : ''}`}
    >
      <span className="journal-running">ANNIE'S / {issue.title}</span>
      {photo && page.imageUrl && <img src={page.imageUrl} alt={page.imageAlt || page.title} />}
      <div
        className={photo ? 'issue-photo-caption' : 'issue-page-content'}
        tabIndex={photo ? undefined : 0}
      >
        {page.kicker && <p className="journal-kicker">{page.kicker}</p>}
        {page.title && <h2>{page.title}</h2>}
        {!photo && page.imageUrl && (
          <img
            className="issue-inset-image"
            src={page.imageUrl}
            alt={page.imageAlt || page.title}
          />
        )}
        {page.body && <p className="issue-body">{page.body}</p>}
      </div>
      <span className="journal-folio">{String(number).padStart(2, '0')}</span>
    </div>
  )
}

import { useState } from 'react'
import { Link } from '@inertiajs/react'
import { Maximize2 } from 'lucide-react'
import EditorialLayout from './components/EditorialLayout'
import MagazineFlipbook from './components/MagazineFlipbook'
import MagazineFullscreen from './components/MagazineFullscreen'
import type { MagazineData } from '../../shared/magazine'

export default function Magazine({
  magazines = [],
  selectedId = null,
}: {
  magazines: MagazineData[]
  selectedId: number | null
}) {
  const [selected, setSelected] = useState<MagazineData | null>(
    () => magazines.find((issue) => issue.id === selectedId) || null
  )
  const [selectedPage, setSelectedPage] = useState(0)
  function openIssue(issue: MagazineData, page = 0) {
    // Request on the click itself: browsers require transient user activation.
    // HTMLDialogElement cannot be a Fullscreen API target.
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => {
        // The reader retains a printed fullscreen control if the browser declines.
      })
    }
    setSelectedPage(page)
    setSelected(issue)
  }
  return (
    <EditorialLayout title="The reading room" variant="magazine">
      <section className="journal-intro">
        <div className="journal-issue-line">
          <span>THE READING ROOM</span>
          <span>AN INDEPENDENT POINT OF VIEW</span>
          <span>{String(magazines.length).padStart(2, '0')} ISSUES</span>
        </div>
        <p className="atelier-eyebrow">ANNIE'S MAGAZINES</p>
        <h1>
          The atelier <em>edit.</em>
        </h1>
        <p>A few pages of inspiration. A whole world of possibility.</p>
      </section>
      {magazines.length ? (
        <div className="journal-issue-stack">
          {magazines.map((issue) => (
            <MagazinePreview key={issue.id} issue={issue} onExpand={openIssue} />
          ))}
        </div>
      ) : (
        <section className="journal-empty">
          <h2>The next edit is on its way.</h2>
          <p>New issues will appear here when the studio publishes them.</p>
        </section>
      )}
      <section className="atelier-invitation">
        <p className="atelier-eyebrow">FROM THE PAGE TO YOUR WARDROBE</p>
        <h2>
          Found your
          <br />
          <em>next inspiration?</em>
        </h2>
        <div className="atelier-actions">
          <Link href="/collection" className="atelier-button">
            Explore the collection ↗
          </Link>
          <Link href="/custom" className="atelier-text-link">
            Create your own piece ↗
          </Link>
        </div>
      </section>
      {selected && (
        <MagazineFullscreen
          key={selected.id}
          issue={selected}
          initialPage={selectedPage}
          onClose={() => setSelected(null)}
        />
      )}
    </EditorialLayout>
  )
}

function MagazinePreview({
  issue,
  onExpand,
}: {
  issue: MagazineData
  onExpand: (issue: MagazineData, page: number) => void
}) {
  const [page, setPage] = useState(0)
  return (
    <section className="journal-reader" aria-label={issue.title}>
      <div className="journal-featured-heading">
        <div>
          <span>{issue.issueLabel}</span>
          <h2>{issue.title}</h2>
        </div>
        <button type="button" onClick={() => onExpand(issue, page)} className="journal-expand">
          <Maximize2 size={16} /> Open full screen
        </button>
      </div>
      <MagazineFlipbook
        issue={issue}
        onPageChange={setPage}
        onExpand={(current) => onExpand(issue, current)}
      />
    </section>
  )
}

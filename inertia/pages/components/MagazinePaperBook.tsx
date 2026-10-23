import { useEffect, useRef, useState } from 'react'
import type { PageFlip } from 'page-flip/engine'
import type { MagazineData } from '../../../shared/magazine'
import { IssuePage } from './MagazineIssuePage'
import '../../css/magazine-reader.css'
import '../../css/magazine-paper.css'

export default function MagazinePaperBook({
  issue,
  immersive = false,
  initialPage = 0,
  onExpand,
  onPageChange,
  onClose,
}: {
  issue: MagazineData
  immersive?: boolean
  initialPage?: number
  onExpand?: (page: number) => void
  onPageChange?: (page: number) => void
  onClose?: () => void
}) {
  const stage = useRef<HTMLDivElement>(null)
  const engine = useRef<PageFlip | null>(null)
  const current = useRef(initialPage)
  const callbacks = useRef({ onExpand, onPageChange })
  callbacks.current = { onExpand, onPageChange }
  const [page, setPage] = useState(initialPage)
  const [single, setSingle] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const ignoreClickUntil = useRef(0)
  const total = issue.pages.length

  useEffect(() => {
    const element = stage.current
    if (!element || !total) return
    let disposed = false
    let resizeFrame = 0
    let previousSize = ''
    let generation = 0
    let cleanupEngine: (() => void) | undefined
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const resize = async () => {
      const width = Math.round(element.clientWidth)
      const height = Math.round(element.clientHeight)
      if (!width || !height) return
      const portrait = width < 600 || (immersive && height > width)
      const size = `${width}:${height}:${media.matches}`
      if (previousSize === size) return
      previousSize = size
      const requestedGeneration = ++generation
      const [{ PageFlip: Engine, destroyPaperEngine }, { renderToStaticMarkup }] =
        await Promise.all([import('../../lib/magazine-paper-engine'), import('react-dom/server')])
      if (disposed || requestedGeneration !== generation) return
      cleanupEngine?.()
      setReady(false)
      setBusy(false)
      setSingle(portrait)
      const host = document.createElement('div')
      host.className = 'magazine-paper-host'
      host.style.width = `${width}px`
      host.style.height = `${height}px`
      element.replaceChildren(host)
      // React escapes all editorial content. These static nodes are owned only by
      // the flip engine, so its page moves/clones cannot conflict with React.
      const nodes = issue.pages.map((content, index) => {
        const node = document.createElement('div')
        node.className = 'screen-paper magazine-soft-page'
        node.dataset.density = 'soft'
        node.innerHTML = renderToStaticMarkup(
          <IssuePage page={content} issue={issue} number={index + 1} />
        )
        return node
      })
      if (nodes.length % 2) {
        const blank = document.createElement('div')
        blank.className = 'screen-paper magazine-soft-page'
        blank.dataset.density = 'soft'
        blank.innerHTML = '<div class="journal-page" aria-label="Blank inside page"></div>'
        nodes.push(blank)
      }
      const book = new Engine(host, {
        width: portrait ? width : width / 2,
        height,
        size: 'fixed',
        autoSize: false,
        usePortrait: portrait,
        showCover: false,
        startPage: Math.max(0, Math.min(current.current, total - 1)),
        drawShadow: true,
        maxShadowOpacity: 0.5,
        flippingTime: media.matches ? 1 : 1000,
        showPageCorners: !media.matches,
        disableFlipByClick: true,
        mobileScrollSupport: true,
        // On phones, handle swipes independently of the library's 250ms cutoff
        // so a deliberate swipe also works and vertical page scrolling survives.
        useMouseEvents: !portrait,
        swipeDistance: 45,
      })
      engine.current = book
      const update = (index: number) => {
        if (disposed) return
        if (index >= total) {
          book.turnToPage(total - 1)
          return
        }
        current.current = index
        setPage(index)
        callbacks.current.onPageChange?.(index)
      }
      book.on('flip', (event) => update(Number(event.data)))
      book.on('changeState', (event) => {
        if (!disposed) setBusy(event.data === 'flipping' || event.data === 'user_fold')
      })
      book.loadFromHTML(nodes)
      update(book.getCurrentPageIndex())
      setReady(true)
      cleanupEngine = () => {
        destroyPaperEngine(book)
        engine.current = null
      }
    }
    const schedule = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        void resize().catch(() => {
          if (!disposed) setFailed(true)
        })
      })
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    media.addEventListener('change', schedule)
    schedule()
    return () => {
      disposed = true
      observer.disconnect()
      media.removeEventListener('change', schedule)
      cancelAnimationFrame(resizeFrame)
      cleanupEngine?.()
    }
  }, [issue, immersive, total])

  function turn(direction: number) {
    if (!ready || busy) return
    if (direction > 0 && page + (single ? 1 : 2) < total) engine.current?.flipNext('bottom')
    else if (direction < 0 && page > 0) engine.current?.flipPrev('bottom')
  }
  return (
    <div
      className={`magazine-paper-reader${immersive ? ' magazine-screen-reader' : ' issue-flipbook'}${single ? ' is-single' : ''}`}
      tabIndex={0}
      role="group"
      aria-label={`${issue.title}. Drag a page corner, swipe, or use arrow keys.`}
      onKeyDown={(event) => {
        if (
          ['ArrowRight', 'ArrowDown', 'PageDown', 'ArrowLeft', 'ArrowUp', 'PageUp'].includes(
            event.key
          )
        ) {
          event.preventDefault()
          turn(['ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1)
        } else if (event.key === 'Enter' && event.target === event.currentTarget)
          callbacks.current.onExpand?.(current.current)
      }}
    >
      <div className="magazine-paper-surface">
        <div
          className="magazine-paper-stage"
          ref={stage}
          onTouchStart={(event) => {
            if (single)
              touch.current = {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY,
              }
          }}
          onTouchEnd={(event) => {
            if (!single || !touch.current) return
            const dx = touch.current.x - event.changedTouches[0].clientX
            const dy = touch.current.y - event.changedTouches[0].clientY
            touch.current = null
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
              ignoreClickUntil.current = Date.now() + 700
              turn(dx > 0 ? 1 : -1)
            }
          }}
          onTouchCancel={() => {
            touch.current = null
          }}
          onPointerDown={(event) => {
            pointer.current = { x: event.clientX, y: event.clientY }
          }}
          onClick={(event) => {
            if (busy || !pointer.current || Date.now() < ignoreClickUntil.current) return
            const distance = Math.hypot(
              event.clientX - pointer.current.x,
              event.clientY - pointer.current.y
            )
            pointer.current = null
            const rect = event.currentTarget.getBoundingClientRect()
            const atEdge = event.clientX - rect.left < 85 || rect.right - event.clientX < 85
            const atTip = event.clientY - rect.top < 85 || rect.bottom - event.clientY < 85
            if (distance < 8 && atEdge && atTip && single)
              turn(event.clientX - rect.left < rect.width / 2 ? -1 : 1)
            else if (distance < 8 && !(atEdge && atTip))
              callbacks.current.onExpand?.(current.current)
          }}
        />
        {!single && <div className="magazine-deep-gutter" aria-hidden="true" />}
      </div>
      {!ready && (
        <p className="magazine-paper-loading" role="status">
          {failed ? 'The reader could not load. Refresh to try again.' : 'Opening the magazine…'}
        </p>
      )}
      {onClose && (
        <button type="button" className="screen-close" onClick={onClose}>
          Close ×
        </button>
      )}
      <nav
        className={immersive ? 'screen-paper-navigation' : 'journal-controls'}
        aria-label="Magazine pages"
      >
        <button type="button" disabled={!ready || busy || page <= 0} onClick={() => turn(-1)}>
          ← Previous
        </button>
        <span aria-live="polite">
          {single || page + 1 >= total ? page + 1 : `${page + 1}–${Math.min(total, page + 2)}`} /{' '}
          {total}
        </span>
        <button
          type="button"
          disabled={!ready || busy || page + (single ? 1 : 2) >= total}
          onClick={() => turn(1)}
        >
          Next →
        </button>
      </nav>
      {!immersive && (
        <p className="journal-hint">
          Drag a corner, swipe, or use the arrows. Click the pages for full screen.
        </p>
      )}
    </div>
  )
}

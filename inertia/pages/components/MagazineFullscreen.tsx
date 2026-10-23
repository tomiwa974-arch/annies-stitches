import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import MagazineScreenReader from './MagazineScreenReader'
import type { MagazineData } from '../../../shared/magazine'
import '../../css/magazine-reader.css'

export default function MagazineFullscreen({
  issue,
  onClose,
  initialPage = 0,
}: {
  issue: MagazineData
  onClose: () => void
  initialPage?: number
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    dialog.querySelector<HTMLElement>('.magazine-screen-reader')?.focus({ preventScroll: true })
    const update = () => setFullscreen(Boolean(document.fullscreenElement))
    update()
    document.addEventListener('fullscreenchange', update)
    return () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
      dialog.close()
      document.body.style.overflow = overflow
      document.removeEventListener('fullscreenchange', update)
      previousFocus?.focus()
    }
  }, [])
  function expand() {
    void document.documentElement.requestFullscreen().catch(() => {
      // Browser restrictions leave the edge-to-edge viewport reader available.
    })
  }
  if (typeof document === 'undefined') return null
  return createPortal(
    <dialog
      ref={ref}
      className="journal-fullscreen-dialog journal-immersive atelier-site atelier-magazine"
      aria-label={`${issue.title} magazine reader`}
      onCancel={() => closeRef.current()}
    >
      <MagazineScreenReader issue={issue} initialPage={initialPage} onClose={onClose} />
      {!fullscreen && document.fullscreenEnabled && (
        <button type="button" className="screen-enter-fullscreen" onClick={expand}>
          Full screen
        </button>
      )}
    </dialog>,
    document.body
  )
}

import { useEffect } from 'react'

/** Progressive enhancement: everything remains visible when motion is unavailable. */
export default function useEditorialMotion(selector: string, enabled = true) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(selector)
    if (
      !enabled ||
      !root ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.08 }
    )
    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]')
    targets.forEach((target) => observer.observe(target))
    root.setAttribute('data-motion-ready', '')
    return () => {
      observer.disconnect()
      root.removeAttribute('data-motion-ready')
    }
  }, [selector, enabled])
}

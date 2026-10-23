import { PageFlip } from 'page-flip/engine'
import { Render } from 'page-flip/render'

// Upstream 2.0.7's destroy() leaves its animation loop running. Use the source
// entrypoint so we can stop that loop when a preview unmounts or is resized.
const frames = new WeakMap<object, number>()
Render.prototype.start = function () {
  this.update()
  const render = this as unknown as { render: (time: number) => void }
  const tick = (time: number) => {
    if (!frames.has(this)) return
    render.render(time)
    frames.set(this, requestAnimationFrame(tick))
  }
  frames.set(this, requestAnimationFrame(tick))
}

export { PageFlip }
export function destroyPaperEngine(book: PageFlip) {
  const render = book.getRender()
  const frame = frames.get(render)
  if (frame !== undefined) cancelAnimationFrame(frame)
  frames.delete(render)
  // Upstream skips removing its resize handler when useMouseEvents is false.
  book.getUI().removeHandlers()
  book.destroy()
}

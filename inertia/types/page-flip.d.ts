// page-flip 2.0.7 ships its TypeScript sources but omits declarations.
declare module 'page-flip/engine' {
  export class PageFlip {
    constructor(element: HTMLElement, settings: Record<string, number | boolean | string>)
    loadFromHTML(pages: HTMLElement[]): void
    on(event: string, handler: (event: { data: unknown }) => void): this
    flipNext(corner?: string): void
    flipPrev(corner?: string): void
    turnToPage(page: number): void
    getCurrentPageIndex(): number
    getState(): string
    getRender(): object
    getUI(): { removeHandlers(): void }
    destroy(): void
  }
}
declare module 'page-flip/render' {
  export class Render {
    start(): void
    update(): void
  }
}

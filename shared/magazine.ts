export type MagazineLayout = 'paper' | 'photo' | 'mixed' | 'dark'
export interface MagazinePageData {
  id?: number
  layout: MagazineLayout
  kicker: string
  title: string
  body: string
  imageUrl: string | null
  imageAlt: string
}
export interface MagazineData {
  id: number
  title: string
  issueLabel: string
  description: string
  coverImage: string | null
  status: 'draft' | 'published'
  pages: MagazinePageData[]
}

import type { MagazineData } from '../../../shared/magazine'
import MagazinePaperBook from './MagazinePaperBook'

export default function MagazineFlipbook(props: {
  issue: MagazineData
  onExpand?: (page: number) => void
  onPageChange?: (page: number) => void
  initialPage?: number
}) {
  return <MagazinePaperBook {...props} />
}

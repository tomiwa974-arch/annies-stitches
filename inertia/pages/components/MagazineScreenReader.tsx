import type { MagazineData } from '../../../shared/magazine'
import MagazinePaperBook from './MagazinePaperBook'

export default function MagazineScreenReader({
  issue,
  initialPage,
  onClose,
}: {
  issue: MagazineData
  initialPage: number
  onClose: () => void
}) {
  return <MagazinePaperBook issue={issue} initialPage={initialPage} onClose={onClose} immersive />
}

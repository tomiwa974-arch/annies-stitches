/** Cover stands alone; inside spreads never skip a page or add artificial end pages. */
export function magazineSpread(page: number, total: number, single: boolean): number[] {
  const safe = Math.max(0, Math.min(page, total - 1))
  if (single || safe === 0) return [safe]
  const first = safe % 2 ? safe : safe - 1
  return first + 1 < total ? [first, first + 1] : [first]
}

export function nextMagazinePage(page: number, total: number, single: boolean, direction: number) {
  const spread = magazineSpread(page, total, single)
  if (direction > 0) return Math.min(total - 1, spread[spread.length - 1] + 1)
  return Math.max(0, spread[0] - (single || spread[0] === 1 ? 1 : 2))
}

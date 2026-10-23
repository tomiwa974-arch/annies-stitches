import { test } from '@japa/runner'
import { magazineSpread, nextMagazinePage } from '../../shared/magazine-reader.js'

test('desktop magazine spreads visit every saved page and stop at the last page', ({ assert }) => {
  for (const total of [1, 2, 7, 8, 201]) {
    let page = 0
    const visited: number[] = []
    while (true) {
      visited.push(...magazineSpread(page, total, false))
      const next = nextMagazinePage(page, total, false, 1)
      if (magazineSpread(next, total, false)[0] === magazineSpread(page, total, false)[0]) break
      page = next
    }
    assert.deepEqual(
      visited,
      Array.from({ length: total }, (_, i) => i)
    )
    const backwards: number[] = []
    while (page > 0) {
      page = nextMagazinePage(page, total, false, -1)
      backwards.push(page)
    }
    assert.equal(page, 0)
    assert.equal(nextMagazinePage(0, total, false, -1), 0)
  }
})

test('phone magazine visits individual pages in both directions and preserves page on rotation', ({
  assert,
}) => {
  for (let page = 0; page < 8; page++) {
    assert.deepEqual(magazineSpread(page, 8, true), [page])
    assert.equal(nextMagazinePage(page, 8, true, 1), Math.min(7, page + 1))
    assert.equal(nextMagazinePage(page, 8, true, -1), Math.max(0, page - 1))
    assert.include(magazineSpread(page, 8, false), page)
  }
})

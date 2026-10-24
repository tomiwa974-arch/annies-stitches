import { api } from './api'

export interface GuestCartItem {
  id: number
  name: string
  price: number
  category: string
  selectedSize: string
  quantity: number
  color?: string
  tailorMeasurements?: Record<string, string> | null
  isCustomTailored?: boolean
}
interface GuestProduct {
  id: number
  name: string
  description: string
  price: number
  size: string
  stock: number
  imageUrl?: string
  storeCategory?: string
}
interface GuestShopping {
  id: string
  cart: GuestCartItem[]
  wishlist: GuestProduct[]
}
const key = 'annies.guest-shopping.v1'
export function guestShopping(): GuestShopping {
  try {
    const data = JSON.parse(localStorage.getItem(key) || 'null')
    if (data?.id && Array.isArray(data.cart) && Array.isArray(data.wishlist)) return data
  } catch {}
  return { id: crypto.randomUUID(), cart: [], wishlist: [] }
}
export function saveGuestShopping(data: GuestShopping) {
  if (data.cart.length > 100 || data.wishlist.length > 100)
    throw new Error('Your saved list is full.')
  localStorage.setItem(key, JSON.stringify(data))
}
const merging = new Map<number, Promise<void>>()
export function mergeGuestShopping(userId: number): Promise<void> {
  if (merging.has(userId)) return merging.get(userId)!
  const job = (async () => {
    const data = guestShopping()
    if (!data.cart.length && !data.wishlist.length) return
    await api('/api/shopping/merge', 'POST', {
      id: data.id,
      cart: data.cart,
      wishlist: data.wishlist.map((item) => item.id),
    })
    if (guestShopping().id === data.id) localStorage.removeItem(key)
    window.dispatchEvent(new Event('shopping-merged'))
  })().finally(() => merging.delete(userId))
  merging.set(userId, job)
  return job
}

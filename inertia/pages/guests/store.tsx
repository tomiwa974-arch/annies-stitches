import { api, ApiError } from '../../lib/api'
import DeliveryFields, { emptyDelivery, type DeliveryAddress } from '../components/DeliveryFields'
import { useState, useRef, useEffect } from 'react'
import { Head, Link, usePage, router } from '@inertiajs/react'

import { guestShopping, saveGuestShopping, mergeGuestShopping } from '../../lib/guest-shopping'

interface CartItem {
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

interface ProductImage {
  id: number
  imageUrl: string
  sortOrder: number
}

interface ColorVariation {
  name: string
  hex: string
  imageUrl?: string | null
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  size: string
  stock: number
  storeCategory?: string
  imageUrl?: string
  images?: ProductImage[]
  colorVariations?: ColorVariation[] | string
  tailorMeasurements?: string[] | string
  allowCustomTailoring?: boolean
}

interface OrderSummary {
  id: number
  orderNumber: string
  totalAmount: number
  status: string
  trackingStage: 'received' | 'packaged' | 'shipped' | 'delivered'
  createdAt: string
  items: Array<{
    id: number
    productName: string
    quantity: number
    size?: string
    color?: string
    isCustomTailored?: boolean
    tailorMeasurements?: Record<string, string>
  }>
}

interface Props {
  products: Product[]
  isEmpty?: boolean
  error?: boolean
}

export default function Store({ products: initialProducts = [], isEmpty = false }: Props) {
  // ── Auth state from Inertia shared props ──────────────────────────────────
  const { auth } = usePage().props as any
  const isAuthenticated = !!auth?.user
  const user = auth?.user ?? null
  const [products, setProducts] = useState<Product[]>(initialProducts)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [pageLoaded, setPageLoaded] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [selectedSizeForModal, setSelectedSizeForModal] = useState<string>('')
  const [selectedQuantityForModal, setSelectedQuantityForModal] = useState<number>(1)
  const [selectedColorForModal, setSelectedColorForModal] = useState<ColorVariation | null>(null)
  const [useCustomTailoring, setUseCustomTailoring] = useState(false)
  const [tailorMeasurements, setTailorMeasurements] = useState<Record<string, string>>({})
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [showTracking, setShowTracking] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState<OrderSummary | null>(null)

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isGridView, setIsGridView] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)

  // ── Save current page URL for redirect after login ──────────────────────

  const getXsrfToken = () => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1]
    return token ? decodeURIComponent(token) : ''
  }

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body
          ? { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getXsrfToken() }
          : {}),
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return response.json()
  }

  const loadUserLists = async () => {
    if (!isAuthenticated) {
      const saved = guestShopping()
      setCart(saved.cart)
      setWishlist(saved.wishlist)
      return
    }
    await mergeGuestShopping(user.id)
    const [cartData, wishlistData] = await Promise.all([
      apiRequest('/api/cart'),
      apiRequest('/api/wishlist'),
    ])

    setCart(Array.isArray(cartData.cart) ? cartData.cart : [])
    setWishlist(Array.isArray(wishlistData.wishlist) ? wishlistData.wishlist : [])
  }

  const refreshProducts = async () => {
    try {
      const response = await fetch('/api/products', { headers: { Accept: 'application/json' } })
      if (!response.ok) return
      const data = await response.json()
      if (Array.isArray(data)) setProducts(data)
    } catch {
      // Keep the current product list if refresh fails.
    }
  }

  const refreshOrders = async () => {
    if (!isAuthenticated) return
    try {
      const data = await apiRequest('/api/orders')
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch {
      setNotification({ message: 'Could not refresh order tracking', type: 'error' })
    }
  }

  // ── Dynamic Works button handler - goes to first available category ─────────

  // ── Restore pending cart/wishlist action after login ──────────────────────
  useEffect(() => {
    if (isAuthenticated && new URLSearchParams(window.location.search).get('checkout') === '1')
      setShowCart(true)
    sessionStorage.removeItem('pendingAction')
  }, [isAuthenticated])

  // Get unique categories from products
  const allCategories = Array.from(new Set(products.map((p) => p.storeCategory || 'Uncategorized')))

  const categories = [
    { id: 'all', name: 'All Items' },
    ...allCategories.map((cat) => ({
      id: cat.toLowerCase().replace(/\s+/g, '-'),
      name: cat,
    })),
  ]

  // Group products by category
  const getProductsByCategory = () => {
    if (selectedCategory !== 'all') {
      const filtered = products.filter((p) => {
        const productCat = (p.storeCategory || 'Uncategorized').toLowerCase().replace(/\s+/g, '-')
        return productCat === selectedCategory
      })
      return [
        {
          categoryName:
            allCategories.find((c) => c.toLowerCase().replace(/\s+/g, '-') === selectedCategory) ||
            selectedCategory,
          products: filtered,
        },
      ]
    }

    const grouped: { [key: string]: Product[] } = {}
    products.forEach((product) => {
      const cat = product.storeCategory || 'Uncategorized'
      if (!grouped[cat]) {
        grouped[cat] = []
      }
      grouped[cat].push(product)
    })

    const sortedCategories = Object.keys(grouped).sort()

    return sortedCategories.map((cat) => ({
      categoryName: cat,
      products: grouped[cat],
    }))
  }

  const getFilteredProducts = () => {
    if (selectedCategory === 'all') {
      return products
    }
    return products.filter((p) => {
      const productCat = (p.storeCategory || 'Uncategorized').toLowerCase().replace(/\s+/g, '-')
      return productCat === selectedCategory
    })
  }

  const filteredProductsForSearch = getFilteredProducts()

  const parseArrayField = <T,>(value: T[] | string | undefined, fallback: T[] = []): T[] => {
    if (Array.isArray(value)) return value
    if (!value) return fallback
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }

  const getProductColors = (product: Product): ColorVariation[] => {
    const parsed = parseArrayField<ColorVariation>(product.colorVariations, [])
    if (parsed.length > 0) return parsed
    return product.imageUrl
      ? [{ name: 'Signature', hex: '#111111', imageUrl: product.imageUrl }]
      : []
  }

  const getTailorFields = (product: Product): string[] => {
    const parsed = parseArrayField<string>(product.tailorMeasurements, [])
    return parsed.length > 0 ? parsed : ['chest', 'waist', 'hips', 'length']
  }

  useEffect(() => {
    setPageLoaded(true)
  }, [])
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])
  useEffect(() => {
    refreshProducts()
    const interval = window.setInterval(refreshProducts, 15000)
    const handleFocus = () => refreshProducts()
    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
  useEffect(() => {
    if (!isAuthenticated) {
      const saved = guestShopping()
      setCart(saved.cart)
      setWishlist(saved.wishlist)
      return
    }

    loadUserLists().catch(() => {
      setNotification({ message: 'Could not load your cart and wishlist', type: 'error' })
    })
    refreshOrders()
  }, [isAuthenticated])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const productId = params.get('product')
    if (!productId) return
    const product = products.find((p) => String(p.id) === productId)
    if (product) openProductModal(product)
  }, [products])

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(t)
    }
  }, [notification])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node))
        setShowSearchResults(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    const results = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase()) ||
        p.storeCategory?.toLowerCase().includes(query.toLowerCase())
    )
    setSearchResults(results)
    setShowSearchResults(true)
  }

  const getSizesArray = (sizeString: string): string[] => {
    if (!sizeString) return []
    return sizeString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // ── Profile button: guest → /login, logged-in → dropdown ─────────────────
  const handleCartClick = () => {
    setShowCart(true)
  }

  const handleWishlistClick = () => {
    setShowWishlist(true)
  }

  const addToCart = async (
    product: Product,
    selectedSize: string,
    quantity: number = 1,
    color: string = '',
    measurements: Record<string, string> | null = null,
    isCustomTailored: boolean = false
  ) => {
    if (!selectedSize) {
      setNotification({ message: `Please select a size for ${product.name}`, type: 'error' })
      return
    }
    if (!isAuthenticated) {
      try {
        const saved = guestShopping()
        const existing = saved.cart.find(
          (item) =>
            item.id === product.id &&
            item.selectedSize === selectedSize &&
            (item.color || '') === color
        )
        if ((existing?.quantity || 0) + quantity > product.stock)
          throw new Error('Not enough stock is available.')
        if (existing) existing.quantity += quantity
        else
          saved.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.storeCategory || '',
            selectedSize,
            quantity,
            color,
            tailorMeasurements: measurements,
            isCustomTailored,
          })
        saveGuestShopping(saved)
        setCart(saved.cart)
        setNotification({ message: product.name + ' added to cart', type: 'success' })
      } catch (error) {
        setNotification({
          message: error instanceof Error ? error.message : 'Could not save cart',
          type: 'error',
        })
      }
      return
    }
    try {
      const data = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          size: selectedSize,
          quantity,
          color,
          tailorMeasurements: measurements,
          isCustomTailored,
        }),
      })
      setCart(Array.isArray(data.cart) ? data.cart : [])
      setNotification({
        message: `${product.name} (${selectedSize}) added to cart!`,
        type: 'success',
      })
    } catch {
      setNotification({ message: 'Could not add item to cart', type: 'error' })
    }
  }

  const removeFromCart = async (productId: number, selectedSize: string, color = '') => {
    const item = cart.find(
      (i) => i.id === productId && i.selectedSize === selectedSize && (i.color || '') === color
    )
    if (!isAuthenticated) {
      const saved = guestShopping()
      saved.cart = saved.cart.filter(
        (i) => !(i.id === productId && i.selectedSize === selectedSize && (i.color || '') === color)
      )
      saveGuestShopping(saved)
      setCart(saved.cart)
      return
    }
    try {
      const data = await apiRequest(`/api/cart/${productId}`, {
        method: 'DELETE',
        body: JSON.stringify({ size: selectedSize, color }),
      })
      setCart(Array.isArray(data.cart) ? data.cart : [])
      if (item)
        setNotification({
          message: `${item.name} (${item.selectedSize}) removed from cart`,
          type: 'success',
        })
    } catch {
      setNotification({ message: 'Could not remove item from cart', type: 'error' })
    }
  }

  const updateQuantity = async (
    productId: number,
    selectedSize: string,
    newQuantity: number,
    color = ''
  ) => {
    if (newQuantity < 1) {
      removeFromCart(productId, selectedSize, color)
      return
    }
    if (!isAuthenticated) {
      const saved = guestShopping()
      const item = saved.cart.find(
        (i) => i.id === productId && i.selectedSize === selectedSize && (i.color || '') === color
      )
      if (item) {
        item.quantity = Math.min(100, newQuantity)
        saveGuestShopping(saved)
        setCart(saved.cart)
      }
      return
    }
    try {
      const data = await apiRequest(`/api/cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ size: selectedSize, quantity: newQuantity, color }),
      })
      setCart(Array.isArray(data.cart) ? data.cart : [])
    } catch {
      setNotification({ message: 'Could not update cart quantity', type: 'error' })
    }
  }

  const getCartTotal = () => cart.reduce((t, i) => t + i.price * i.quantity, 0)

  // ── Wishlist (requires auth) ──────────────────────────────────────────────
  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      try {
        const saved = guestShopping()
        const exists = saved.wishlist.some((item) => item.id === product.id)
        saved.wishlist = exists
          ? saved.wishlist.filter((item) => item.id !== product.id)
          : [...saved.wishlist, product]
        saveGuestShopping(saved)
        setWishlist(saved.wishlist)
        setNotification({
          message: exists ? 'Removed from wishlist' : 'Saved to wishlist',
          type: 'success',
        })
      } catch {
        setNotification({
          message: 'Could not save wishlist. Please allow site storage.',
          type: 'error',
        })
      }
      return
    }
    const exists = wishlist.some((i) => i.id === product.id)
    try {
      const data = await apiRequest('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id }),
      })
      setWishlist(Array.isArray(data.wishlist) ? data.wishlist : [])
      setNotification({
        message: exists
          ? `${product.name} removed from wishlist`
          : `${product.name} added to wishlist!`,
        type: 'success',
      })
    } catch {
      setNotification({ message: 'Could not update wishlist', type: 'error' })
    }
  }

  const isInWishlist = (productId: number) => wishlist.some((i) => i.id === productId)

  const [checkingOut, setCheckingOut] = useState(false)
  const deliveryDialog = useRef<HTMLDialogElement>(null)
  const [delivery, setDelivery] = useState<DeliveryAddress>(emptyDelivery)
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string>>({})
  const [deliveryNotice, setDeliveryNotice] = useState('')
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [savingDelivery, setSavingDelivery] = useState(false)
  const checkoutKey = useRef<string | null>(null)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tracking') === '1') setShowTracking(true)
  }, [])
  const handleCheckout = async () => {
    if (checkingOut) return
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', '/store?checkout=1')
      setNotification({ message: 'Please login to checkout', type: 'error' })
      router.visit('/login?redirect=/store%3Fcheckout=1')
      return
    }
    setDeliveryLoading(true)
    setDeliveryNotice('')
    setDeliveryErrors({})
    deliveryDialog.current?.showModal()
    try {
      const account = await api<{ deliveryAddress: DeliveryAddress | null }>('/api/account')
      setDelivery({
        ...emptyDelivery,
        recipient: user?.fullName || user?.name || '',
        ...account.deliveryAddress,
      })
    } catch (error) {
      setDeliveryNotice(error instanceof Error ? error.message : 'Could not load delivery details.')
    } finally {
      setDeliveryLoading(false)
    }
  }
  const saveDelivery = async () => {
    setSavingDelivery(true)
    setDeliveryErrors({})
    setDeliveryNotice('')
    try {
      await api('/api/account/delivery', 'PUT', delivery)
      setDeliveryNotice('Delivery details saved to your profile.')
    } catch (error) {
      if (error instanceof ApiError) setDeliveryErrors(error.fields)
      setDeliveryNotice(error instanceof Error ? error.message : 'Could not save delivery details.')
    } finally {
      setSavingDelivery(false)
    }
  }
  const placeOrder = async () => {
    if (checkingOut || savingDelivery) return
    setDeliveryErrors({})
    setDeliveryNotice('')
    setCheckingOut(true)
    checkoutKey.current ||= crypto.randomUUID()
    try {
      const data = await api<{ order: OrderSummary }>(
        '/api/orders',
        'POST',
        {
          items: cart,
          customerName: user?.fullName || user?.name || 'Customer',
          customerEmail: user?.email || '',
          deliveryAddress: delivery,
        },
        { 'Idempotency-Key': checkoutKey.current }
      )
      deliveryDialog.current?.close()
      setCart([])
      if (data.order) {
        setPurchaseSuccess(data.order)
        setOrders((prev) => [data.order, ...prev.filter((order) => order.id !== data.order.id)])
        checkoutKey.current = null
      }
    } catch (error) {
      if (error instanceof ApiError) setDeliveryErrors(error.fields)
      setDeliveryNotice(
        error instanceof Error ? error.message : 'Could not complete checkout. Please try again.'
      )
    } finally {
      setCheckingOut(false)
    }
  }

  const openProductModal = (product: Product) => {
    const colors = getProductColors(product)
    setSelectedPhotoIndex(0)
    setLightboxIndex(0)
    setSelectedProduct(product)
    setSelectedSizeForModal(getSizesArray(product.size)[0] || '')
    setSelectedColorForModal(colors[0] || null)
    setSelectedQuantityForModal(1)
    setUseCustomTailoring(false)
    setTailorMeasurements({})
    setShowProductModal(true)
  }

  const scrollLeft = () => gridContainerRef.current?.scrollBy({ left: -400, behavior: 'smooth' })
  const scrollRight = () => gridContainerRef.current?.scrollBy({ left: 400, behavior: 'smooth' })

  // ── Nav - UPDATED with dynamic Works button ─────────────────────────────────
  // ── Sub-components ────────────────────────────────────────────────────────

  const FooterNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto px-6 md:px-12">
      <Link
        href="/about"
        className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black"
      >
        Whatsapp
      </Link>
      <Link
        href="/contact"
        className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black"
      >
        Instagram
      </Link>
      <Link
        href="/returns"
        className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black"
      >
        Tiktok
      </Link>
    </nav>
  )

  const allImages = Array.from(
    new Map(
      [
        selectedColorForModal?.imageUrl || selectedProduct?.imageUrl,
        ...(selectedProduct?.images || [])
          .slice(0, 2)
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((image) => image.imageUrl),
      ]
        .filter((url): url is string => !!url)
        .map((imageUrl) => [imageUrl, { imageUrl }])
    ).values()
  )
  const selectedPhoto = allImages[Math.min(selectedPhotoIndex, Math.max(0, allImages.length - 1))]
  const safeImageIndex = allImages.length
    ? ((lightboxIndex % allImages.length) + allImages.length) % allImages.length
    : 0
  useEffect(() => {
    if (!showLightbox || !allImages.length) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowLightbox(false)
      if (event.key === 'ArrowRight') setLightboxIndex((index) => (index + 1) % allImages.length)
      if (event.key === 'ArrowLeft')
        setLightboxIndex((index) => (index - 1 + allImages.length) % allImages.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showLightbox, allImages.length])

  // Product Detail Modal
  const renderProductDetailModal = () => {
    if (!selectedProduct) return null
    const productColors = getProductColors(selectedProduct)
    const availableSizes = getSizesArray(selectedProduct.size)
    const measurementFields = getTailorFields(selectedProduct)

    const handleAddToCartFromModal = () => {
      if (!useCustomTailoring && !selectedSizeForModal) {
        setNotification({ message: 'Please select a size', type: 'error' })
        return
      }
      const missingMeasurement =
        useCustomTailoring && measurementFields.some((field) => !tailorMeasurements[field])
      if (missingMeasurement) {
        setNotification({ message: 'Please complete your custom measurements', type: 'error' })
        return
      }
      addToCart(
        selectedProduct,
        useCustomTailoring ? 'Custom Tailored' : selectedSizeForModal,
        selectedQuantityForModal,
        selectedColorForModal?.name || '',
        useCustomTailoring ? tailorMeasurements : null,
        useCustomTailoring
      )
      setShowProductModal(false)
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div
          data-product-dialog-scroll
          className="bg-[#f8f7f4] border border-white/20 max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-[0_30px_90px_rgba(0,0,0,.45)]"
        >
          <div className="sticky top-0 z-10 bg-[#f8f7f4]/95 p-5 border-b border-black/10 flex justify-between items-center backdrop-blur-xl">
            <h2 className="text-2xl font-light text-black">{selectedProduct.name}</h2>
            <button
              onClick={() => setShowProductModal(false)}
              className="w-8 h-8 rounded-full hover:bg-black hover:text-white transition flex items-center justify-center text-black"
            >
              ✕
            </button>
          </div>
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-3">
              {selectedPhoto && (
                <button
                  type="button"
                  className="block w-full aspect-[5/6] bg-zinc-100 overflow-hidden border border-black/10 cursor-zoom-in"
                  aria-label="Enlarge selected product photo"
                  onClick={() => {
                    setLightboxIndex(selectedPhotoIndex)
                    setShowLightbox(true)
                  }}
                >
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={selectedProduct.name + ' ? selected view'}
                    className="w-full h-full object-cover"
                  />
                </button>
              )}
              {allImages.length > 1 && (
                <div className="grid grid-cols-3 gap-3" aria-label="Product views">
                  {allImages.map((image, index) => (
                    <button
                      type="button"
                      key={image.imageUrl}
                      aria-label={`Show product photo ${index + 1}`}
                      aria-pressed={selectedPhotoIndex === index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`aspect-[4/5] overflow-hidden bg-zinc-100 border-2 transition ${selectedPhotoIndex === index ? 'border-black' : 'border-transparent hover:border-black/30'}`}
                    >
                      <img
                        src={image.imageUrl}
                        alt={selectedProduct.name + ' ? view ' + (index + 1)}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              {selectedPhoto && (
                <p className="text-xs text-black/50">
                  Choose a view below. Click the large photo to enlarge.
                </p>
              )}
            </div>
            <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="border-b border-black/10 pb-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-black/45">
                  {selectedProduct.storeCategory || 'Uncategorized'}
                </p>
                <p className="mt-4 text-sm leading-7 text-black/68">
                  {selectedProduct.description}
                </p>
                <p className="mt-5 text-3xl font-light text-black">${selectedProduct.price}</p>
              </div>
              {productColors.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.24em] text-black/50 mb-3">
                    Color
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {productColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => {
                          setSelectedColorForModal(color)
                          setSelectedPhotoIndex(0)
                        }}
                        className={`flex items-center gap-2 border px-3 py-2 text-xs transition ${
                          selectedColorForModal?.name === color.name
                            ? 'border-black bg-black text-white'
                            : 'border-black/20 bg-white/60 text-black hover:border-black'
                        }`}
                      >
                        <span
                          className="h-5 w-5 rounded-full border border-black/20"
                          style={{ backgroundColor: color.hex || '#111111' }}
                        />
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.24em] text-black/50 mb-3">
                    Select Size
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSizeForModal(size)}
                        className={`px-4 py-2 border text-xs transition ${
                          selectedSizeForModal === size
                            ? 'bg-black text-white border-black'
                            : 'border-black/25 bg-white/60 text-black hover:bg-black hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedProduct.allowCustomTailoring !== false && (
                <div className="border border-black/10 bg-white/55 p-4">
                  <label className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-sm font-medium text-black">
                        Custom tailor sizing
                      </span>
                      <span className="block text-xs text-black/55">
                        Enter measurements for a made-to-fit finish.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={useCustomTailoring}
                      onChange={(e) => setUseCustomTailoring(e.target.checked)}
                      className="h-5 w-5 accent-black"
                    />
                  </label>
                  {useCustomTailoring && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {measurementFields.map((field) => (
                        <label
                          key={field}
                          className="text-xs uppercase tracking-wide text-black/50"
                        >
                          {field}
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={tailorMeasurements[field] || ''}
                            onChange={(e) =>
                              setTailorMeasurements((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="inches"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-black/60 mb-2">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setSelectedQuantityForModal(Math.max(1, selectedQuantityForModal - 1))
                    }
                    className="w-8 h-8 rounded-full border border-black/30 hover:bg-black hover:text-white transition text-black"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center text-black">
                    {selectedQuantityForModal}
                  </span>
                  <button
                    onClick={() => setSelectedQuantityForModal(selectedQuantityForModal + 1)}
                    className="w-8 h-8 rounded-full border border-black/30 hover:bg-black hover:text-white transition text-black"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-black/60">Stock Status</h3>
                <p
                  className={`text-sm ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}
                </p>
              </div>
              <button
                onClick={handleAddToCartFromModal}
                disabled={
                  selectedProduct.stock === 0 || (!selectedSizeForModal && !useCustomTailoring)
                }
                className="w-full py-3.5 bg-black text-white hover:bg-white hover:text-black border border-black transition disabled:opacity-50 disabled:cursor-not-allowed text-[10px] uppercase tracking-[0.28em] font-medium"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderLightboxModal = () => {
    if (!selectedProduct || !showLightbox) return null
    if (!allImages.length) return null

    const nextImage = () => setLightboxIndex((p) => (p + 1) % allImages.length)
    const prevImage = () => setLightboxIndex((p) => (p - 1 + allImages.length) % allImages.length)

    return (
      <div
        role="dialog"
        aria-label="Product photo viewer"
        aria-modal="true"
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
      >
        <button
          onClick={() => setShowLightbox(false)}
          aria-label="Close photo viewer"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition"
        >
          ✕
        </button>
        <button
          onClick={prevImage}
          aria-label="Previous photo"
          className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition"
        >
          ←
        </button>
        <button
          onClick={nextImage}
          aria-label="Next photo"
          className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition"
        >
          →
        </button>
        <div className="max-w-5xl max-h-[85vh] flex items-center justify-center">
          <img
            src={allImages[safeImageIndex].imageUrl}
            alt={selectedProduct.name}
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
          {safeImageIndex + 1} / {allImages.length}
        </div>
      </div>
    )
  }

  const trackingStages = [
    { id: 'received', label: 'Order received' },
    { id: 'packaged', label: 'Being packaged' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ]

  const TrackingPanel = () => (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-[#f8f7f4] border-t border-black/10 shadow-2xl transition-transform duration-500 ${showTracking ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">Order tracking</p>
            <h2 className="mt-1 text-2xl font-light text-black">Your Atelier Progress</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshOrders}
              className="rounded-full border border-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowTracking(false)}
              className="h-9 w-9 rounded-full border border-black/20 hover:bg-black hover:text-white"
            >
              x
            </button>
          </div>
        </div>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-black/50">
            No orders yet. Your next piece will appear here after checkout.
          </p>
        ) : (
          <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-2">
            {orders.map((order) => {
              const activeIndex = trackingStages.findIndex(
                (stage) => stage.id === order.trackingStage
              )
              return (
                <div key={order.id} className="border border-black/10 bg-white/70 p-5">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-black">{order.orderNumber}</p>
                      <p className="text-xs text-black/50">
                        ${order.totalAmount} • {order.createdAt}
                      </p>
                    </div>
                    <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-wide text-white">
                      {order.trackingStage}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {trackingStages.map((stage, index) => {
                      const isDone = index <= activeIndex
                      return (
                        <div key={stage.id} className="relative">
                          <div
                            className={`h-1 rounded-full ${isDone ? 'bg-black' : 'bg-black/10'}`}
                          />
                          <div
                            className={`mt-3 flex h-8 w-8 items-center justify-center rounded-full border text-xs ${isDone ? 'border-black bg-black text-white' : 'border-black/15 text-black/35'}`}
                          >
                            {index + 1}
                          </div>
                          <p className={`mt-2 text-xs ${isDone ? 'text-black' : 'text-black/40'}`}>
                            {stage.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const PurchaseSuccessModal = () =>
    purchaseSuccess && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md border border-white/20 bg-[#f8f7f4] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-black animate-successPulse">
            <span className="text-3xl">✓</span>
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">Annie's Stitches</p>
          <h2 className="mt-3 text-3xl font-light text-black">Your order is received</h2>
          <p className="mt-3 text-sm text-black/60">
            Your order {purchaseSuccess.orderNumber} is awaiting payment confirmation. The studio
            will contact you with the next steps.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setPurchaseSuccess(null)
                setShowTracking(true)
              }}
              className="flex-1 bg-black px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white hover:bg-white hover:text-black border border-black transition"
            >
              Track order
            </button>
            <button
              onClick={() => setPurchaseSuccess(null)}
              className="flex-1 border border-black px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-black hover:bg-black hover:text-white transition"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )

  const productGroups = getProductsByCategory()
  const filteredProducts = filteredProductsForSearch

  if (isEmpty) {
    return (
      <>
        <Head title="Store | Annie's Stitches" />
        <div className="store-sage min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">🛍️</p>
            <p className="text-black/70 text-lg">No products available yet</p>
            <p className="text-black/50 text-sm mt-2">Check back soon for new arrivals</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head title="Store | Annie's Stitches" />

      <div
        className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-1000 ${pageLoaded ? 'opacity-0' : 'opacity-100'}`}
      />

      <div className="store-sage min-h-screen font-['Inter'] transition-colors duration-1000 relative overflow-hidden">
        {/* Top hero background */}
        <div
          className="store-backdrop absolute inset-x-0 top-0 h-[620px] bg-cover bg-center bg-no-repeat transition-all duration-700 z-0"
          style={{
            backgroundImage: `url('/images/generated/studio.png')`,
          }}
        />

        {/* Dark overlay for better readability */}
        <div className="store-atmosphere absolute inset-x-0 top-0 h-[620px] z-[1]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[620px] opacity-[0.26] [background-image:linear-gradient(rgba(0,0,0,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:84px_84px]" />

        {/* Toast notification */}
        {notification && (
          <div className="fixed top-24 right-4 z-50 animate-slideIn">
            <div
              className={`px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-white text-black border border-black/15' : 'bg-red-600 text-white'}`}
            >
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        )}

        <dialog ref={deliveryDialog} className="delivery-checkout" aria-labelledby="delivery-title">
          <h2 id="delivery-title">Where shall we send your order?</h2>
          <p style={{ marginBottom: 20 }}>
            Save your delivery details to reuse them on your next visit.
          </p>
          {deliveryNotice && (
            <p role="status" style={{ marginBottom: 16 }}>
              {deliveryNotice}
            </p>
          )}
          {deliveryLoading ? (
            <p role="status">Loading delivery details...</p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void placeOrder()
              }}
            >
              <DeliveryFields
                value={delivery}
                onChange={setDelivery}
                errors={deliveryErrors}
                disabled={checkingOut || savingDelivery}
              />
              <p style={{ marginTop: 20 }}>Order total: $ {getCartTotal().toFixed(2)}</p>
              <div className="delivery-actions">
                <button
                  type="button"
                  onClick={saveDelivery}
                  disabled={checkingOut || savingDelivery}
                >
                  {savingDelivery ? 'Saving...' : 'Save delivery details'}
                </button>
                <button type="submit" disabled={checkingOut || savingDelivery}>
                  {checkingOut ? 'Placing order...' : 'Place order'}
                </button>
              </div>
            </form>
          )}
          <div className="delivery-actions">
            <button
              type="button"
              disabled={checkingOut || savingDelivery}
              onClick={() => deliveryDialog.current?.close()}
            >
              Back to cart
            </button>
          </div>
        </dialog>
        {/* Cart sidebar */}
        <div
          className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white border-l border-black/15 shadow-2xl z-50 transform transition-transform duration-500 ${showCart ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-black/10 flex justify-between items-center">
              <h2 className="text-xl font-medium text-black">Your Cart ({cart.length})</h2>
              <button
                onClick={() => setShowCart(false)}
                className="w-10 h-10 rounded-full hover:bg-black hover:text-white transition text-2xl text-black"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center text-black/50 mt-20">
                  <p className="text-4xl mb-4">🛒</p>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.selectedSize}`}
                      className="flex gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-sm"
                    >
                      <div className="w-20 h-20 bg-zinc-100 rounded-lg flex items-center justify-center text-black/40">
                        ○
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-black">{item.name}</h3>
                        <p className="text-black/60 text-xs">Size: {item.selectedSize}</p>
                        {item.color && <p className="text-black/60 text-xs">Color: {item.color}</p>}
                        {item.isCustomTailored && (
                          <p className="text-xs text-black mt-1">Custom tailored</p>
                        )}
                        <p className="text-black/60 text-xs mt-1">${item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.selectedSize,
                                item.quantity - 1,
                                item.color
                              )
                            }
                            className="w-6 h-6 border border-black/30 rounded-full hover:bg-black hover:text-white transition text-black"
                          >
                            -
                          </button>
                          <span className="text-sm w-8 text-center text-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.selectedSize,
                                item.quantity + 1,
                                item.color
                              )
                            }
                            className="w-6 h-6 border border-black/30 rounded-full hover:bg-black hover:text-white transition text-black"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id, item.selectedSize, item.color)}
                            className="ml-auto text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-black/10">
                <div className="flex justify-between mb-4">
                  <span className="font-medium text-black">Total</span>
                  <span className="font-medium text-black">${getCartTotal().toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-3 bg-black text-white rounded-full hover:bg-white hover:text-black border border-black transition font-medium"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-full md:w-96 bg-white border-r border-black/15 shadow-2xl z-50 transform transition-transform duration-500 ${showWishlist ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-black/10 flex justify-between items-center">
              <h2 className="text-xl font-medium text-black">Your Wishlist ({wishlist.length})</h2>
              <button
                onClick={() => setShowWishlist(false)}
                className="w-10 h-10 rounded-full hover:bg-black hover:text-white transition text-2xl text-black"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {wishlist.length === 0 ? (
                <div className="text-center text-black/50 mt-20">
                  <p className="text-4xl mb-4">🤍</p>
                  <p>Your wishlist is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-sm"
                    >
                      <div className="w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black/40">
                            ○
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-black">{item.name}</h3>
                        <p className="text-black/60 text-xs mt-1">${item.price}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => openProductModal(item)}
                            className="text-xs px-3 py-1 border border-black/30 rounded-full hover:bg-black hover:text-white transition text-black"
                          >
                            View
                          </button>
                          <button
                            onClick={() => toggleWishlist(item)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {(showCart || showWishlist) && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setShowCart(false)
              setShowWishlist(false)
            }}
          />
        )}

        {/* Search results dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-48 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 border border-black/15">
            <div className="p-4">
              <h3 className="text-sm font-medium text-black/70 mb-3">
                Search Results ({searchResults.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-lg cursor-pointer"
                    onClick={() => openProductModal(product)}
                  >
                    <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/40">
                          ○
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-black">{product.name}</h4>
                      <p className="text-xs text-black/60">
                        ${product.price} • {product.storeCategory || 'Uncategorized'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openProductModal(product)
                      }}
                      className="text-xs px-3 py-1 border border-black/30 rounded-full hover:bg-black hover:text-white transition text-black"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Top navigation ────────────────────────────────────────────── */}
        <div className="w-full pt-16 px-6 md:px-12 relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="w-full relative">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    {/* Wishlist button - BOUNCING ANIMATION */}
                    <button
                      onClick={() => setShowTracking(true)}
                      className="relative rounded-full border border-black/25 bg-white px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-black transition-all duration-300 hover:bg-black hover:text-white"
                    >
                      Track
                    </button>
                    <button
                      onClick={handleWishlistClick}
                      aria-label="Open wishlist"
                      className="relative rounded-full border border-black/25 bg-white p-2.5 text-black transition-all duration-300 hover:bg-black hover:text-white"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">🤍</span>
                      {wishlist.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                          {wishlist.length}
                        </span>
                      )}
                    </button>
                    {/* Cart button - BOUNCING ANIMATION */}
                    <button
                      onClick={handleCartClick}
                      aria-label="Open cart"
                      className="relative rounded-full border border-black/25 bg-white p-2.5 text-black transition-all duration-300 hover:bg-black hover:text-white"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">🛒</span>
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                          {cart.length}
                        </span>
                      )}
                    </button>
                    {/* Profile button - TRANSPARENT */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero section - Updated text colors for dark overlay */}
        <div className="w-full px-6 md:px-12 pt-20 pb-16 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end border-y border-black/15 py-12">
              <div className="animate-slideUp">
                <p className="text-sm text-black/60 mb-2 tracking-wide font-medium">
                  — READY-TO-WEAR —
                </p>
                <h1 className="text-6xl md:text-8xl font-light tracking-tight text-black">
                  Annie Stitches
                </h1>
                <p className="text-black/60 mt-4 max-w-md text-lg">
                  {categories
                    .slice(1, 4)
                    .map((c) => c.name)
                    .join(' • ')}
                </p>
              </div>
              <div
                className="w-full md:w-80 mt-8 md:mt-0 animate-slideUp delay-200 relative"
                ref={searchInputRef}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-white/80 border border-black/25 px-6 py-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black transition shadow-sm backdrop-blur"
                />
                <span className="absolute right-4 top-3 text-black/50 text-lg">⌕</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content - Grouped by category rows */}
        <div className="w-full px-6 md:px-12 py-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Category filters */}
            <div className="mb-12 border-b border-black/10 pb-6">
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition duration-300 font-medium ${
                      selectedCategory === category.id
                        ? 'bg-black text-white shadow-md'
                        : 'border border-black/25 text-black hover:bg-black hover:text-white bg-white/75'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* View toggle */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-2">
                <button
                  onClick={scrollLeft}
                  className="w-10 h-10 rounded-full border border-black hover:bg-black hover:text-white transition flex items-center justify-center text-xl bg-white text-black"
                >
                  ←
                </button>
                <button
                  onClick={scrollRight}
                  className="w-10 h-10 rounded-full border border-black hover:bg-black hover:text-white transition flex items-center justify-center text-xl bg-white text-black"
                >
                  →
                </button>
              </div>
              <button
                onClick={() => setIsGridView(!isGridView)}
                className="text-[10px] uppercase tracking-[0.2em] text-black transition flex items-center gap-2 border border-black/25 px-4 py-2 hover:bg-black hover:text-white bg-white"
              >
                <span className="text-lg">{isGridView ? '⊞' : '⊟'}</span>
                <span>{isGridView ? 'grid view' : 'scroll view'}</span>
              </button>
            </div>

            {/* Search results count */}
            {searchQuery && (
              <div className="mb-8 text-center">
                <p className="text-black/70">
                  Found {filteredProducts.length} results for "{searchQuery}"
                </p>
              </div>
            )}

            {/* Grouped Products by Category */}
            {productGroups.map(
              (group, groupIndex) =>
                group.products.length > 0 && (
                  <div key={groupIndex} className="mb-16">
                    <div className="mb-6 flex items-end justify-between gap-4 pb-3 border-b border-black/15">
                      <h2 className="text-3xl md:text-4xl font-light tracking-tight text-black">
                        {group.categoryName}
                      </h2>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black/45">
                        {group.products.length} items
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {group.products.map((product) => {
                        const availableSizes = getSizesArray(product.size)
                        return (
                          <div
                            key={product.id}
                            className="group bg-white/90 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-black/10 hover:border-black/45 hover:-translate-y-1 cursor-pointer"
                            onClick={() => openProductModal(product)}
                          >
                            <div className="aspect-[4/5] bg-zinc-100 relative overflow-hidden border-b border-black/10">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-black/30 text-4xl">
                                  ○
                                </div>
                              )}
                              <button
                                aria-label={`Save ${product.name} to wishlist`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleWishlist(product)
                                }}
                                className="absolute top-3 right-3 w-9 h-9 bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition-transform border border-black/15 backdrop-blur"
                              >
                                <span
                                  className={`text-lg ${isInWishlist(product.id) ? 'text-red-500' : 'text-black'}`}
                                >
                                  {isInWishlist(product.id) ? '❤️' : '🤍'}
                                </span>
                              </button>
                            </div>
                            <div className="p-5">
                              <div className="text-[10px] font-medium text-black/45 mb-2 tracking-[0.24em] uppercase">
                                {product.storeCategory || 'Uncategorized'}
                              </div>
                              <h3 className="text-base font-semibold text-black mb-2 line-clamp-1">
                                {product.name}
                              </h3>
                              <p className="text-xs text-black/60 mb-3 line-clamp-2">
                                {product.description}
                              </p>
                              <div className="flex items-baseline justify-between items-center border-t border-black/10 pt-3">
                                <span className="text-xl font-medium text-black">
                                  ${product.price}
                                </span>
                                <span className="text-xs font-medium text-black/50">USD</span>
                              </div>
                              {availableSizes.length > 0 && (
                                <div className="mt-2 text-xs text-black/50">
                                  Sizes: {availableSizes.join(', ')}
                                </div>
                              )}
                              <div className="mt-1 text-xs">
                                {product.stock > 0 ? (
                                  <span className="text-green-400">
                                    ✓ In stock ({product.stock})
                                  </span>
                                ) : (
                                  <span className="text-red-400">✗ Out of stock</span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openProductModal(product)
                                }}
                                className="mt-4 w-full py-2.5 bg-black border border-black text-white text-[10px] uppercase tracking-[0.22em] font-medium hover:bg-white hover:text-black transition-all duration-300 shadow-md"
                              >
                                Select Options
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
            )}

            {/* No products found */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4 text-black/70">🛍️</p>
                <p className="text-black/70 text-lg">No products found</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setSearchQuery('')
                  }}
                  className="mt-4 px-6 py-2 bg-black text-white rounded-full text-sm hover:bg-white hover:text-black border border-black transition"
                >
                  Clear Filters
                </button>
              </div>
            )}

            <div className="mt-32 text-center">
              <p className="text-sm font-medium text-black/50 tracking-[0.3em]">
                — 2026 COLLECTION —
              </p>
              <p className="text-black/50 text-base mt-4">each piece thoughtfully made</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full px-6 md:px-12 py-12 border-t border-black/10 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-sm font-medium text-black/50">© ANNIE'S STITCHES</div>
              <FooterNavButtons />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProductModal && renderProductDetailModal()}
      {showLightbox && renderLightboxModal()}
      <TrackingPanel />
      <PurchaseSuccessModal />

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes successPulse {
          0% { transform: scale(0.84); opacity: 0; }
          70% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
        .animate-slideUp { opacity: 0; animation: slideUp 0.5s ease-out forwards; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .animate-successPulse { animation: successPulse 0.8s cubic-bezier(.2,.8,.2,1) forwards; }
        .animate-bounce-slow { animation: bounce-slow 1.5s ease-in-out infinite; }
        .delay-200 { animation-delay: 200ms; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .scroll-smooth { scroll-behavior: smooth; }
      `}</style>
    </>
  )
}

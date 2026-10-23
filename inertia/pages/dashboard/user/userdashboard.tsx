import { useState, useRef, useEffect } from 'react'
import { Head, Link } from '@inertiajs/react'
import useEditorialMotion from '~/pages/components/useEditorialMotion'
import ResponsiveFashionImage from '~/pages/components/ResponsiveFashionImage'
import UserDashboardLayout from '~/pages/Layouts/UserDashboardLayout'

// Types for data from database
interface CollectionData {
  id: number
  title: string
  bio: string
  journeyText: string
  happyClients: number
  yearsExperience: number
  services: string[] | string
}

interface Category {
  id: number
  name: string
  slug: string
  description: string
  coverImage?: string
}

interface ProductImage {
  id: number
  imageUrl: string
  sortOrder: number
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  size: string | null
  stock: number
  storeCategory?: string
  imageUrl?: string
  images?: ProductImage[]
  createdAt?: string
}

const sampleNewProducts: Product[] = []

const fetchJsonOrFallback = async <T,>(url: string, fallback: T): Promise<T> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`${url} returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    return fallback
  }
}

export default function UserDashboard() {
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>(sampleNewProducts)
  const [loading, setLoading] = useState(true)
  useEditorialMotion('.collection-salon', !loading)

  const gridSectionRef = useRef<HTMLElement>(null)

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      const [collectionJson, categoriesJson, productsJson] = await Promise.all([
        fetchJsonOrFallback<CollectionData | null>('/api/collection', null),
        fetchJsonOrFallback<Category[]>('/api/categories', []),
        fetchJsonOrFallback<Product[]>('/api/products', []),
      ])

      setCollectionData(collectionJson)
      setCategories(Array.isArray(categoriesJson) ? categoriesJson : [])

      if (Array.isArray(productsJson) && productsJson.length > 0) {
        const newestProducts = [...productsJson].sort((a, b) => {
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
          return bTime - aTime
        })
        setNewProducts(newestProducts.slice(0, 8))
      } else {
        setNewProducts(sampleNewProducts)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const footerCategories = [
    { name: 'Whatsapp', link: '/about' },
    { name: 'Instagram', link: '/contact' },
    { name: 'Tiktok', link: '/returns' },
  ]

  const defaultCollectionItems = [
    {
      title: 'Evening Gowns',
      link: '/guests/eveninggowns',
      imageBg: 'bg-gradient-to-br from-purple-900/50 to-black',
      coverImage: null,
    },
    {
      title: 'Corset Dresses',
      link: '/guests/corsetdresses',
      imageBg: 'bg-gradient-to-br from-purple-900/50 to-black',
      coverImage: null,
    },
    {
      title: 'Aso-Ebi Specials',
      link: '/guests/asobispecials',
      imageBg: 'bg-gradient-to-br from-purple-900/50 to-black',
      coverImage: null,
    },
    {
      title: "Men's Classic",
      link: '/guests/mensclassic',
      imageBg: 'bg-gradient-to-br from-purple-900/50 to-black',
      coverImage: null,
    },
    {
      title: 'Bridal Collection',
      link: '/guests/bridalcollection',
      imageBg: 'bg-gradient-to-br from-purple-900/50 to-black',
      coverImage: null,
    },
    {
      title: 'Custom Pieces',
      link: '/guests/custompieces',
      imageBg: 'bg-gradient-to-br from-purple-900/50 to-black',
      coverImage: null,
    },
  ]

  const collectionItems =
    loading || !Array.isArray(categories) || categories.length === 0
      ? defaultCollectionItems
      : categories.map((category) => ({
          title: category.name,
          link: `/guests/${category.slug}`,
          imageBg: 'bg-gradient-to-br from-purple-900/50 to-black',
          coverImage: category.coverImage,
        }))

  const carouselProducts = [...newProducts, ...newProducts]

  const [clientCount, setClientCount] = useState(0)
  const [yearCount, setYearCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const statsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasAnimated && collectionData) {
          setHasAnimated(true)

          const targetClients = collectionData.happyClients || 1000
          const targetYears = collectionData.yearsExperience || 8

          let clientCurrent = 0
          const clientInterval = setInterval(() => {
            clientCurrent += Math.ceil(targetClients / 30)
            if (clientCurrent >= targetClients) {
              setClientCount(targetClients)
              clearInterval(clientInterval)
            } else {
              setClientCount(clientCurrent)
            }
          }, 30)

          let yearCurrent = 0
          const yearInterval = setInterval(() => {
            yearCurrent += Math.ceil(targetYears / 20)
            if (yearCurrent >= targetYears) {
              setYearCount(targetYears)
              clearInterval(yearInterval)
            } else {
              setYearCount(yearCurrent)
            }
          }, 50)
        } else if (!entry.isIntersecting && hasAnimated) {
          setClientCount(0)
          setYearCount(0)
          setHasAnimated(false)
        }
      },
      { threshold: 0.5 }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current)
      }
    }
  }, [hasAnimated, collectionData])

  const scrollToGrid = () => {
    if (gridSectionRef.current) {
      gridSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const getServicesArray = (): string[] => {
    if (!collectionData?.services) {
      return [
        'CUSTOM TAILORING',
        'CORSET & STATEMENT DRESSES',
        'READY-TO-WEAR',
        'TRADITIONAL WEAR (ASO-EBI & ANKARA)',
        'MENS CASUAL WEAR',
        "MEN'S TRADITIONAL WEAR",
      ]
    }

    if (Array.isArray(collectionData.services)) {
      return collectionData.services
    }

    if (typeof collectionData.services === 'string') {
      try {
        const parsed = JSON.parse(collectionData.services)
        if (Array.isArray(parsed)) {
          return parsed
        }
      } catch (e) {
        console.error('Error parsing services:', e)
      }
    }

    return [
      'CUSTOM TAILORING',
      'CORSET & STATEMENT DRESSES',
      'READY-TO-WEAR',
      'TRADITIONAL WEAR (ASO-EBI & ANKARA)',
      'MENS CASUAL WEAR',
      "MEN'S TRADITIONAL WEAR",
    ]
  }

  const services = getServicesArray()
  const halfServices = Math.ceil(services.length / 2)
  const firstColumnServices = services.slice(0, halfServices)
  const secondColumnServices = services.slice(halfServices)

  const FooterNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto px-6 md:px-12">
      {footerCategories.map((category, index) => (
        <Link
          key={index}
          href={category.link}
          className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-transparent backdrop-blur-sm"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <UserDashboardLayout>
      <Head title="Annie's Stitches" />

      <header className="collection-salon-hero">
        <div className="collection-salon-masthead">
          <span>ANNIE'S FASHION HOUSE</span>
          <span>COLLECTIONS / SELECTED WORKS</span>
        </div>
        <div className="collection-editorial-intro">
          <div data-reveal>
            <p className="collection-editorial-kicker">FORM / DETAIL / INDIVIDUALITY</p>
            <h1>
              Annie's
              <br />
              <em>Stitches.</em>
            </h1>
          </div>
          <div className="collection-editorial-summary" data-reveal>
            <p>
              {collectionData?.bio ||
                'An exploration of silhouette, fabric, and the details that make a piece personal. Discover the work, one collection at a time.'}
            </p>
            <button type="button" onClick={scrollToGrid}>
              Explore selected works <span aria-hidden="true">↓</span>
            </button>
            <span>
              {String(collectionItems.length).padStart(2, '0')} COLLECTIONS / ONE POINT OF VIEW
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow relative z-10">
        <section ref={gridSectionRef} className="collection-works px-6 md:px-12 mt-64 scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="collection-section-label">
              <span>01 / THE GALLERY</span>
              <span>{String(collectionItems.length).padStart(2, '0')} COLLECTIONS TO EXPLORE</span>
            </div>
            <div className="collection-heading-row">
              <h2 className="fade-in delay-1 text-2xl md:text-3xl font-light tracking-wide mb-8 text-left">
                Featured works
              </h2>
              <p>
                Different expressions.
                <br />
                <em>One considered point of view.</em>
              </p>
            </div>

            <div className="collection-archive-grid">
              {collectionItems.map((item, index) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className={'collection-archive-entry' + (item.coverImage ? ' has-image' : '')}
                  data-reveal
                >
                  {item.coverImage ? (
                    <ResponsiveFashionImage src={item.coverImage} alt={item.title} />
                  ) : (
                    <div className="collection-archive-photo">
                      <span className="collection-image-placeholder" aria-hidden="true" />
                    </div>
                  )}
                  <div className="collection-archive-caption">
                    <span className="collection-archive-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>Discover the collection</p>
                    </div>
                    <span className="collection-archive-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="collection-arrivals px-6 md:px-12 mt-24 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <p className="fade-in delay-1 text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
                  Latest arrivals
                </p>
                <h2 className="fade-in delay-1 text-2xl md:text-3xl font-light tracking-wide text-left">
                  New Collection
                </h2>
              </div>
              <Link
                href="/store"
                className="fade-in delay-1 hidden sm:inline-flex text-sm border border-white/30 px-4 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 bg-transparent backdrop-blur-sm"
              >
                Shop all
              </Link>
            </div>

            <div className="new-products-viewport -mx-6 md:-mx-12">
              <div className="new-products-track">
                {carouselProducts.map((product, index) => (
                  <Link
                    key={`${product.id}-${index}`}
                    href={`/store?product=${product.id}`}
                    className="group w-[42vw] min-w-36 sm:w-36 md:w-40 shrink-0"
                  >
                    <div className="overflow-hidden rounded-lg border border-white/15 bg-white/[0.06] backdrop-blur-sm transition duration-500 group-hover:border-white/50 group-hover:-translate-y-1">
                      <div className="aspect-[4/5] bg-white/10 overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-zinc-800 via-black to-stone-900" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/40 line-clamp-1">
                          {product.storeCategory || 'New arrival'}
                        </p>
                        <h3 className="mt-1.5 text-xs font-medium text-white line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="mt-1.5 text-[11px] leading-4 text-white/55 line-clamp-2 min-h-8">
                          {product.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white">${product.price}</span>
                          <span className="text-[10px] text-white/45">
                            {product.stock > 0 ? 'In stock' : 'Out of stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="collection-story px-6 md:px-12 mt-32">
          <div className="max-w-7xl mx-auto">
            <div className="collection-story-heading">
              <span>02 / BEHIND THE PIECES</span>
              <h2>
                A thought.
                <br />A thread.
                <br />
                <em>A point of view.</em>
              </h2>
              <Link href="/about">Meet Annabel ↗</Link>
            </div>
            <div className="flex justify-end">
              <div className="max-w-lg text-right space-y-4 text-gray-300">
                <p className="fade-in delay-1 text-sm md:text-base leading-relaxed">
                  {collectionData?.journeyText ||
                    "This is my journey in fashion. I built this brand from the ground up through years of dedication, learning, and hands-on work. Over the past 6–8 years, I've spent countless late nights refining my craft, growing through challenges, and creating pieces with intention."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section ref={statsRef} className="collection-stats px-6 md:px-12 mt-28">
          <div className="max-w-7xl mx-auto">
            <div className="fade-in delay-1 flex gap-24 justify-start">
              <div className="fade-in" style={{ animationDelay: '100ms' }}>
                <h2 className="text-5xl font-bold tabular-nums">{clientCount}+</h2>
                <p className="text-gray-400 text-sm mt-2">Happy Clients</p>
              </div>
              <div className="fade-in" style={{ animationDelay: '200ms' }}>
                <h2 className="text-5xl font-bold tabular-nums">{yearCount}</h2>
                <p className="text-gray-400 text-sm mt-2">Years Experience</p>
              </div>
            </div>
          </div>
        </section>

        <section className="collection-services px-6 md:px-12 mt-32">
          <div className="max-w-7xl mx-auto">
            <div className="border-t border-white/20 pt-16">
              <h2 className="fade-in delay-1 text-2xl md:text-3xl font-light tracking-wide mb-12 text-center md:text-left">
                What we do
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
                <div className="space-y-3">
                  {firstColumnServices.map((service, idx) => (
                    <p
                      key={idx}
                      className="fade-in text-sm md:text-base text-gray-300 border-b border-white/10 pb-2"
                      style={{ animationDelay: `${100 + idx * 50}ms` }}
                    >
                      {service}
                    </p>
                  ))}
                </div>
                <div className="space-y-3">
                  {secondColumnServices.map((service, idx) => (
                    <p
                      key={idx}
                      className="fade-in text-sm md:text-base text-gray-300 border-b border-white/10 pb-2"
                      style={{ animationDelay: `${250 + idx * 50}ms` }}
                    >
                      {service}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="collection-footer w-full mt-40 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex justify-start mb-16">
            <Link
              href="/store"
              className="fade-in text-sm border border-white/30 px-4 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 inline-flex items-center gap-2 bg-transparent backdrop-blur-sm"
            >
              Visit Full Store
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="w-full">
          <FooterNavButtons />
        </div>

        <h1 className="text-[11.5vw] whitespace-nowrap leading-[0.75] font-bold tracking-tighter opacity-[0.06] select-none pointer-events-none mt-20 px-6 md:px-12">
          <Link href="/" className="hover:opacity-80 transition block">
            <span className="inline-block">ANNIE'S STITCHES</span>
          </Link>
        </h1>
      </footer>

      <style>{`
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.8s ease-in forwards;
        }
        
        .delay-1 {
          animation-delay: 0.2s;
        }
        
        .delay-2 {
          animation-delay: 0.4s;
        }
        
        .delay-3 {
          animation-delay: 0.6s;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .new-products-viewport {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
        }

        .new-products-viewport::-webkit-scrollbar {
          display: none;
        }

        .new-products-track {
          display: flex;
          gap: 0.875rem;
          width: max-content;
          padding: 0.25rem 3rem 1rem;
          animation: newProductsMarquee 42s linear infinite;
        }

        .new-products-viewport:hover .new-products-track {
          animation-play-state: paused;
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes newProductsMarquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .new-products-track {
            animation: none;
          }
        }
      `}</style>
    </UserDashboardLayout>
  )
}

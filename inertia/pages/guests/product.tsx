import { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import ResponsiveFashionImage from '../components/ResponsiveFashionImage';

interface Work {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  price: number | null;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface Props {
  category: Category | null;
  works: Work[];
  isEmpty: boolean;
  error?: boolean;
}

export default function ProductPage({ category, works, isEmpty, error }: Props) {
  // ── Auth state from Inertia shared props ──────────────────────────────────
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [nextCategory, setNextCategory] = useState<Category | null>(null);

  // ── Fetch all categories to find next category ─────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setAllCategories(data);
          
          // Find the next category
          if (category && data.length > 0) {
            const currentIndex = data.findIndex(c => c.slug === category.slug);
            if (currentIndex !== -1) {
              const nextIndex = (currentIndex + 1) % data.length;
              setNextCategory(data[nextIndex]);
            } else {
              setNextCategory(data[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, [category]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  const goToNextCategory = () => {
    if (nextCategory) {
      router.visit(`/guests/${nextCategory.slug}`);
    }
  };

  // ── Image data ────────────────────────────────────────────────────────────
  const productImages = (() => {
    if (!works || works.length === 0) {
      return [{
        id: 1, height: "tall",
        title: category?.name || "Collection",
        description: category?.description || "",
        price: "",
        imageUrl: "/images/generated/evening.png",
      }];
    }
    return works.map((work) => ({
      id: work.id, height: "tall",
      title: work.title,
      description: work.description || "",
      price: work.price ? `$${work.price}` : "",
      imageUrl: work.imageUrl || "/images/generated/evening.png",
    }));
  })();


  // ── Lightbox ──────────────────────────────────────────────────────────────
  const openLightbox = (index: number) => { setCurrentImageIndex(index); setShowLightbox(true); };
  const closeLightbox = () => setShowLightbox(false);
  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % productImages.length);
  const prevImage = () => setCurrentImageIndex((p) => (p - 1 + productImages.length) % productImages.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox]);

  if (error || !category) {
    return (
      <>
        <Head title="Category Not Found" />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-white text-2xl mb-4">Category Not Found</h1>
            <Link href="/" className="text-purple-400 hover:text-purple-300">Back to Home</Link>
          </div>
        </div>
      </>
    );
  }

  // ── Sub-components ────────────────────────────────────────────────────────

  const FooterNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto px-6 md:px-12">
      <Link href="/about" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-transparent backdrop-blur-sm">Whatsapp</Link>
      <Link href="/contact" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-transparent backdrop-blur-sm">Instagram</Link>
      <Link href="/returns" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-transparent backdrop-blur-sm">Tiktok</Link>
    </nav>
  );

  const Lightbox = () => {
    const currentImage = productImages[currentImageIndex];
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center">
        <button onClick={closeLightbox} className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 transition-all duration-300 flex items-center justify-center text-xl md:text-2xl text-white z-20">✕</button>
        <button onClick={prevImage} className="absolute left-2 md:left-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 transition-all duration-300 flex items-center justify-center text-xl md:text-2xl text-white z-20">←</button>
        <button onClick={nextImage} className="absolute right-2 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 transition-all duration-300 flex items-center justify-center text-xl md:text-2xl text-white z-20">→</button>
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
          <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <div className="relative bg-white/5 rounded-2xl overflow-hidden border border-white/20 max-h-full">
              <div className="flex items-center justify-center h-full">
                <img src={currentImage.imageUrl} alt={currentImage.title} className="max-w-full max-h-[70vh] md:max-h-[75vh] object-contain"
                  onError={(e) => { e.currentTarget.src = '/images/generated/evening.png'; }} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 md:p-8">
                <h3 className="text-lg md:text-3xl font-light text-white mb-1 md:mb-2">{currentImage.title}</h3>
                <p className="text-xs md:text-base text-white/80 mb-1 md:mb-2">{currentImage.description}</p>
                <p className="text-sm md:text-lg font-medium text-white mt-1 md:mt-2">{currentImage.price}</p>
              </div>
              <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-black/50 backdrop-blur-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm text-white/80">
                {currentImageIndex + 1} / {productImages.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head title={`${category.name} | Annie's Stitches`} />

      <div className="min-h-screen text-white font-sans overflow-hidden flex flex-col relative">

        {/* Custom Background Image - work rook.png */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 z-0"
          style={{
            backgroundImage: `url('/images/generated/studio.png')`,
            backgroundAttachment: 'fixed',
          }}
        />

        {/* Dark overlay for better text readability */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[1]" />

        {/* TOP SECTION */}
        {/* MAIN CONTENT */}
        <main className="flex-grow w-full px-6 md:px-12 py-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="fade-in delay-1 text-4xl md:text-6xl font-light tracking-tight mb-8">{category.name}</h2>
            <p className="fade-in delay-1 text-sm text-gray-300 max-w-3xl mb-12 leading-relaxed">{category.description}</p>

            {isEmpty ? (
              <div className="text-center py-20">
                <p className="text-white/40 text-lg">No works found in this category yet.</p>
                <p className="text-white/30 text-sm mt-2">Check back soon for new arrivals!</p>
              </div>
            ) : (
              <div className="fade-in delay-2 columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 mb-16">
                {productImages.map((image, index) => (
                  <div key={image.id} className="break-inside-avoid mb-4 cursor-pointer group" onClick={() => openLightbox(index)}>
                    <div className="w-full border border-white/20 bg-gradient-to-br from-white/5 to-white/10 hover:border-white-400 hover:scale-[1.02] transition-all duration-500 rounded-lg overflow-hidden relative">
                      <ResponsiveFashionImage src={image.imageUrl} alt={image.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 className="text-lg font-medium text-white mb-1">{image.title}</h3>
                        <p className="text-xs text-white/80 mb-1 line-clamp-2">{image.description}</p>
                        <p className="text-sm font-medium text-white mt-1">{image.price}</p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-white">Click to view</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* NEXT CATEGORY BUTTON - At the bottom */}
        {nextCategory && (
          <div className="w-full px-6 md:px-12 py-8 relative z-10 flex justify-center">
            <button
              onClick={goToNextCategory}
              className="group relative overflow-hidden px-8 py-3 border border-white/30 text-white rounded-full transition-all duration-500 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] backdrop-blur-sm flex items-center gap-3"
            >
              <span className="relative z-10 text-sm font-medium tracking-wider">
                Next Collection: {nextCategory.name}
              </span>
              <svg 
                className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </button>
          </div>
        )}

        {/* Social / Footer */}
        <div className="w-full py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <FooterNavButtons />
          </div>
        </div>

        <h1 className="fade-in delay-3 ml-2 text-[11.4vw] whitespace-nowrap leading-none font-bold tracking-tight opacity-10 text-left px-0 relative z-10">
          <Link href="/" className="hover:opacity-80 transition block">
            <span className="inline-block">ANNIE'S STITCHES</span>
          </Link>
        </h1>

        <div className="mt-8 text-xs text-gray-600 text-left px-6 md:px-12 max-w-7xl mx-auto pb-20 relative z-10">
          © 2026 ANNIE'S STITCHES — ALL RIGHTS RESERVED
        </div>
      </div>

      {showLightbox && <Lightbox />}

      {/* Modals — only shown for authenticated users */}

      <style>{`
        .fade-in { opacity: 0; animation: fadeIn 0.8s ease-in forwards; }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }
        .delay-4 { animation-delay: 0.8s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .columns-2 { column-count: 2; }
        .columns-3 { column-count: 3; }
        .columns-4 { column-count: 4; }
        @media (max-width: 768px) { .columns-2 { column-count: 2; } }
        @media (max-width: 640px) { .columns-2 { column-count: 1; } }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </>
  );
}

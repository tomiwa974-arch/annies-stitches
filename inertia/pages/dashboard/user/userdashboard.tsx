import { useState, useRef, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { SewingBackground } from "~/pages/components/SewingBackground";

// Types for data from database
interface CollectionData {
  id: number;
  title: string;
  bio: string;
  journeyText: string;
  happyClients: number;
  yearsExperience: number;
  services: string[] | string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  coverImage?: string;
}

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AnnieStitches() {
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showStickyDropdown, setShowStickyDropdown] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  
  const mainDropdownRef = useRef<HTMLDivElement>(null);
  const stickyDropdownRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, message: "New order received", time: "5 min ago", read: false },
    { id: 2, message: "Your item shipped", time: "1 hour ago", read: false },
    { id: 3, message: "New message from customer", time: "3 hours ago", read: true },
    { id: 4, message: "Payment received", time: "1 day ago", read: true },
  ];

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collectionRes, categoriesRes] = await Promise.all([
          fetch('/api/collection'),
          fetch('/api/categories')
        ]);
        
        const collectionJson = await collectionRes.json();
        const categoriesJson = await categoriesRes.json();
        
        setCollectionData(collectionJson);
        setCategories(categoriesJson);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();
        if (!data.error) {
          setLoggedInUser(data);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mainDropdownRef.current && !mainDropdownRef.current.contains(event.target as Node)) {
        setShowMainDropdown(false);
      }
      if (stickyDropdownRef.current && !stickyDropdownRef.current.contains(event.target as Node)) {
        setShowStickyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Top navigation - changes based on login status
  const topCategories = loggedInUser
    ? [
        { name: "Home", link: "/" },
        { name: "Store", link: "/store" },
        { name: "Works", link: "/guests/eveninggowns" },
        { name: "Dashboard", link: "/userdashboard" },
      ]
    : [
        { name: "Home", link: "/" },
        { name: "Store", link: "/store" },
        { name: "Works", link: "/guests/eveninggowns" },
        { name: "Login/Signup", link: "/login" },
      ];

  const footerCategories = [
    { name: "Whatsapp", link: "/about" },
    { name: "Instagram", link: "/contact" },
    { name: "Tiktok", link: "/returns" }
  ];

  const defaultCollectionItems = [
    { title: "Evening Gowns", link: "/guests/eveninggowns", imageBg: "bg-gradient-to-br from-purple-900/50 to-black", coverImage: null },
    { title: "Corset Dresses", link: "/guests/corsetdresses", imageBg: "bg-gradient-to-br from-purple-900/50 to-black", coverImage: null },
    { title: "Aso-Ebi Specials", link: "/guests/asobispecials", imageBg: "bg-gradient-to-br from-purple-900/50 to-black", coverImage: null },
    { title: "Men's Classic", link: "/guests/mensclassic", imageBg: "bg-gradient-to-br from-purple-900/50 to-black", coverImage: null },
    { title: "Bridal Collection", link: "/guests/bridalcollection", imageBg: "bg-gradient-to-br from-purple-900/50 to-black", coverImage: null },
    { title: "Custom Pieces", link: "/guests/custompieces", imageBg: "bg-gradient-to-br from-purple-900/50 to-black", coverImage: null }
  ];

  const collectionItems = loading || categories.length === 0 ? defaultCollectionItems : categories.map(category => ({
    title: category.name,
    link: `/guests/${category.slug}`,
    imageBg: "bg-gradient-to-br from-purple-900/50 to-black",
    coverImage: category.coverImage
  }));

  const [clientCount, setClientCount] = useState(0);
  const [yearCount, setYearCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated && collectionData) {
          setHasAnimated(true);
          
          const targetClients = collectionData.happyClients || 1000;
          const targetYears = collectionData.yearsExperience || 8;
          
          let clientCurrent = 0;
          const clientInterval = setInterval(() => {
            clientCurrent += Math.ceil(targetClients / 30);
            if (clientCurrent >= targetClients) {
              setClientCount(targetClients);
              clearInterval(clientInterval);
            } else {
              setClientCount(clientCurrent);
            }
          }, 30);

          let yearCurrent = 0;
          const yearInterval = setInterval(() => {
            yearCurrent += Math.ceil(targetYears / 20);
            if (yearCurrent >= targetYears) {
              setYearCount(targetYears);
              clearInterval(yearInterval);
            } else {
              setYearCount(yearCurrent);
            }
          }, 50);
        } else if (!entry.isIntersecting && hasAnimated) {
          setClientCount(0);
          setYearCount(0);
          setHasAnimated(false);
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [hasAnimated, collectionData]);

  const [isSticky, setIsSticky] = useState(false);
  const gridSectionRef = useRef<HTMLElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const stickyTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (stickyTriggerRef.current) {
        const triggerRect = stickyTriggerRef.current.getBoundingClientRect();
        const shouldBeSticky = triggerRect.top <= 0;
        
        if (shouldBeSticky !== isSticky) {
          setIsSticky(shouldBeSticky);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky]);

  const scrollToGrid = () => {
    if (gridSectionRef.current) {
      gridSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getServicesArray = (): string[] => {
    if (!collectionData?.services) {
      return [
        "CUSTOM TAILORING", "CORSET & STATEMENT DRESSES", "READY-TO-WEAR",
        "TRADITIONAL WEAR (ASO-EBI & ANKARA)", "MENS CASUAL WEAR", "MEN'S TRADITIONAL WEAR"
      ];
    }
    
    if (Array.isArray(collectionData.services)) {
      return collectionData.services;
    }
    
    if (typeof collectionData.services === 'string') {
      try {
        const parsed = JSON.parse(collectionData.services);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing services:', e);
      }
    }
    
    return [
      "CUSTOM TAILORING", "CORSET & STATEMENT DRESSES", "READY-TO-WEAR",
      "TRADITIONAL WEAR (ASO-EBI & ANKARA)", "MENS CASUAL WEAR", "MEN'S TRADITIONAL WEAR"
    ];
  };

  const services = getServicesArray();
  const halfServices = Math.ceil(services.length / 2);
  const firstColumnServices = services.slice(0, halfServices);
  const secondColumnServices = services.slice(halfServices);

  // Profile Page Component
  const ProfilePage = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-white/20 flex justify-between items-center sticky top-0 bg-white/10 backdrop-blur-md">
          <h2 className="text-3xl font-light text-white">My Profile</h2>
          <button
            onClick={() => setShowProfilePage(false)}
            className="w-10 h-10 rounded-full hover:bg-white/20 transition flex items-center justify-center text-xl text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-8 text-white">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl border-2 border-white/30">
              👤
            </div>
            <div>
              <h3 className="text-2xl font-medium text-white">{loggedInUser?.fullName || 'Annabelle'}</h3>
              <p className="text-white/80">{loggedInUser?.email || 'annabelle@annies.com'}</p>
              <p className="text-white/70 text-sm">Member since 2024</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs text-white/60 block mb-2">Full Name</label>
              <p className="text-lg border-b border-white/20 pb-2 text-white">{loggedInUser?.fullName || 'Annabelle Smith'}</p>
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Email</label>
              <p className="text-lg border-b border-white/20 pb-2 text-white">{loggedInUser?.email || 'annabelle@annies.com'}</p>
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Phone</label>
              <p className="text-lg border-b border-white/20 pb-2 text-white">+1 (555) 123-4567</p>
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Location</label>
              <p className="text-lg border-b border-white/20 pb-2 text-white">New York, NY</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button className="flex-1 py-3 border border-white/30 rounded-full text-sm text-white hover:bg-white hover:text-black transition bg-white/10 backdrop-blur-sm">
              Edit Profile
            </button>
            <button className="flex-1 py-3 bg-white text-black rounded-full text-sm hover:bg-white/80 transition">
              Share Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Notifications Page Component
  const NotificationsPage = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-white/20 flex justify-between items-center sticky top-0 bg-white/10 backdrop-blur-md">
          <h2 className="text-3xl font-light text-white">Notifications</h2>
          <button
            onClick={() => setShowNotificationsPage(false)}
            className="w-10 h-10 rounded-full hover:bg-white/20 transition flex items-center justify-center text-xl text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-white/80">You have {notifications.filter(n => !n.read).length} unread notifications</p>
            <button className="text-sm text-white/70 hover:text-white transition">
              Mark all as read
            </button>
          </div>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 rounded-xl transition cursor-pointer ${
                  notification.read ? 'bg-white/5' : 'bg-white/20 border-l-4 border-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 mt-2 rounded-full ${notification.read ? 'bg-white/40' : 'bg-white'}`} />
                  <div className="flex-1">
                    <p className="text-base text-white">{notification.message}</p>
                    <p className="text-xs text-white/60 mt-2">{notification.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Page Component
  const SettingsPage = () => {
    const [darkMode, setDarkMode] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8 border-b border-white/20 flex justify-between items-center sticky top-0 bg-white/10 backdrop-blur-md">
            <h2 className="text-3xl font-light text-white">Settings</h2>
            <button
              onClick={() => setShowSettingsPage(false)}
              className="w-10 h-10 rounded-full hover:bg-white/20 transition flex items-center justify-center text-xl text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="p-8 space-y-8 text-white">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Account</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 bg-white/10 rounded-xl hover:bg-white/20 transition">
                  <span className="block font-medium text-white">Change Password</span>
                  <span className="text-sm text-white/70">Update your password regularly</span>
                </button>
                <button className="w-full text-left p-4 bg-white/10 rounded-xl hover:bg-white/20 transition">
                  <span className="block font-medium text-white">Email Address</span>
                  <span className="text-sm text-white/70">{loggedInUser?.email || 'annabelle@annies.com'}</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                  <div>
                    <span className="block font-medium text-white">Dark Mode</span>
                    <span className="text-sm text-white/70">Toggle dark theme</span>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-14 h-7 rounded-full transition-colors duration-300 ${
                      darkMode ? 'bg-white' : 'bg-white/30'
                    } relative`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-black absolute top-1 transition-transform duration-300 ${
                      darkMode ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                  <div>
                    <span className="block font-medium text-white">Email Notifications</span>
                    <span className="text-sm text-white/70">Receive updates via email</span>
                  </div>
                  <button
                    onClick={() => setEmailNotif(!emailNotif)}
                    className={`w-14 h-7 rounded-full transition-colors duration-300 ${
                      emailNotif ? 'bg-white' : 'bg-white/30'
                    } relative`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-black absolute top-1 transition-transform duration-300 ${
                      emailNotif ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Dropdown Menu Component
  const DropdownMenu = ({ onClose }: { onClose: () => void }) => (
    <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="p-4 border-b border-white/20">
        <p className="text-sm font-medium text-white">{loggedInUser?.fullName || 'Annabelle'}</p>
        <p className="text-xs text-white/70">{loggedInUser?.email || 'annabelle@annies.com'}</p>
      </div>
      
      <div className="p-2">
        <button
          onClick={() => {
            setShowProfilePage(true);
            onClose();
          }}
          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/20 rounded-lg transition flex items-center gap-3"
        >
          <span className="text-lg">👤</span>
          My Profile
        </button>
        
        <button
          onClick={() => {
            setShowNotificationsPage(true);
            onClose();
          }}
          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/20 rounded-lg transition flex items-center gap-3 relative"
        >
          <span className="text-lg">🔔</span>
          Notifications
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {notifications.filter(n => !n.read).length}
          </span>
        </button>
        
        <button
          onClick={() => {
            setShowSettingsPage(true);
            onClose();
          }}
          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/20 rounded-lg transition flex items-center gap-3"
        >
          <span className="text-lg">⚙️</span>
          Settings
        </button>
        
        <div className="border-t border-white/20 my-2"></div>
        
        <button
          onClick={async () => {
            await fetch('/logout', { method: 'POST' });
            window.location.href = '/';
          }}
          className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
        >
          <span className="text-lg">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  );

  const TopNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto">
      {topCategories.map((category, index) => (
        <Link
          key={index}
          href={category.link}
          className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-md"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );

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
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head title="Annie's Stitches" />

      <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden flex flex-col relative">
        
        <SewingBackground />

        <div
          ref={buttonsRef}
          className={`w-full px-6 md:px-12 transition-all duration-300 ${
            isSticky 
              ? 'fixed top-0 left-0 right-0 z-50 py-3' 
              : 'relative mt-4'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <TopNavButtons />
              </div>
              
              <div className="relative" ref={isSticky ? stickyDropdownRef : mainDropdownRef}>
                <button
                  onClick={() => {
                    if (isSticky) {
                      setShowStickyDropdown(!showStickyDropdown);
                    } else {
                      setShowMainDropdown(!showMainDropdown);
                    }
                  }}
                  className="w-10 h-10 rounded-full border border-white/30 hover:border-white transition-all duration-300 flex items-center justify-center text-lg hover:scale-110 bg-white/10 backdrop-blur-md"
                >
                  👤
                </button>
                
                {isSticky 
                  ? showStickyDropdown && <DropdownMenu onClose={() => setShowStickyDropdown(false)} />
                  : showMainDropdown && <DropdownMenu onClose={() => setShowMainDropdown(false)} />
                }
              </div>
            </div>
          </div>
        </div>

        <div ref={stickyTriggerRef} className="h-0" />
        {isSticky && <div className="h-16" />}

        <header className="w-full pt-16 relative z-10">
          <h1 className="fade-in text-[11.4vw] whitespace-nowrap leading-none font-bold tracking-tight text-left px-6 md:px-12">
            <Link href="/" className="hover:opacity-80 transition block">
              <span className="inline-block">
                ANNIE'S STITCHES
              </span>
            </Link>
          </h1>

          <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
            <div className="flex justify-end">
              <p className="fade-in delay-1 text-sm md:text-base text-gray-300 max-w-md text-right">
                {collectionData?.bio || "Hi I'm Annabelle— a self-made fashion designer. From sketch to stitch, I create thoughtfully made pieces that reflect confidence, detail, and individuality."}
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={scrollToGrid}
                className="group relative inline-flex items-center gap-2 border border-white/30 px-6 py-3 rounded-full hover:bg-white hover:text-black transition duration-300 text-sm font-medium cursor-pointer bg-transparent backdrop-blur-sm"
              >
                Explore Collection
                <svg 
                  className="w-4 h-4 group-hover:translate-y-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow relative z-10">
          <section ref={gridSectionRef} className="px-6 md:px-12 mt-64 scroll-mt-24">
            <div className="max-w-7xl mx-auto">
              <h2 className="fade-in delay-1 text-2xl md:text-3xl font-light tracking-wide mb-8 text-left">
                Featured works
              </h2>
              
              <div className="fade-in delay-1 grid grid-cols-2 md:grid-cols-3 gap-8">
                {collectionItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.link}
                    className="group block"
                  >
                    <div className={`relative aspect-square overflow-hidden rounded-lg ${item.imageBg} border border-white/20 group-hover:border-white/60 transition-all duration-500 group-hover:scale-[1.02]`}>
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition duration-500"></div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <span className="text-white text-lg md:text-xl font-light tracking-wide mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          ✦
                        </span>
                        <span className="text-white text-sm md:text-base font-medium tracking-wide uppercase">
                          {item.title}
                        </span>
                        <span className="text-white/60 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          View Collection →
                        </span>
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-white/0 via-white/5 to-white/0 pointer-events-none"></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="px-6 md:px-12 mt-32">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-end">
                <div className="max-w-lg text-right space-y-4 text-gray-300">
                  <p className="fade-in delay-1 text-sm md:text-base leading-relaxed">
                    {collectionData?.journeyText || "This is my journey in fashion. I built this brand from the ground up through years of dedication, learning, and hands-on work. Over the past 6–8 years, I've spent countless late nights refining my craft, growing through challenges, and creating pieces with intention."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section ref={statsRef} className="px-6 md:px-12 mt-28">
            <div className="max-w-7xl mx-auto">
              <div className="fade-in delay-1 flex gap-24 justify-start">
                <div className="fade-in" style={{ animationDelay: '100ms' }}>
                  <h2 className="text-5xl font-bold tabular-nums">
                    {clientCount}+
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">Happy Clients</p>
                </div>
                <div className="fade-in" style={{ animationDelay: '200ms' }}>
                  <h2 className="text-5xl font-bold tabular-nums">
                    {yearCount}
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">Years Experience</p>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 md:px-12 mt-32">
            <div className="max-w-7xl mx-auto">
              <div className="border-t border-white/20 pt-16">
                <h2 className="fade-in delay-1 text-2xl md:text-3xl font-light tracking-wide mb-12 text-center md:text-left">
                  What we do
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
                  <div className="space-y-3">
                    {firstColumnServices.map((service, idx) => (
                      <p key={idx} className="fade-in text-sm md:text-base text-gray-300 border-b border-white/10 pb-2" style={{ animationDelay: `${100 + idx * 50}ms` }}>
                        {service}
                      </p>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {secondColumnServices.map((service, idx) => (
                      <p key={idx} className="fade-in text-sm md:text-base text-gray-300 border-b border-white/10 pb-2" style={{ animationDelay: `${250 + idx * 50}ms` }}>
                        {service}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="w-full mt-40 pb-20 relative z-10">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex justify-start mb-16">
              <Link
                href="/store"
                className="fade-in text-sm border border-white/30 px-4 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 inline-flex items-center gap-2 bg-transparent backdrop-blur-sm"
              >
                Visit Full Store
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="w-full">
            <FooterNavButtons />
          </div>

          <h1 className="text-[11.5vw] whitespace-nowrap leading-[0.75] font-bold tracking-tighter opacity-[0.06] select-none pointer-events-none px-6 md:px-12">
            <Link href="/" className="hover:opacity-80 transition block">
              <span className="inline-block">
                ANNIE'S STITCHES
              </span>
            </Link>
          </h1>
        </footer>
      </div>

      {showProfilePage && <ProfilePage />}
      {showNotificationsPage && <NotificationsPage />}
      {showSettingsPage && <SettingsPage />}

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
      `}</style>
    </>
  );
}
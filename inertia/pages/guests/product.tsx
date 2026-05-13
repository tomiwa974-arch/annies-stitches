import React, { useState, useRef, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";

// Updated interfaces for category page
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
  // State for profile dropdown - separate for main and sticky
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showStickyDropdown, setShowStickyDropdown] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  
  // State for lightbox gallery
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const mainDropdownRef = useRef<HTMLDivElement>(null);
  const stickyDropdownRef = useRef<HTMLDivElement>(null);

  // Mock notification data
  const notifications = [
    { id: 1, message: "New order received", time: "5 min ago", read: false },
    { id: 2, message: "Your item shipped", time: "1 hour ago", read: false },
    { id: 3, message: "New message from customer", time: "3 hours ago", read: true },
    { id: 4, message: "Payment received", time: "1 day ago", read: true },
  ];

  // Close dropdowns when clicking outside
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

  // State to track scroll position for sticky buttons
  const [isSticky, setIsSticky] = React.useState(false);
  const buttonsRef = React.useRef<HTMLDivElement>(null);
  const stickyTriggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  // Create images array from works
  const productImages = (() => {
    if (!works || works.length === 0) {
      return [{
        id: 1,
        height: "tall",
        title: category?.name || "Collection",
        description: category?.description || "",
        price: "",
        imageUrl: "https://via.placeholder.com/800x1000?text=No+Image"
      }];
    }
    
    return works.map((work, index) => ({
      id: work.id,
      height: "tall",
      title: work.title,
      description: work.description || "",
      price: work.price ? `$${work.price}` : "",
      imageUrl: work.imageUrl || "https://via.placeholder.com/800x1000?text=No+Image"
    }));
  })();

  // Function to get image container class based on height
  const getImageClass = (height: string) => {
    switch(height) {
      case 'tall':
        return 'aspect-[3/4]';
      case 'medium':
        return 'aspect-[4/5]';
      case 'short':
        return 'aspect-[1/1.2]';
      default:
        return 'aspect-[3/4]';
    }
  };

  // Lightbox navigation functions
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
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
            <Link href="/" className="text-purple-400 hover:text-purple-300">
              Back to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Profile Page Component - Transparent blur
  const ProfilePage = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              <h3 className="text-2xl font-medium">Annabelle</h3>
              <p className="text-white/70">annabelle@annies.com</p>
              <p className="text-white/70 text-sm">Member since 2024</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs text-white/50 block mb-2">Full Name</label>
              <p className="text-lg border-b border-white/20 pb-2">Annabelle Smith</p>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">Email</label>
              <p className="text-lg border-b border-white/20 pb-2">annabelle@annies.com</p>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">Phone</label>
              <p className="text-lg border-b border-white/20 pb-2">+1 (555) 123-4567</p>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">Location</label>
              <p className="text-lg border-b border-white/20 pb-2">New York, NY</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button className="flex-1 py-3 border border-white/30 rounded-full text-sm hover:bg-white hover:text-black transition bg-white/10 backdrop-blur-sm">
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

  // Notifications Page Component - Transparent blur
  const NotificationsPage = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
            <p className="text-sm text-white/70">You have {notifications.filter(n => !n.read).length} unread notifications</p>
            <button className="text-sm text-white/70 hover:text-white transition">
              Mark all as read
            </button>
          </div>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 rounded-xl transition cursor-pointer hover:bg-white/20 ${
                  notification.read ? 'bg-white/5' : 'bg-white/20 border-l-4 border-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 mt-2 rounded-full ${notification.read ? 'bg-white/30' : 'bg-white'}`} />
                  <div className="flex-1">
                    <p className="text-base text-white">{notification.message}</p>
                    <p className="text-xs text-white/50 mt-2">{notification.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Page Component - Transparent blur
  const SettingsPage = () => {
    const [darkMode, setDarkMode] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              <h3 className="text-lg font-medium mb-4">Account</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 bg-white/10 rounded-xl hover:bg-white/20 transition">
                  <span className="block font-medium">Change Password</span>
                  <span className="text-sm text-white/70">Update your password regularly</span>
                </button>
                <button className="w-full text-left p-4 bg-white/10 rounded-xl hover:bg-white/20 transition">
                  <span className="block font-medium">Email Address</span>
                  <span className="text-sm text-white/70">annabelle@annies.com</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                  <div>
                    <span className="block font-medium">Dark Mode</span>
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
                    <span className="block font-medium">Email Notifications</span>
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

  // Dropdown Menu Component - Transparent blur
  const DropdownMenu = ({ onClose }: { onClose: () => void }) => (
    <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="p-4 border-b border-white/20">
        <p className="text-sm font-medium text-white">Annabelle</p>
        <p className="text-xs text-white/70">annabelle@annies.com</p>
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
        
        <Link
          href="/login"
          className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
          onClick={onClose}
        >
          <span className="text-lg">🚪</span>
          Sign Out
        </Link>
      </div>
    </div>
  );

  // Top navigation buttons component with blur inside
  const TopNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto">
      <Link href="/userdashboard" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Collection
      </Link>
      <Link href="/store" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Store
      </Link>
      <Link href="/login" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Login/Signup
      </Link>
    </nav>
  );

  // Footer navigation buttons component
  const FooterNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto px-6 md:px-12">
      <Link href="/about" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Whatsapp
      </Link>
      <Link href="/contact" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Instagram
      </Link>
      <Link href="/returns" className="text-xs border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Tiktok
      </Link>
    </nav>
  );

  // Lightbox Component
  const Lightbox = () => {
    const currentImage = productImages[currentImageIndex];
    
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center">
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 transition-all duration-300 flex items-center justify-center text-xl md:text-2xl text-white z-20"
        >
          ✕
        </button>
        
        <button
          onClick={prevImage}
          className="absolute left-2 md:left-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 transition-all duration-300 flex items-center justify-center text-xl md:text-2xl text-white z-20"
        >
          ←
        </button>
        
        <button
          onClick={nextImage}
          className="absolute right-2 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 transition-all duration-300 flex items-center justify-center text-xl md:text-2xl text-white z-20"
        >
          →
        </button>
        
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
          <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <div className="relative bg-white/5 rounded-2xl overflow-hidden border border-white/20 max-h-full">
              <div className="flex items-center justify-center h-full">
                <img 
                  src={currentImage.imageUrl}
                  alt={currentImage.title}
                  className="max-w-full max-h-[70vh] md:max-h-[75vh] object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x1000?text=Image+Not+Found';
                  }}
                />
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

      <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
        
        {/* TOP SECTION */}
        <header className="w-full pt-8">
          {/* Trigger for sticky detection */}
          <div ref={stickyTriggerRef} className="h-0" />

          {/* Buttons Row with Profile Icon */}
          <div 
            ref={buttonsRef}
            className={`w-full px-6 md:px-12 transition-all duration-300 ${
              isSticky 
                ? 'fixed top-0 left-0 right-0 z-40 bg-transparent py-3' 
                : 'relative'
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
                    className="w-10 h-10 rounded-full border border-white/30 hover:border-white transition-all duration-300 flex items-center justify-center text-lg hover:scale-110 hover:bg-white/10 bg-white/10 backdrop-blur-sm"
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

          {/* Spacer when sticky */}
          {isSticky && <div className="h-20" />}
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-grow w-full px-6 md:px-12 py-12">
          <div className="max-w-7xl mx-auto">
            
            {/* Category title */}
            <h2 className="fade-in delay-1 text-4xl md:text-6xl font-light tracking-tight mb-8">
              {category.name}
            </h2>

            {/* Category description */}
            <p className="fade-in delay-1 text-sm text-gray-300 max-w-3xl mb-12 leading-relaxed">
              {category.description}
            </p>

            {/* Image Gallery - All works in this category */}
            {isEmpty ? (
              <div className="text-center py-20">
                <p className="text-white/40 text-lg">No works found in this category yet.</p>
                <p className="text-white/30 text-sm mt-2">Check back soon for new arrivals!</p>
              </div>
            ) : (
              <div className="fade-in delay-2 columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 mb-16">
                {productImages.map((image, index) => (
                  <div 
                    key={image.id}
                    className="break-inside-avoid mb-4 cursor-pointer group"
                    onClick={() => openLightbox(index)}
                  >
                    <div 
                      className={`${getImageClass(image.height)} w-full border border-white/20 bg-gradient-to-br from-white/5 to-white/10 hover:border-white-400 hover:scale-[1.02] transition-all duration-500 rounded-lg overflow-hidden relative`}
                    >
                      <img 
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x500?text=No+Image';
                        }}
                      />
                      
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

        {/* SOCIAL MEDIA BUTTONS */}
        <div className="w-full py-12">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <FooterNavButtons />
          </div>
        </div>

        {/* HUGE TITLE */}
        <h1 className="fade-in delay-3 ml-2 text-[11.4vw] whitespace-nowrap leading-none font-bold tracking-tight opacity-10 text-left px-0">
          <Link href="/" className="hover:opacity-80 transition block">
            <span className="inline-block">
              ANNIE'S STITCHES
            </span>
          </Link>
        </h1>

        {/* COPYRIGHT */}
        <div className="mt-8 text-xs text-gray-600 text-left px-6 md:px-12 max-w-7xl mx-auto pb-20">
          © 2026 ANNIE'S STITCHES — ALL RIGHTS RESERVED
        </div>
      </div>

      {/* Lightbox Gallery */}
      {showLightbox && <Lightbox />}

      {/* Pages */}
      {showProfilePage && <ProfilePage />}
      {showNotificationsPage && <NotificationsPage />}
      {showSettingsPage && <SettingsPage />}

      {/* Fade-in animation styles */}
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
        
        .delay-4 {
          animation-delay: 0.8s;
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

        .columns-2 {
          column-count: 2;
        }
        .columns-3 {
          column-count: 3;
        }
        .columns-4 {
          column-count: 4;
        }
        
        @media (max-width: 768px) {
          .columns-2 {
            column-count: 2;
          }
        }
        
        @media (max-width: 640px) {
          .columns-2 {
            column-count: 1;
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
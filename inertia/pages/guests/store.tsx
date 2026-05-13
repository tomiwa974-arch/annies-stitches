import { useState, useRef, useEffect } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";

// Types (same as before)
interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  selectedSize: string;
  quantity: number;
}

interface ProductImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  size: string;
  stock: number;
  storeCategory?: string;
  imageUrl?: string;
  images?: ProductImage[];
}

interface Props {
  products: Product[];
  isEmpty?: boolean;
  error?: boolean;
}

export default function Store({ products = [], isEmpty = false, error = false }: Props) {
  // Get auth state from Inertia props
  const { auth } = usePage().props as any;
  const isAuthenticated = !!auth?.user;
  const user = auth?.user || null;

  const [pageLoaded, setPageLoaded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedSizeForModal, setSelectedSizeForModal] = useState<string>("");
  const [selectedQuantityForModal, setSelectedQuantityForModal] = useState<number>(1);
  
  // State for profile dropdown
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showStickyDropdown, setShowStickyDropdown] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  
  const mainDropdownRef = useRef<HTMLDivElement>(null);
  const stickyDropdownRef = useRef<HTMLDivElement>(null);
  
  const notifications = [
    { id: 1, message: "New order received", time: "5 min ago", read: false },
    { id: 2, message: "Your item shipped", time: "1 hour ago", read: false },
    { id: 3, message: "New message from customer", time: "3 hours ago", read: true },
    { id: 4, message: "Payment received", time: "1 day ago", read: true },
  ];
  
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
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isGridView, setIsGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [isSticky, setIsSticky] = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const stickyTriggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Check for pending actions after login (redirect back from login)
  useEffect(() => {
    const pendingAction = sessionStorage.getItem('pendingAction');
    if (isAuthenticated && pendingAction) {
      try {
        const action = JSON.parse(pendingAction);
        if (action.type === 'add_to_cart' && action.product && action.size) {
          // Re-trigger add to cart with saved product
          addToCart(action.product, action.size, action.quantity || 1);
        } else if (action.type === 'add_to_wishlist' && action.product) {
          toggleWishlist(action.product);
        }
        sessionStorage.removeItem('pendingAction');
        sessionStorage.removeItem('redirectAfterLogin');
      } catch (e) {
        console.error('Failed to restore pending action', e);
      }
    }
  }, [isAuthenticated]);

  // Get unique categories from products
  const categories = [
    { id: "all", name: "All Items" },
    ...Array.from(new Set(products.map(p => p.storeCategory || 'Uncategorized'))).map(cat => ({
      id: cat.toLowerCase().replace(/\s+/g, '-'),
      name: cat
    }))
  ];

  const getFilteredProducts = () => {
    let filtered = products;
    if (selectedCategory !== "all") {
      filtered = products.filter(p => {
        const productCat = (p.storeCategory || 'Uncategorized').toLowerCase().replace(/\s+/g, '-');
        return productCat === selectedCategory;
      });
    }
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

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

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = products.filter(product => 
      product.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase()) ||
      product.storeCategory?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setShowSearchResults(true);
  };

  // Helper function to parse sizes from string to array
  const getSizesArray = (sizeString: string): string[] => {
    if (!sizeString) return [];
    return sizeString.split(',').map(s => s.trim()).filter(s => s);
  };

  // AUTH-AWARE addToCart
  const addToCart = (product: Product, selectedSize: string, quantity: number = 1) => {
    if (!selectedSize) {
      setNotification({ message: `Please select a size for ${product.name}`, type: 'error' });
      return;
    }
    
    // CHECK AUTHENTICATION FIRST
    if (!isAuthenticated) {
      // Store the pending action to execute after login
      sessionStorage.setItem('pendingAction', JSON.stringify({
        type: 'add_to_cart',
        product: product,
        size: selectedSize,
        quantity: quantity
      }));
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      setNotification({ message: `Please login to add items to cart`, type: 'error' });
      
      // Redirect to login page
      router.visit('/login');
      return;
    }
    
    // User is authenticated - proceed with cart update
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && item.selectedSize === selectedSize);
      if (existingItem) {
        setNotification({ message: `${product.name} (${selectedSize}) quantity updated!`, type: 'success' });
        return prevCart.map(item =>
          item.id === product.id && item.selectedSize === selectedSize 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        setNotification({ message: `${product.name} (${selectedSize}) added to cart!`, type: 'success' });
        return [...prevCart, { 
          id: product.id, 
          name: product.name, 
          price: product.price, 
          category: product.storeCategory || '', 
          selectedSize: selectedSize,
          quantity: quantity
        }];
      }
    });
  };

  const removeFromCart = (productId: number, selectedSize: string) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === productId && item.selectedSize === selectedSize);
      if (item) {
        setNotification({ message: `${item.name} (${item.selectedSize}) removed from cart`, type: 'success' });
      }
      return prevCart.filter(item => !(item.id === productId && item.selectedSize === selectedSize));
    });
  };

  const updateQuantity = (productId: number, selectedSize: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId, selectedSize);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId && item.selectedSize === selectedSize 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // AUTH-AWARE toggleWishlist
  const toggleWishlist = (product: Product) => {
    // CHECK AUTHENTICATION FIRST
    if (!isAuthenticated) {
      // Store the pending action
      sessionStorage.setItem('pendingAction', JSON.stringify({
        type: 'add_to_wishlist',
        product: product
      }));
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      setNotification({ message: `Please login to manage wishlist`, type: 'error' });
      router.visit('/login');
      return;
    }
    
    // User is authenticated - proceed with wishlist update
    setWishlist(prevWishlist => {
      const exists = prevWishlist.some(item => item.id === product.id);
      if (exists) {
        setNotification({ message: `${product.name} removed from wishlist`, type: 'success' });
        return prevWishlist.filter(item => item.id !== product.id);
      } else {
        setNotification({ message: `${product.name} added to wishlist!`, type: 'success' });
        return [...prevWishlist, product];
      }
    });
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some(item => item.id === productId);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      sessionStorage.setItem('pendingAction', JSON.stringify({ type: 'checkout' }));
      setNotification({ message: `Please login to checkout`, type: 'error' });
      router.visit('/login');
      return;
    }
    // Proceed to checkout page
    router.visit('/checkout');
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSizeForModal(getSizesArray(product.size)[0] || "");
    setSelectedQuantityForModal(1);
    setShowProductModal(true);
  };

  // Scroll functionality for grid view
  const scrollLeft = () => {
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  // Updated navButtons - shows user info or login/signup
  const navButtons = [
    { name: "Collection", link: "/userdashboard" },
    { name: "Works", link: "/guests/eveninggowns" },
  ];

  // Profile Page Component (updated to show real user data)
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
              <h3 className="text-2xl font-medium">{user?.fullName || user?.name || 'Guest'}</h3>
              <p className="text-white/70">{user?.email || 'Not logged in'}</p>
              <p className="text-white/70 text-sm">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs text-white/50 block mb-2">Full Name</label>
              <p className="text-lg border-b border-white/20 pb-2">{user?.fullName || user?.name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">Email</label>
              <p className="text-lg border-b border-white/20 pb-2">{user?.email || 'Not set'}</p>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">Phone</label>
              <p className="text-lg border-b border-white/20 pb-2">{user?.phone || 'Not set'}</p>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">Location</label>
              <p className="text-lg border-b border-white/20 pb-2">{user?.location || 'Not set'}</p>
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

  // Rest of your components remain the same (NotificationsPage, SettingsPage, DropdownMenu, etc.)
  // ... (keeping all your existing component definitions for NotificationsPage, SettingsPage, DropdownMenu, TopNavButtons, FooterNavButtons, ProductDetailModal, LightboxModal)

  // I'll include them below to keep the code complete

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
                  <span className="text-sm text-white/70">{user?.email || 'Not set'}</span>
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

  const DropdownMenu = ({ onClose }: { onClose: () => void }) => (
    <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="p-4 border-b border-white/20">
        <p className="text-sm font-medium text-white">{user?.fullName || user?.name || 'Guest'}</p>
        <p className="text-xs text-white/70">{user?.email || 'Not logged in'}</p>
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
        
        {isAuthenticated ? (
          <Link
            href="/logout"
            method="post"
            as="button"
            className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-white/20 rounded-lg transition flex items-center gap-3"
            onClick={onClose}
          >
            <span className="text-lg">🚪</span>
            Sign Out
          </Link>
        ) : (
          <Link
            href="/login"
            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/20 rounded-lg transition flex items-center gap-3"
            onClick={onClose}
          >
            <span className="text-lg">🔑</span>
            Sign In
          </Link>
        )}
      </div>
    </div>
  );

  const TopNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto gap-3">
      {navButtons.map((button, index) => (
        <Link
          key={index}
          href={button.link}
          className="text-xs border border-stone-800 px-6 py-2 rounded-full hover:bg-stone-800 hover:text-white transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm"
        >
          {button.name}
        </Link>
      ))}
      {!isAuthenticated && (
        <Link
          href="/login"
          className="text-xs border border-stone-800 px-6 py-2 rounded-full hover:bg-stone-800 hover:text-white transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm"
        >
          Login/Signup
        </Link>
      )}
    </nav>
  );

  const FooterNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto px-6 md:px-12">
      <Link href="/about" className="text-xs border border-stone-800 px-6 py-2 rounded-full hover:bg-stone-800 hover:text-white transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Whatsapp
      </Link>
      <Link href="/contact" className="text-xs border border-stone-800 px-6 py-2 rounded-full hover:bg-stone-800 hover:text-white transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Instagram
      </Link>
      <Link href="/returns" className="text-xs border border-stone-800 px-6 py-2 rounded-full hover:bg-stone-800 hover:text-white transition duration-300 whitespace-nowrap bg-white/10 backdrop-blur-sm">
        Tiktok
      </Link>
    </nav>
  );

  const ProductDetailModal = () => {
    if (!selectedProduct) return null;

    const allImages = selectedProduct.images?.length ? selectedProduct.images : 
      (selectedProduct.imageUrl ? [{ id: 0, imageUrl: selectedProduct.imageUrl, sortOrder: 0 }] : []);
    const availableSizes = getSizesArray(selectedProduct.size);

    const handleAddToCartFromModal = () => {
      if (!selectedSizeForModal) {
        setNotification({ message: `Please select a size`, type: 'error' });
        return;
      }
      addToCart(selectedProduct, selectedSizeForModal, selectedQuantityForModal);
      setShowProductModal(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-stone-200 flex justify-between items-center">
            <h2 className="text-xl font-medium">{selectedProduct.name}</h2>
            <button onClick={() => setShowProductModal(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 transition flex items-center justify-center">
              ✕
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {allImages.map((img, idx) => (
                <div 
                  key={img.id}
                  className="aspect-square bg-stone-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition hover:scale-105 transform duration-300"
                  onClick={() => {
                    setLightboxIndex(idx);
                    setShowLightbox(true);
                  }}
                >
                  <img src={img.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-stone-500">Category</h3>
                <p className="text-stone-900">{selectedProduct.storeCategory || 'Uncategorized'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-stone-500">Description</h3>
                <p className="text-stone-700">{selectedProduct.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-stone-500">Price</h3>
                <p className="text-2xl font-bold text-stone-900">${selectedProduct.price}</p>
              </div>
              
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-stone-500 mb-2">Select Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSizeForModal(size)}
                        className={`px-4 py-2 border rounded-full text-sm transition ${
                          selectedSizeForModal === size
                            ? 'bg-stone-800 text-white border-stone-800'
                            : 'border-stone-300 text-stone-700 hover:border-stone-800 hover:bg-stone-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-stone-500 mb-2">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedQuantityForModal(Math.max(1, selectedQuantityForModal - 1))}
                    className="w-8 h-8 rounded-full border border-stone-300 hover:bg-stone-800 hover:text-white transition"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center">{selectedQuantityForModal}</span>
                  <button
                    onClick={() => setSelectedQuantityForModal(selectedQuantityForModal + 1)}
                    className="w-8 h-8 rounded-full border border-stone-300 hover:bg-stone-800 hover:text-white transition"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-stone-500">Stock Status</h3>
                <p className={`text-sm ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}
                </p>
              </div>
              
              <button
                onClick={handleAddToCartFromModal}
                disabled={selectedProduct.stock === 0 || !selectedSizeForModal}
                className="w-full py-3 bg-stone-800 text-white rounded-full hover:bg-stone-900 transition disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LightboxModal = () => {
    const currentProduct = selectedProduct;
    if (!currentProduct) return null;
    
    const allImages = currentProduct.images?.length ? currentProduct.images : 
      (currentProduct.imageUrl ? [{ id: 0, imageUrl: currentProduct.imageUrl, sortOrder: 0 }] : []);

    const nextImage = () => {
      setLightboxIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = () => {
      setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!showLightbox) return;
        if (e.key === 'Escape') setShowLightbox(false);
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLightbox, lightboxIndex]);

    if (!showLightbox || !allImages.length) return null;

    const currentImage = allImages[lightboxIndex];

    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center">
        <button onClick={() => setShowLightbox(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition">✕</button>
        <button onClick={prevImage} className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition">←</button>
        <button onClick={nextImage} className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition">→</button>
        
        <div className="max-w-5xl max-h-[85vh] flex items-center justify-center">
          <img src={currentImage.imageUrl} alt={currentProduct.name} className="max-w-full max-h-[85vh] object-contain" />
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
          {lightboxIndex + 1} / {allImages.length}
        </div>
      </div>
    );
  };

  const filteredProducts = getFilteredProducts();

  if (isEmpty) {
    return (
      <>
        <Head title="Store | Annie's Stitches" />
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">🛍️</p>
            <p className="text-stone-500 text-lg">No products available yet</p>
            <p className="text-stone-400 text-sm mt-2">Check back soon for new arrivals</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title="Store | Annie's Stitches" />

      <div 
        className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-1000 ${
          pageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div className={`min-h-screen bg-stone-50 text-stone-900 font-['Inter'] transition-colors duration-1000 ${
        pageLoaded ? 'bg-stone-50' : 'bg-black'
      }`}>
        
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-24 right-4 z-50 animate-slideIn">
            <div className={`px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-stone-800 text-white' : 'bg-red-600 text-white'}`}>
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Cart Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-500 ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-stone-200 flex justify-between items-center">
              <h2 className="text-xl font-medium">Your Cart ({cart.length})</h2>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-full hover:bg-stone-100 transition text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center text-stone-400 mt-20">
                  <p className="text-4xl mb-4">🛒</p>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4">
                      <div className="w-20 h-20 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400">○</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-stone-500 text-xs">Size: {item.selectedSize}</p>
                        <p className="text-stone-500 text-xs mt-1">${item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity - 1)} className="w-6 h-6 border border-stone-300 rounded-full hover:bg-stone-800 hover:text-white">-</button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + 1)} className="w-6 h-6 border border-stone-300 rounded-full hover:bg-stone-800 hover:text-white">+</button>
                          <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="ml-auto text-xs text-stone-400 hover:text-red-600">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-stone-200">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total</span>
                  <span className="font-medium">${getCartTotal().toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full py-3 bg-stone-800 text-white rounded-full hover:bg-stone-900"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-500 ${showWishlist ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-stone-200 flex justify-between items-center">
              <h2 className="text-xl font-medium">Your Wishlist ({wishlist.length})</h2>
              <button onClick={() => setShowWishlist(false)} className="w-10 h-10 rounded-full hover:bg-stone-100 transition text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {wishlist.length === 0 ? (
                <div className="text-center text-stone-400 mt-20">
                  <p className="text-4xl mb-4">🤍</p>
                  <p>Your wishlist is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {wishlist.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 overflow-hidden">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : '○'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-stone-500 text-xs mt-1">${item.price}</p>
                        <p className="text-stone-400 text-xs">{item.storeCategory}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => openProductModal(item)} className="text-xs px-3 py-1 border border-stone-300 rounded-full hover:bg-stone-800 hover:text-white">View</button>
                          <button onClick={() => toggleWishlist(item)} className="text-xs text-stone-400 hover:text-red-600">Remove</button>
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
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => { setShowCart(false); setShowWishlist(false); }} />
        )}

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-48 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 border border-stone-200">
            <div className="p-4">
              <h3 className="text-sm font-medium text-stone-500 mb-3">Search Results ({searchResults.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg cursor-pointer" onClick={() => openProductModal(product)}>
                    <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden">
                      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : '○'}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{product.name}</h4>
                      <p className="text-xs text-stone-500">${product.price} • {product.storeCategory || 'Uncategorized'}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="text-xs px-3 py-1 border border-stone-300 rounded-full hover:bg-stone-800 hover:text-white">View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top navigation */}
        <div className="w-full pt-8 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div ref={stickyTriggerRef} className="h-0" />
            <div ref={buttonsRef} className={`w-full transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 right-0 z-40 bg-transparent py-3' : 'relative'}`}>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="flex-1"><TopNavButtons /></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowWishlist(true)} className="relative p-2 hover:bg-stone-100 rounded-full group border border-stone-800 bg-white/10 backdrop-blur-sm">
                      <span className="text-lg group-hover:scale-110 transition-transform">🤍</span>
                      {wishlist.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-stone-800 text-white text-xs rounded-full flex items-center justify-center">{wishlist.length}</span>}
                    </button>
                    <button onClick={() => setShowCart(true)} className="relative p-2 hover:bg-stone-100 rounded-full group border border-stone-800 bg-white/10 backdrop-blur-sm">
                      <span className="text-lg group-hover:scale-110 transition-transform">🛒</span>
                      {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-stone-800 text-white text-xs rounded-full flex items-center justify-center">{cart.length}</span>}
                    </button>
                    <div className="relative" ref={isSticky ? stickyDropdownRef : mainDropdownRef}>
                      <button onClick={() => { if (isSticky) setShowStickyDropdown(!showStickyDropdown); else setShowMainDropdown(!showMainDropdown); }} className="w-9 h-9 rounded-full border border-stone-800 hover:border-stone-900 transition-all duration-300 flex items-center justify-center text-lg hover:scale-110 hover:bg-stone-100 bg-white/10 backdrop-blur-sm">👤</button>
                      {isSticky ? showStickyDropdown && <DropdownMenu onClose={() => setShowStickyDropdown(false)} /> : showMainDropdown && <DropdownMenu onClose={() => setShowMainDropdown(false)} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isSticky && <div className="h-20" />}
          </div>
        </div>

        {/* Hero section */}
        <div className="w-full px-6 md:px-12 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end">
              <div className="animate-slideUp">
                <p className="text-sm text-stone-500 mb-2 tracking-wide font-medium">— READY-TO-WEAR —</p>
                <h1 className="text-5xl md:text-7xl font-light tracking-tight text-stone-800">Annie Stitches</h1>
                <p className="text-stone-600 mt-4 max-w-md text-lg">{categories.slice(1, 4).map(c => c.name).join(' • ')}</p>
              </div>
              <div className="w-full md:w-80 mt-8 md:mt-0 animate-slideUp delay-200 relative" ref={searchInputRef}>
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search products..." className="w-full bg-white border-2 border-stone-200 rounded-full px-6 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-600 transition shadow-sm" />
                <span className="absolute right-4 top-3 text-stone-500 text-lg">⌕</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="w-full px-6 md:px-12 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Category filters */}
            <div className="mb-12">
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-6 py-3 text-sm rounded-full transition duration-300 font-medium ${selectedCategory === category.id ? 'bg-stone-800 text-white shadow-md scale-105' : 'border border-stone-800 text-stone-700 hover:bg-stone-800 hover:text-white bg-white/10'}`}>
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
                  className="w-10 h-10 rounded-full border border-stone-800 hover:bg-stone-800 hover:text-white transition flex items-center justify-center text-xl bg-white/10"
                >
                  ←
                </button>
                <button 
                  onClick={scrollRight}
                  className="w-10 h-10 rounded-full border border-stone-800 hover:bg-stone-800 hover:text-white transition flex items-center justify-center text-xl bg-white/10"
                >
                  →
                </button>
              </div>
              <button
                onClick={() => setIsGridView(!isGridView)}
                className="text-sm text-stone-700 hover:text-stone-900 transition flex items-center gap-2 border border-stone-800 px-4 py-2 rounded-full hover:bg-stone-800 hover:text-white bg-white/10"
              >
                <span className="text-lg transform transition-transform">{isGridView ? '⊞' : '⊟'}</span>
                <span>{isGridView ? 'grid view' : 'scroll view'}</span>
              </button>
            </div>

            {/* Products Display */}
            {isGridView ? (
              <div ref={gridContainerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map((product) => {
                  const availableSizes = getSizesArray(product.size);
                  return (
                    <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border-2 border-stone-100 hover:border-stone-300 hover:scale-[1.02] cursor-pointer" onClick={() => openProductModal(product)}>
                      <div className="aspect-[4/5] bg-stone-100 relative overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 text-4xl">○</div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                          <span className={`text-xl ${isInWishlist(product.id) ? 'text-red-500' : 'text-stone-400'}`}>{isInWishlist(product.id) ? '❤️' : '🤍'}</span>
                        </button>
                      </div>
                      <div className="p-6">
                        <div className="text-xs font-medium text-stone-500 mb-2 tracking-wide uppercase">{product.storeCategory || 'Uncategorized'}</div>
                        <h3 className="text-base font-semibold text-stone-800 mb-2">{product.name}</h3>
                        <p className="text-xs text-stone-500 mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-baseline justify-between border-t border-stone-100 pt-4">
                          <span className="text-2xl font-medium text-stone-900">${product.price}</span>
                          <span className="text-xs font-medium text-stone-500">USD</span>
                        </div>
                        {availableSizes.length > 0 && (
                          <div className="mt-2 text-xs text-stone-400">Sizes: {availableSizes.join(', ')}</div>
                        )}
                        <div className="mt-1 text-xs">
                          {product.stock > 0 ? (
                            <span className="text-green-600">✓ In stock ({product.stock})</span>
                          ) : (
                            <span className="text-red-600">✗ Out of stock</span>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="mt-4 w-full py-3 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-900 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105">
                          Select Options
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relative">
                <div 
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto gap-6 pb-4 scroll-smooth"
                  style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
                >
                  {filteredProducts.map((product) => {
                    const availableSizes = getSizesArray(product.size);
                    return (
                      <div key={product.id} className="flex-none w-80 group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border-2 border-stone-100 hover:border-stone-300 hover:scale-[1.02] cursor-pointer" onClick={() => openProductModal(product)}>
                        <div className="aspect-[4/5] bg-stone-100 relative overflow-hidden">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 text-4xl">○</div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                            <span className={`text-xl ${isInWishlist(product.id) ? 'text-red-500' : 'text-stone-400'}`}>{isInWishlist(product.id) ? '❤️' : '🤍'}</span>
                          </button>
                        </div>
                        <div className="p-6">
                          <div className="text-xs font-medium text-stone-500 mb-2 tracking-wide uppercase">{product.storeCategory || 'Uncategorized'}</div>
                          <h3 className="text-base font-semibold text-stone-800 mb-2">{product.name}</h3>
                          <p className="text-xs text-stone-500 mb-3 line-clamp-2">{product.description}</p>
                          <div className="flex items-baseline justify-between border-t border-stone-100 pt-4">
                            <span className="text-2xl font-medium text-stone-900">${product.price}</span>
                            <span className="text-xs font-medium text-stone-500">USD</span>
                          </div>
                          {availableSizes.length > 0 && (
                            <div className="mt-2 text-xs text-stone-400">Sizes: {availableSizes.join(', ')}</div>
                          )}
                          <div className="mt-1 text-xs">
                            {product.stock > 0 ? (
                              <span className="text-green-600">✓ In stock ({product.stock})</span>
                            ) : (
                              <span className="text-red-600">✗ Out of stock</span>
                            )}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="mt-4 w-full py-3 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-900 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105">
                            Select Options
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🛍️</p>
                <p className="text-stone-500 text-lg">No products found</p>
              </div>
            )}

            <div className="mt-32 text-center">
              <p className="text-sm font-medium text-stone-500 tracking-[0.3em]">— 2026 COLLECTION —</p>
              <p className="text-stone-500 text-base mt-4">each piece thoughtfully made</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full px-6 md:px-12 py-12 border-t border-stone-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-sm font-medium text-stone-600">© ANNIE'S STITCHES</div>
              <FooterNavButtons />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProfilePage && <ProfilePage />}
      {showNotificationsPage && <NotificationsPage />}
      {showSettingsPage && <SettingsPage />}
      {showProductModal && <ProductDetailModal />}
      {showLightbox && <LightboxModal />}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
        .animate-slideDown { animation: slideDown 0.3s ease-out forwards; }
        .animate-slideUp { opacity: 0; animation: slideUp 0.5s ease-out forwards; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .delay-200 { animation-delay: 200ms; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .scroll-smooth { scroll-behavior: smooth; }
      `}</style>
    </>
  );
}
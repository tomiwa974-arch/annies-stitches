import { useState, useRef, useEffect } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  selectedSize: string;
  quantity: number;
  color?: string;
  tailorMeasurements?: Record<string, string> | null;
  isCustomTailored?: boolean;
}

interface ProductImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

interface ColorVariation {
  name: string;
  hex: string;
  imageUrl?: string | null;
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
  colorVariations?: ColorVariation[] | string;
  tailorMeasurements?: string[] | string;
  allowCustomTailoring?: boolean;
}

interface OrderSummary {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  trackingStage: 'received' | 'packaged' | 'shipped' | 'delivered';
  createdAt: string;
  items: Array<{
    id: number;
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    isCustomTailored?: boolean;
    tailorMeasurements?: Record<string, string>;
  }>;
}

interface Props {
  products: Product[];
  isEmpty?: boolean;
  error?: boolean;
}

export default function Store({ products: initialProducts = [], isEmpty = false }: Props) {
  // ── Auth state from Inertia shared props ──────────────────────────────────
  const { auth } = usePage().props as any;
  const isAuthenticated = !!auth?.user;
  const user = auth?.user ?? null;
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [pageLoaded, setPageLoaded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedSizeForModal, setSelectedSizeForModal] = useState<string>("");
  const [selectedQuantityForModal, setSelectedQuantityForModal] = useState<number>(1);
  const [selectedColorForModal, setSelectedColorForModal] = useState<ColorVariation | null>(null);
  const [useCustomTailoring, setUseCustomTailoring] = useState(false);
  const [tailorMeasurements, setTailorMeasurements] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [showTracking, setShowTracking] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<OrderSummary | null>(null);

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
      if (mainDropdownRef.current && !mainDropdownRef.current.contains(event.target as Node))
        setShowMainDropdown(false);
      if (stickyDropdownRef.current && !stickyDropdownRef.current.contains(event.target as Node))
        setShowStickyDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isGridView, setIsGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [isSticky, setIsSticky] = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const stickyTriggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Save current page URL for redirect after login ──────────────────────
  const saveRedirectUrl = () => {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
  };

  const getXsrfToken = () => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
    return token ? decodeURIComponent(token) : '';
  };

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getXsrfToken() } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  };

  const loadUserLists = async () => {
    if (!isAuthenticated) return;
    const [cartData, wishlistData] = await Promise.all([
      apiRequest('/api/cart'),
      apiRequest('/api/wishlist'),
    ]);

    setCart(Array.isArray(cartData.cart) ? cartData.cart : []);
    setWishlist(Array.isArray(wishlistData.wishlist) ? wishlistData.wishlist : []);
  };

  const refreshProducts = async () => {
    try {
      const response = await fetch('/api/products', { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) setProducts(data);
    } catch {
      // Keep the current product list if refresh fails.
    }
  };

  const refreshOrders = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiRequest('/api/orders');
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setNotification({ message: 'Could not refresh order tracking', type: 'error' });
    }
  };

  // ── Dynamic Works button handler - goes to first available category ─────────
  const goToWorks = async () => {
    try {
      const response = await fetch('/api/categories');
      const categories = await response.json();
      if (categories && categories.length > 0) {
        window.location.href = `/guests/${categories[0].slug}`;
      } else {
        console.warn('No categories found');
        window.location.href = '/store';
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      window.location.href = '/store';
    }
  };

  // ── Restore pending cart/wishlist action after login ──────────────────────
  useEffect(() => {
    const pendingAction = sessionStorage.getItem('pendingAction');
    if (isAuthenticated && pendingAction) {
      try {
        const action = JSON.parse(pendingAction);
        if (action.type === 'add_to_cart' && action.product && action.size) {
          addToCart(action.product, action.size, action.quantity || 1, action.color || '', action.measurements || null, !!action.isCustomTailored);
        } else if (action.type === 'add_to_wishlist' && action.product) {
          toggleWishlist(action.product);
        }
      } catch (e) { /* ignore */ }
      sessionStorage.removeItem('pendingAction');
      sessionStorage.removeItem('redirectAfterLogin');
    }
  }, [isAuthenticated]);

  // Get unique categories from products
  const allCategories = Array.from(new Set(products.map((p) => p.storeCategory || 'Uncategorized')));

  const categories = [
    { id: "all", name: "All Items" },
    ...allCategories.map((cat) => ({
      id: cat.toLowerCase().replace(/\s+/g, '-'),
      name: cat,
    })),
  ];

  // Group products by category
  const getProductsByCategory = () => {
    if (selectedCategory !== "all") {
      const filtered = products.filter((p) => {
        const productCat = (p.storeCategory || 'Uncategorized').toLowerCase().replace(/\s+/g, '-');
        return productCat === selectedCategory;
      });
      return [{ categoryName: allCategories.find(c => c.toLowerCase().replace(/\s+/g, '-') === selectedCategory) || selectedCategory, products: filtered }];
    }
    
    const grouped: { [key: string]: Product[] } = {};
    products.forEach(product => {
      const cat = product.storeCategory || 'Uncategorized';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(product);
    });
    
    const sortedCategories = Object.keys(grouped).sort();
    
    return sortedCategories.map(cat => ({
      categoryName: cat,
      products: grouped[cat]
    }));
  };

  const getFilteredProducts = () => {
    if (selectedCategory === "all") {
      return products;
    }
    return products.filter((p) => {
      const productCat = (p.storeCategory || 'Uncategorized').toLowerCase().replace(/\s+/g, '-');
      return productCat === selectedCategory;
    });
  };

  const filteredProductsForSearch = getFilteredProducts();

  const parseArrayField = <T,>(value: T[] | string | undefined, fallback: T[] = []): T[] => {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const getProductColors = (product: Product): ColorVariation[] => {
    const parsed = parseArrayField<ColorVariation>(product.colorVariations, []);
    if (parsed.length > 0) return parsed;
    return product.imageUrl ? [{ name: 'Signature', hex: '#111111', imageUrl: product.imageUrl }] : [];
  };

  const getTailorFields = (product: Product): string[] => {
    const parsed = parseArrayField<string>(product.tailorMeasurements, []);
    return parsed.length > 0 ? parsed : ['chest', 'waist', 'hips', 'length'];
  };

  useEffect(() => { setPageLoaded(true); }, []);
  useEffect(() => { setProducts(initialProducts); }, [initialProducts]);
  useEffect(() => {
    refreshProducts();
    const interval = window.setInterval(refreshProducts, 15000);
    const handleFocus = () => refreshProducts();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  useEffect(() => {
    if (!isAuthenticated) {
      setCart([]);
      setWishlist([]);
      setShowCart(false);
      setShowWishlist(false);
      return;
    }

    loadUserLists().catch(() => {
      setNotification({ message: 'Could not load your cart and wishlist', type: 'error' });
    });
    refreshOrders();
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (!productId) return;
    const product = products.find((p) => String(p.id) === productId);
    if (product) openProductModal(product);
  }, [products]);

  useEffect(() => {
    const handleScroll = () => {
      if (stickyTriggerRef.current) {
        const shouldBeSticky = stickyTriggerRef.current.getBoundingClientRect().top <= 0;
        if (shouldBeSticky !== isSticky) setIsSticky(shouldBeSticky);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node))
        setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); setShowSearchResults(false); return; }
    const results = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase()) ||
        p.storeCategory?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setShowSearchResults(true);
  };

  const getSizesArray = (sizeString: string): string[] => {
    if (!sizeString) return [];
    return sizeString.split(',').map((s) => s.trim()).filter(Boolean);
  };

  // ── Profile button: guest → /login, logged-in → dropdown ─────────────────
  const handleProfileClick = () => {
    if (!isAuthenticated) {
      saveRedirectUrl();
      router.visit('/login');
      return;
    }
    if (isSticky) setShowStickyDropdown((v) => !v);
    else setShowMainDropdown((v) => !v);
  };

  // ── Cart (requires auth) ──────────────────────────────────────────────────
  const handleCartClick = () => {
    if (!isAuthenticated) {
      saveRedirectUrl();
      router.visit('/login');
      return;
    }
    setShowCart(true);
  };

  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      saveRedirectUrl();
      router.visit('/login');
      return;
    }
    setShowWishlist(true);
  };

  const addToCart = async (
    product: Product,
    selectedSize: string,
    quantity: number = 1,
    color: string = '',
    measurements: Record<string, string> | null = null,
    isCustomTailored: boolean = false
  ) => {
    if (!selectedSize) {
      setNotification({ message: `Please select a size for ${product.name}`, type: 'error' });
      return;
    }
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingAction', JSON.stringify({ type: 'add_to_cart', product, size: selectedSize, quantity, color, measurements, isCustomTailored }));
      saveRedirectUrl();
      setNotification({ message: 'Please login to add items to cart', type: 'error' });
      router.visit('/login');
      return;
    }
    try {
      const data = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, size: selectedSize, quantity, color, tailorMeasurements: measurements, isCustomTailored }),
      });
      setCart(Array.isArray(data.cart) ? data.cart : []);
      setNotification({ message: `${product.name} (${selectedSize}) added to cart!`, type: 'success' });
    } catch {
      setNotification({ message: 'Could not add item to cart', type: 'error' });
    }
  };

  const removeFromCart = async (productId: number, selectedSize: string) => {
    const item = cart.find((i) => i.id === productId && i.selectedSize === selectedSize);
    try {
      const data = await apiRequest(`/api/cart/${productId}`, {
        method: 'DELETE',
        body: JSON.stringify({ size: selectedSize }),
      });
      setCart(Array.isArray(data.cart) ? data.cart : []);
      if (item) setNotification({ message: `${item.name} (${item.selectedSize}) removed from cart`, type: 'success' });
    } catch {
      setNotification({ message: 'Could not remove item from cart', type: 'error' });
    }
  };

  const updateQuantity = async (productId: number, selectedSize: string, newQuantity: number) => {
    if (newQuantity < 1) { removeFromCart(productId, selectedSize); return; }
    try {
      const data = await apiRequest(`/api/cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ size: selectedSize, quantity: newQuantity }),
      });
      setCart(Array.isArray(data.cart) ? data.cart : []);
    } catch {
      setNotification({ message: 'Could not update cart quantity', type: 'error' });
    }
  };

  const getCartTotal = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);

  // ── Wishlist (requires auth) ──────────────────────────────────────────────
  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingAction', JSON.stringify({ type: 'add_to_wishlist', product }));
      saveRedirectUrl();
      setNotification({ message: 'Please login to manage wishlist', type: 'error' });
      router.visit('/login');
      return;
    }
    const exists = wishlist.some((i) => i.id === product.id);
    try {
      const data = await apiRequest('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id }),
      });
      setWishlist(Array.isArray(data.wishlist) ? data.wishlist : []);
      setNotification({
        message: exists ? `${product.name} removed from wishlist` : `${product.name} added to wishlist!`,
        type: 'success',
      });
    } catch {
      setNotification({ message: 'Could not update wishlist', type: 'error' });
    }
  };

  const isInWishlist = (productId: number) => wishlist.some((i) => i.id === productId);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      saveRedirectUrl();
      sessionStorage.setItem('pendingAction', JSON.stringify({ type: 'checkout' }));
      setNotification({ message: 'Please login to checkout', type: 'error' });
      router.visit('/login');
      return;
    }
    try {
      const data = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart,
          customerName: user?.fullName || user?.name || 'Customer',
          customerEmail: user?.email || '',
        }),
      });
      setCart([]);
      if (data.order) {
        setPurchaseSuccess(data.order);
        setOrders((prev) => [data.order, ...prev]);
      }
    } catch {
      setNotification({ message: 'Could not complete checkout', type: 'error' });
    }
  };

  const openProductModal = (product: Product) => {
    const colors = getProductColors(product);
    setSelectedProduct(product);
    setSelectedSizeForModal(getSizesArray(product.size)[0] || "");
    setSelectedColorForModal(colors[0] || null);
    setSelectedQuantityForModal(1);
    setUseCustomTailoring(false);
    setTailorMeasurements({});
    setShowProductModal(true);
  };

  const scrollLeft = () => gridContainerRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const scrollRight = () => gridContainerRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

  // ── Nav - UPDATED with dynamic Works button ─────────────────────────────────
  const navButtons = [
    { name: "Collection", link: "/userdashboard" },
    { name: "Works", onClick: goToWorks },
  ];

  // ── Sub-components ────────────────────────────────────────────────────────

  const ProfilePage = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white border border-black/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-black/10 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-3xl font-light text-black">My Profile</h2>
          <button onClick={() => setShowProfilePage(false)} className="w-10 h-10 rounded-full hover:bg-black hover:text-white transition flex items-center justify-center text-xl text-black">✕</button>
        </div>
        <div className="p-8 text-black">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center text-4xl border-2 border-black/10">👤</div>
            <div>
              <h3 className="text-2xl font-medium">{user?.fullName || user?.name || 'User'}</h3>
              <p className="text-black/70">{user?.email || ''}</p>
              <p className="text-black/70 text-sm">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div><label className="text-xs text-black/50 block mb-2">Full Name</label><p className="text-lg border-b border-black/10 pb-2">{user?.fullName || user?.name || 'Not set'}</p></div>
            <div><label className="text-xs text-black/50 block mb-2">Email</label><p className="text-lg border-b border-black/10 pb-2">{user?.email || 'Not set'}</p></div>
          </div>
          <div className="mt-8 flex gap-4">
            <button className="flex-1 py-3 border border-black rounded-full text-sm hover:bg-black hover:text-white transition bg-white text-black">Edit Profile</button>
            <button className="flex-1 py-3 bg-black text-white rounded-full text-sm hover:bg-white hover:text-black border border-black transition">Share Profile</button>
          </div>
        </div>
      </div>
    </div>
  );

  const NotificationsPage = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white border border-black/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-black/10 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-3xl font-light text-black">Notifications</h2>
          <button onClick={() => setShowNotificationsPage(false)} className="w-10 h-10 rounded-full hover:bg-black hover:text-white transition flex items-center justify-center text-xl text-black">✕</button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-black/70">You have {notifications.filter((n) => !n.read).length} unread notifications</p>
            <button className="text-sm text-black/70 hover:text-black transition">Mark all as read</button>
          </div>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className={`p-5 rounded-xl cursor-pointer hover:bg-zinc-100 ${n.read ? 'bg-white border border-black/10' : 'bg-zinc-100 border-l-4 border-black'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 mt-2 rounded-full ${n.read ? 'bg-black/30' : 'bg-black'}`} />
                  <div className="flex-1">
                    <p className="text-base text-black">{n.message}</p>
                    <p className="text-xs text-black/50 mt-2">{n.time}</p>
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
        <div className="bg-white border border-black/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 border-b border-black/10 flex justify-between items-center sticky top-0 bg-white">
            <h2 className="text-3xl font-light text-black">Settings</h2>
            <button onClick={() => setShowSettingsPage(false)} className="w-10 h-10 rounded-full hover:bg-black hover:text-white transition flex items-center justify-center text-xl text-black">✕</button>
          </div>
          <div className="p-8 space-y-8 text-black">
            <div>
              <h3 className="text-lg font-medium mb-4">Account</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 bg-white rounded-xl border border-black/10 hover:bg-zinc-100 transition"><span className="block font-medium">Change Password</span><span className="text-sm text-black/70">Update your password regularly</span></button>
                <button className="w-full text-left p-4 bg-white rounded-xl border border-black/10 hover:bg-zinc-100 transition"><span className="block font-medium">Email Address</span><span className="text-sm text-black/70">{user?.email || 'Not set'}</span></button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-black/10">
                  <div><span className="block font-medium">Dark Mode</span><span className="text-sm text-black/70">Toggle dark theme</span></div>
                  <button onClick={() => setDarkMode(!darkMode)} className={`w-14 h-7 rounded-full transition-colors duration-300 ${darkMode ? 'bg-white' : 'bg-white/30'} relative`}>
                    <div className={`w-5 h-5 rounded-full bg-black absolute top-1 transition-transform duration-300 ${darkMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-black/10">
                  <div><span className="block font-medium">Email Notifications</span><span className="text-sm text-black/70">Receive updates via email</span></div>
                  <button onClick={() => setEmailNotif(!emailNotif)} className={`w-14 h-7 rounded-full transition-colors duration-300 ${emailNotif ? 'bg-white' : 'bg-white/30'} relative`}>
                    <div className={`w-5 h-5 rounded-full bg-black absolute top-1 transition-transform duration-300 ${emailNotif ? 'right-1' : 'left-1'}`} />
                  </button>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Dropdown only rendered for authenticated users
  const DropdownMenu = ({ onClose }: { onClose: () => void }) => (
    <div className="absolute right-0 mt-2 w-56 bg-white border border-black/15 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="p-4 border-b border-black/10">
        <p className="text-sm font-medium text-black">{user?.fullName || user?.name || 'User'}</p>
        <p className="text-xs text-black/60">{user?.email || ''}</p>
      </div>
      <div className="p-2">
        <button onClick={() => { setShowProfilePage(true); onClose(); }} className="w-full text-left px-4 py-3 text-sm text-black hover:bg-black hover:text-white rounded-lg transition flex items-center gap-3">
          <span className="text-lg">👤</span> My Profile
        </button>
        <button onClick={() => { setShowNotificationsPage(true); onClose(); }} className="w-full text-left px-4 py-3 text-sm text-black hover:bg-black hover:text-white rounded-lg transition flex items-center gap-3 relative">
          <span className="text-lg">🔔</span> Notifications
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{notifications.filter((n) => !n.read).length}</span>
        </button>
        <button onClick={() => { setShowSettingsPage(true); onClose(); }} className="w-full text-left px-4 py-3 text-sm text-black hover:bg-black hover:text-white rounded-lg transition flex items-center gap-3">
          <span className="text-lg">⚙️</span> Settings
        </button>
        <div className="border-t border-black/10 my-2" />
        <Link
          href="/logout"
          method="post"
          as="button"
          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-3"
          onClick={onClose}
        >
          <span className="text-lg">🚪</span> Sign Out
        </Link>
      </div>
    </div>
  );

  // UPDATED TopNavButtons to handle both Link and button with onClick
  const TopNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto gap-3">
      {navButtons.map((button, index) => (
        button.onClick ? (
          <button
            key={index}
            onClick={button.onClick}
            className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black"
          >
            {button.name}
          </button>
        ) : (
          <Link
            key={index}
            href={button.link}
            className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black"
          >
            {button.name}
          </Link>
        )
      ))}
      {isAuthenticated ? (
        <Link
          href="/logout"
          method="post"
          as="button"
          className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black"
        >
          Logout
        </Link>
      ) : (
        <Link
          href="/login"
          className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black"
        >
          Login/Signup
        </Link>
      )}
    </nav>
  );

  const FooterNavButtons = () => (
    <nav className="flex justify-between w-full max-w-7xl mx-auto px-6 md:px-12">
      <Link href="/about" className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black">Whatsapp</Link>
      <Link href="/contact" className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black">Instagram</Link>
      <Link href="/returns" className="text-xs border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition duration-300 whitespace-nowrap bg-white text-black">Tiktok</Link>
    </nav>
  );

  // Product Detail Modal
  const ProductDetailModal = () => {
    if (!selectedProduct) return null;
    const productColors = getProductColors(selectedProduct);
    const selectedPreviewImage = selectedColorForModal?.imageUrl || selectedProduct.imageUrl;
    const allImages = selectedPreviewImage
      ? [{ id: -1, imageUrl: selectedPreviewImage, sortOrder: -1 }, ...(selectedProduct.images || [])]
      : selectedProduct.images?.length
      ? selectedProduct.images
      : [];
    const availableSizes = getSizesArray(selectedProduct.size);
    const measurementFields = getTailorFields(selectedProduct);

    const handleAddToCartFromModal = () => {
      if (!useCustomTailoring && !selectedSizeForModal) { setNotification({ message: 'Please select a size', type: 'error' }); return; }
      const missingMeasurement = useCustomTailoring && measurementFields.some((field) => !tailorMeasurements[field]);
      if (missingMeasurement) { setNotification({ message: 'Please complete your custom measurements', type: 'error' }); return; }
      addToCart(
        selectedProduct,
        useCustomTailoring ? 'Custom Tailored' : selectedSizeForModal,
        selectedQuantityForModal,
        selectedColorForModal?.name || '',
        useCustomTailoring ? tailorMeasurements : null,
        useCustomTailoring
      );
      setShowProductModal(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div className="bg-[#f8f7f4] border border-white/20 max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-[0_30px_90px_rgba(0,0,0,.45)]">
          <div className="sticky top-0 z-10 bg-[#f8f7f4]/95 p-5 border-b border-black/10 flex justify-between items-center backdrop-blur-xl">
            <h2 className="text-2xl font-light text-black">{selectedProduct.name}</h2>
            <button onClick={() => setShowProductModal(false)} className="w-8 h-8 rounded-full hover:bg-black hover:text-white transition flex items-center justify-center text-black">✕</button>
          </div>
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="grid grid-cols-2 gap-3 content-start">
              {allImages.map((img, idx) => (
                <div key={img.id} className={`${idx === 0 ? 'col-span-2 aspect-[5/6]' : 'aspect-square'} bg-zinc-100 overflow-hidden cursor-pointer border border-black/10 hover:opacity-90 transition duration-500`}
                  onClick={() => { setLightboxIndex(idx); setShowLightbox(true); }}>
                  <img src={img.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="border-b border-black/10 pb-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-black/45">{selectedProduct.storeCategory || 'Uncategorized'}</p>
                <p className="mt-4 text-sm leading-7 text-black/68">{selectedProduct.description}</p>
                <p className="mt-5 text-3xl font-light text-black">${selectedProduct.price}</p>
              </div>
              {productColors.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.24em] text-black/50 mb-3">Color</h3>
                  <div className="flex flex-wrap gap-2">
                    {productColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColorForModal(color)}
                        className={`flex items-center gap-2 border px-3 py-2 text-xs transition ${
                          selectedColorForModal?.name === color.name ? 'border-black bg-black text-white' : 'border-black/20 bg-white/60 text-black hover:border-black'
                        }`}
                      >
                        <span className="h-5 w-5 rounded-full border border-black/20" style={{ backgroundColor: color.hex || '#111111' }} />
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.24em] text-black/50 mb-3">Select Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button key={size} onClick={() => setSelectedSizeForModal(size)}
                        className={`px-4 py-2 border text-xs transition ${
                          selectedSizeForModal === size 
                            ? 'bg-black text-white border-black' 
                            : 'border-black/25 bg-white/60 text-black hover:bg-black hover:text-white'
                        }`}>
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
                      <span className="block text-sm font-medium text-black">Custom tailor sizing</span>
                      <span className="block text-xs text-black/55">Enter measurements for a made-to-fit finish.</span>
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
                        <label key={field} className="text-xs uppercase tracking-wide text-black/50">
                          {field}
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={tailorMeasurements[field] || ''}
                            onChange={(e) => setTailorMeasurements((prev) => ({ ...prev, [field]: e.target.value }))}
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
                  <button onClick={() => setSelectedQuantityForModal(Math.max(1, selectedQuantityForModal - 1))} className="w-8 h-8 rounded-full border border-black/30 hover:bg-black hover:text-white transition text-black">-</button>
                  <span className="text-lg font-medium w-12 text-center text-black">{selectedQuantityForModal}</span>
                  <button onClick={() => setSelectedQuantityForModal(selectedQuantityForModal + 1)} className="w-8 h-8 rounded-full border border-black/30 hover:bg-black hover:text-white transition text-black">+</button>
                </div>
              </div>
              <div><h3 className="text-sm font-medium text-black/60">Stock Status</h3><p className={`text-sm ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}</p></div>
              <button onClick={handleAddToCartFromModal} disabled={selectedProduct.stock === 0 || (!selectedSizeForModal && !useCustomTailoring)}
                className="w-full py-3.5 bg-black text-white hover:bg-white hover:text-black border border-black transition disabled:opacity-50 disabled:cursor-not-allowed text-[10px] uppercase tracking-[0.28em] font-medium">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LightboxModal = () => {
    if (!selectedProduct || !showLightbox) return null;
    const allImages = selectedProduct.images?.length
      ? selectedProduct.images
      : selectedProduct.imageUrl ? [{ id: 0, imageUrl: selectedProduct.imageUrl, sortOrder: 0 }] : [];
    if (!allImages.length) return null;

    const nextImage = () => setLightboxIndex((p) => (p + 1) % allImages.length);
    const prevImage = () => setLightboxIndex((p) => (p - 1 + allImages.length) % allImages.length);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowLightbox(false);
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex]);

    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center">
        <button onClick={() => setShowLightbox(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition">✕</button>
        <button onClick={prevImage} className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition">←</button>
        <button onClick={nextImage} className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition">→</button>
        <div className="max-w-5xl max-h-[85vh] flex items-center justify-center">
          <img src={allImages[lightboxIndex].imageUrl} alt={selectedProduct.name} className="max-w-full max-h-[85vh] object-contain" />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">{lightboxIndex + 1} / {allImages.length}</div>
      </div>
    );
  };

  const trackingStages = [
    { id: 'received', label: 'Order received' },
    { id: 'packaged', label: 'Being packaged' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ];

  const TrackingPanel = () => (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-[#f8f7f4] border-t border-black/10 shadow-2xl transition-transform duration-500 ${showTracking ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">Order tracking</p>
            <h2 className="mt-1 text-2xl font-light text-black">Your Atelier Progress</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshOrders} className="rounded-full border border-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-black hover:text-white transition">
              Refresh
            </button>
            <button onClick={() => setShowTracking(false)} className="h-9 w-9 rounded-full border border-black/20 hover:bg-black hover:text-white">x</button>
          </div>
        </div>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-black/50">No orders yet. Your next piece will appear here after checkout.</p>
        ) : (
          <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-2">
            {orders.map((order) => {
              const activeIndex = trackingStages.findIndex((stage) => stage.id === order.trackingStage);
              return (
                <div key={order.id} className="border border-black/10 bg-white/70 p-5">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-black">{order.orderNumber}</p>
                      <p className="text-xs text-black/50">${order.totalAmount} • {order.createdAt}</p>
                    </div>
                    <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-wide text-white">{order.trackingStage}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {trackingStages.map((stage, index) => {
                      const isDone = index <= activeIndex;
                      return (
                        <div key={stage.id} className="relative">
                          <div className={`h-1 rounded-full ${isDone ? 'bg-black' : 'bg-black/10'}`} />
                          <div className={`mt-3 flex h-8 w-8 items-center justify-center rounded-full border text-xs ${isDone ? 'border-black bg-black text-white' : 'border-black/15 text-black/35'}`}>
                            {index + 1}
                          </div>
                          <p className={`mt-2 text-xs ${isDone ? 'text-black' : 'text-black/40'}`}>{stage.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const PurchaseSuccessModal = () => purchaseSuccess && (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md border border-white/20 bg-[#f8f7f4] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border border-black animate-successPulse">
          <span className="text-3xl">✓</span>
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-black/45">Annie's Stitches</p>
        <h2 className="mt-3 text-3xl font-light text-black">Thank you for your purchase</h2>
        <p className="mt-3 text-sm text-black/60">Your order {purchaseSuccess.orderNumber} has been received and is now entering the atelier.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => { setPurchaseSuccess(null); setShowTracking(true); }} className="flex-1 bg-black px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white hover:bg-white hover:text-black border border-black transition">Track order</button>
          <button onClick={() => setPurchaseSuccess(null)} className="flex-1 border border-black px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-black hover:bg-black hover:text-white transition">Continue</button>
        </div>
      </div>
    </div>
  );

  const productGroups = getProductsByCategory();
  const filteredProducts = filteredProductsForSearch;

  if (isEmpty) {
    return (
      <>
        <Head title="Store | Annie's Stitches" />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">🛍️</p>
            <p className="text-black/70 text-lg">No products available yet</p>
            <p className="text-black/50 text-sm mt-2">Check back soon for new arrivals</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title="Store | Annie's Stitches" />

      <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-1000 ${pageLoaded ? 'opacity-0' : 'opacity-100'}`} />

      <div className="min-h-screen bg-[#f8f7f4] text-black font-['Inter'] transition-colors duration-1000 relative overflow-hidden">
        
        {/* Top hero background */}
        <div 
          className="absolute inset-x-0 top-0 h-[620px] bg-cover bg-center bg-no-repeat transition-all duration-700 z-0"
          style={{
            backgroundImage: `url('/images/store.png')`,
          }}
        />
        
        {/* Dark overlay for better readability */}
        <div className="absolute inset-x-0 top-0 h-[620px] bg-[linear-gradient(180deg,rgba(248,247,244,.78),rgba(248,247,244,.96)_66%,#f8f7f4_100%)] z-[1]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[620px] opacity-[0.26] [background-image:linear-gradient(rgba(0,0,0,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.12)_1px,transparent_1px)] [background-size:84px_84px]" />

        {/* Toast notification */}
        {notification && (
          <div className="fixed top-24 right-4 z-50 animate-slideIn">
            <div className={`px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-white text-black border border-black/15' : 'bg-red-600 text-white'}`}>
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Cart sidebar */}
        <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white border-l border-black/15 shadow-2xl z-50 transform transition-transform duration-500 ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-black/10 flex justify-between items-center">
              <h2 className="text-xl font-medium text-black">Your Cart ({cart.length})</h2>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-full hover:bg-black hover:text-white transition text-2xl text-black">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center text-black/50 mt-20"><p className="text-4xl mb-4">🛒</p><p>Your cart is empty</p></div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-sm">
                      <div className="w-20 h-20 bg-zinc-100 rounded-lg flex items-center justify-center text-black/40">○</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-black">{item.name}</h3>
                        <p className="text-black/60 text-xs">Size: {item.selectedSize}</p>
                        {item.color && <p className="text-black/60 text-xs">Color: {item.color}</p>}
                        {item.isCustomTailored && <p className="text-xs text-black mt-1">Custom tailored</p>}
                        <p className="text-black/60 text-xs mt-1">${item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity - 1)} className="w-6 h-6 border border-black/30 rounded-full hover:bg-black hover:text-white transition text-black">-</button>
                          <span className="text-sm w-8 text-center text-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + 1)} className="w-6 h-6 border border-black/30 rounded-full hover:bg-black hover:text-white transition text-black">+</button>
                          <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="ml-auto text-xs text-red-400 hover:text-red-300">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-black/10">
                <div className="flex justify-between mb-4"><span className="font-medium text-black">Total</span><span className="font-medium text-black">${getCartTotal().toFixed(2)}</span></div>
                <button onClick={handleCheckout} className="w-full py-3 bg-black text-white rounded-full hover:bg-white hover:text-black border border-black transition font-medium">Checkout</button>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist sidebar */}
        <div className={`fixed top-0 left-0 h-full w-full md:w-96 bg-white border-r border-black/15 shadow-2xl z-50 transform transition-transform duration-500 ${showWishlist ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-black/10 flex justify-between items-center">
              <h2 className="text-xl font-medium text-black">Your Wishlist ({wishlist.length})</h2>
              <button onClick={() => setShowWishlist(false)} className="w-10 h-10 rounded-full hover:bg-black hover:text-white transition text-2xl text-black">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {wishlist.length === 0 ? (
                <div className="text-center text-black/50 mt-20"><p className="text-4xl mb-4">🤍</p><p>Your wishlist is empty</p></div>
              ) : (
                <div className="space-y-4">
                  {wishlist.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-sm">
                      <div className="w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black/40">○</div>}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-black">{item.name}</h3>
                        <p className="text-black/60 text-xs mt-1">${item.price}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => openProductModal(item)} className="text-xs px-3 py-1 border border-black/30 rounded-full hover:bg-black hover:text-white transition text-black">View</button>
                          <button onClick={() => toggleWishlist(item)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
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
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => { setShowCart(false); setShowWishlist(false); }} />
        )}

        {/* Search results dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-48 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 border border-black/15">
            <div className="p-4">
              <h3 className="text-sm font-medium text-black/70 mb-3">Search Results ({searchResults.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-lg cursor-pointer" onClick={() => openProductModal(product)}>
                    <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden">
                      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black/40">○</div>}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-black">{product.name}</h4>
                      <p className="text-xs text-black/60">${product.price} • {product.storeCategory || 'Uncategorized'}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="text-xs px-3 py-1 border border-black/30 rounded-full hover:bg-black hover:text-white transition text-black">View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Top navigation ────────────────────────────────────────────── */}
        <div className="w-full pt-8 px-6 md:px-12 relative z-20">
          <div className="max-w-7xl mx-auto">
            <div ref={stickyTriggerRef} className="h-0" />
            <div ref={buttonsRef} className={`w-full transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 right-0 z-40 bg-[#f8f7f4]/90 py-3 backdrop-blur-xl border-b border-black/10' : 'relative'}`}>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="flex-1"><TopNavButtons /></div>
                  <div className="flex items-center gap-2">
                    {/* Wishlist button - BOUNCING ANIMATION */}
                    <button onClick={() => setShowTracking(true)} className="relative border border-black/25 bg-white px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-black transition-all duration-300 hover:bg-black hover:text-white">
                      Track
                    </button>
                    <button onClick={handleWishlistClick} className="relative border border-black/25 bg-white p-2.5 text-black transition-all duration-300 hover:bg-black hover:text-white">
                      <span className="text-lg group-hover:scale-110 transition-transform">🤍</span>
                      {wishlist.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">{wishlist.length}</span>}
                    </button>
                    {/* Cart button - BOUNCING ANIMATION */}
                    <button onClick={handleCartClick} className="relative border border-black/25 bg-white p-2.5 text-black transition-all duration-300 hover:bg-black hover:text-white">
                      <span className="text-lg group-hover:scale-110 transition-transform">🛒</span>
                      {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">{cart.length}</span>}
                    </button>
                    {/* Profile button - TRANSPARENT */}
                    <div className="relative" ref={isSticky ? stickyDropdownRef : mainDropdownRef}>
                      <button
                        onClick={handleProfileClick}
                        className="w-10 h-10 border border-black/25 hover:bg-black hover:text-white transition-all duration-300 flex items-center justify-center text-lg bg-white text-black"
                      >
                        👤
                      </button>
                      {isAuthenticated && (
                        <>
                          {isSticky
                            ? showStickyDropdown && <DropdownMenu onClose={() => setShowStickyDropdown(false)} />
                            : showMainDropdown && <DropdownMenu onClose={() => setShowMainDropdown(false)} />}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isSticky && <div className="h-20" />}
          </div>
        </div>

        {/* Hero section - Updated text colors for dark overlay */}
        <div className="w-full px-6 md:px-12 pt-20 pb-16 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end border-y border-black/15 py-12">
              <div className="animate-slideUp">
                <p className="text-sm text-black/60 mb-2 tracking-wide font-medium">— READY-TO-WEAR —</p>
                <h1 className="text-6xl md:text-8xl font-light tracking-tight text-black">Annie Stitches</h1>
                <p className="text-black/60 mt-4 max-w-md text-lg">{categories.slice(1, 4).map((c) => c.name).join(' • ')}</p>
              </div>
              <div className="w-full md:w-80 mt-8 md:mt-0 animate-slideUp delay-200 relative" ref={searchInputRef}>
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search products..."
                  className="w-full bg-white/80 border border-black/25 px-6 py-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black transition shadow-sm backdrop-blur" />
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
                  <button key={category.id} onClick={() => setSelectedCategory(category.id)}
                    className={`px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition duration-300 font-medium ${
                      selectedCategory === category.id 
                        ? 'bg-black text-white shadow-md' 
                        : 'border border-black/25 text-black hover:bg-black hover:text-white bg-white/75'
                    }`}>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* View toggle */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-2">
                <button onClick={scrollLeft} className="w-10 h-10 rounded-full border border-black hover:bg-black hover:text-white transition flex items-center justify-center text-xl bg-white text-black">←</button>
                <button onClick={scrollRight} className="w-10 h-10 rounded-full border border-black hover:bg-black hover:text-white transition flex items-center justify-center text-xl bg-white text-black">→</button>
              </div>
              <button onClick={() => setIsGridView(!isGridView)}
                className="text-[10px] uppercase tracking-[0.2em] text-black transition flex items-center gap-2 border border-black/25 px-4 py-2 hover:bg-black hover:text-white bg-white">
                <span className="text-lg">{isGridView ? '⊞' : '⊟'}</span>
                <span>{isGridView ? 'grid view' : 'scroll view'}</span>
              </button>
            </div>

            {/* Search results count */}
            {searchQuery && (
              <div className="mb-8 text-center">
                <p className="text-black/70">Found {filteredProducts.length} results for "{searchQuery}"</p>
              </div>
            )}

            {/* Grouped Products by Category */}
            {productGroups.map((group, groupIndex) => (
              group.products.length > 0 && (
                <div key={groupIndex} className="mb-16">
                  <div className="mb-6 flex items-end justify-between gap-4 pb-3 border-b border-black/15">
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight text-black">
                      {group.categoryName}
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-black/45">{group.products.length} items</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {group.products.map((product) => {
                      const availableSizes = getSizesArray(product.size);
                      return (
                        <div key={product.id} className="group bg-white/90 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-black/10 hover:border-black/45 hover:-translate-y-1 cursor-pointer" onClick={() => openProductModal(product)}>
                          <div className="aspect-[4/5] bg-zinc-100 relative overflow-hidden border-b border-black/10">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-black/30 text-4xl">○</div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }} className="absolute top-3 right-3 w-9 h-9 bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition-transform border border-black/15 backdrop-blur">
                              <span className={`text-lg ${isInWishlist(product.id) ? 'text-red-500' : 'text-black'}`}>{isInWishlist(product.id) ? '❤️' : '🤍'}</span>
                            </button>
                          </div>
                          <div className="p-5">
                            <div className="text-[10px] font-medium text-black/45 mb-2 tracking-[0.24em] uppercase">{product.storeCategory || 'Uncategorized'}</div>
                            <h3 className="text-base font-semibold text-black mb-2 line-clamp-1">{product.name}</h3>
                            <p className="text-xs text-black/60 mb-3 line-clamp-2">{product.description}</p>
                            <div className="flex items-baseline justify-between items-center border-t border-black/10 pt-3">
                              <span className="text-xl font-medium text-black">${product.price}</span>
                              <span className="text-xs font-medium text-black/50">USD</span>
                            </div>
                            {availableSizes.length > 0 && (
                              <div className="mt-2 text-xs text-black/50">Sizes: {availableSizes.join(', ')}</div>
                            )}
                            <div className="mt-1 text-xs">
                              {product.stock > 0 ? (
                                <span className="text-green-400">✓ In stock ({product.stock})</span>
                              ) : (
                                <span className="text-red-400">✗ Out of stock</span>
                              )}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="mt-4 w-full py-2.5 bg-black border border-black text-white text-[10px] uppercase tracking-[0.22em] font-medium hover:bg-white hover:text-black transition-all duration-300 shadow-md">
                              Select Options
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}

            {/* No products found */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4 text-black/70">🛍️</p>
                <p className="text-black/70 text-lg">No products found</p>
                <button 
                  onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                  className="mt-4 px-6 py-2 bg-black text-white rounded-full text-sm hover:bg-white hover:text-black border border-black transition"
                >
                  Clear Filters
                </button>
              </div>
            )}

            <div className="mt-32 text-center">
              <p className="text-sm font-medium text-black/50 tracking-[0.3em]">— 2026 COLLECTION —</p>
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
      {isAuthenticated && showProfilePage && <ProfilePage />}
      {isAuthenticated && showNotificationsPage && <NotificationsPage />}
      {isAuthenticated && showSettingsPage && <SettingsPage />}
      {showProductModal && <ProductDetailModal />}
      {showLightbox && <LightboxModal />}
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
  );
}

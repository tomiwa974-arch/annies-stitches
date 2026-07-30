import React, { useState, useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { 
  Menu, X, LayoutDashboard, Images, Briefcase, ShoppingBag, 
  Package, Activity, ChevronLeft, ChevronRight,
  LogOut, User, Plus, Edit2, Trash2, Heart, DollarSign, Eye
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  description: string;
  works_count: number;
  coverImage?: string;
}

interface Work {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  imageUrl: string | null;
  category?: Category;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  size: string;
  stock: number;
  storeCategory?: string | null;
  imageUrl?: string;
  wishlist_count?: number;
  colorVariations?: any[] | string;
  tailorMeasurements?: string[] | string;
  allowCustomTailoring?: boolean;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  tracking_stage?: string;
  created_at: string;
  items?: OrderItem[];
  user?: any;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  isCustomTailored?: boolean;
  tailorMeasurements?: Record<string, string>;
  product?: Product;
}

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  activeTab: string;
  categories?: Category[];
  works?: Work[];
  products?: Product[];
  orders?: Order[];
  activities?: any[];
  collection?: any;
  stats?: any;
  recentActivity?: any[];
  pageContent?: any;
  storeCategories?: StoreCategory[];
}

export default function AdminIndex({ 
  activeTab: initialTab, 
  categories = [], 
  works = [], 
  products = [], 
  orders = [], 
  activities = [],
  collection,
  stats = {},
  recentActivity = [],
  pageContent = {},
  storeCategories: initialStoreCategories = []
}: Props) {
  const { errors } = usePage().props as any;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || "dashboard");
  
  // Filter states
  const [selectedWorkCategory, setSelectedWorkCategory] = useState<string>("all");
  const [selectedStoreCategory, setSelectedStoreCategory] = useState<string>("all");
  
  // Modal visibility states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showStoreCategoryModal, setShowStoreCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Store categories state - initialize with props
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>(initialStoreCategories);

  // Function to fetch fresh store categories from API
  const fetchFreshStoreCategories = async () => {
    try {
      const response = await fetch('/admin/store-categories');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setStoreCategories(data);
          console.log('✅ Store categories refreshed:', data.length, data.map(c => c.name));
        }
      }
    } catch (error) {
      console.error('Error fetching store categories:', error);
    }
  };

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Refresh store categories when store tab is opened
  useEffect(() => {
    if (activeTab === 'store') {
      fetchFreshStoreCategories();
    }
  }, [activeTab]);

  // Refresh store categories when modal closes
  useEffect(() => {
    if (!showStoreCategoryModal && activeTab === 'store') {
      fetchFreshStoreCategories();
    }
  }, [showStoreCategoryModal, activeTab]);

  const navItems = [
    { name: "Dashboard", id: "dashboard", icon: LayoutDashboard },
    { name: "Collections", id: "collections", icon: Images },
    { name: "Works", id: "works", icon: Briefcase },
    { name: "Store", id: "store", icon: ShoppingBag },
    { name: "Orders", id: "orders", icon: Package },
    { name: "Activity", id: "activity", icon: Activity },
    { name: "Users", id: "users", icon: User },
  ];

  // Filter works based on selected category
  const getFilteredWorks = () => {
    if (selectedWorkCategory === "all") {
      return works;
    }
    const categoryIdNum = parseInt(selectedWorkCategory);
    return works.filter(work => work.categoryId === categoryIdNum);
  };

  // Filter products based on selected store category
  const getFilteredProducts = () => {
    if (selectedStoreCategory === "all") {
      return products;
    }
    if (selectedStoreCategory === "uncategorized") {
      return products.filter(product => !product.storeCategory);
    }
    return products.filter(product => product.storeCategory === selectedStoreCategory);
  };

  const filteredWorks = getFilteredWorks();
  const filteredProducts = getFilteredProducts();

  // Category CRUD
  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure? This will delete all works in this category.")) {
      router.delete(`/admin/categories/${id}`, {
        preserveScroll: true,
        onSuccess: () => router.reload()
      });
    }
  };

  // Work CRUD
  const handleDeleteWork = (id: number) => {
    if (confirm("Are you sure?")) {
      router.delete(`/admin/works/${id}`, {
        preserveScroll: true,
        onSuccess: () => router.reload()
      });
    }
  };

  // Product CRUD
  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure?")) {
      router.delete(`/admin/products/${id}`, {
        preserveScroll: true,
        onSuccess: () => router.reload()
      });
    }
  };

  // Store Category CRUD
  const handleDeleteStoreCategory = (id: number, categoryName: string) => {
    if (confirm(`Delete "${categoryName}"? Products with this category will become uncategorized.`)) {
      setStoreCategories(prev => prev.filter(c => c.id !== id));
      
      router.delete(`/admin/store-categories/${id}`, {
        preserveScroll: true,
        onSuccess: () => {
          fetchFreshStoreCategories();
          router.reload();
        },
        onError: () => {
          fetchFreshStoreCategories();
          router.reload();
        }
      });
    }
  };

  // Order status update
  const handleUpdateOrderStatus = (id: number, status: string, trackingStage?: string) => {
    router.put(`/admin/orders/${id}/status`, { status, trackingStage }, { 
      preserveScroll: true,
      onSuccess: () => router.reload()
    });
  };

  const handleViewOrder = async (order: Order) => {
    try {
      const response = await fetch(`/admin/orders/${order.id}`);
      const data = await response.json();
      setSelectedOrder(data);
      setShowOrderModal(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  // ============ CATEGORY MODAL - SCROLLABLE ============
  const CategoryModal = () => {
    const [localName, setLocalName] = useState(editingItem?.name || "");
    const [localDescription, setLocalDescription] = useState(editingItem?.description || "");
    const [localCoverImage, setLocalCoverImage] = useState<File | null>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(editingItem?.coverImage || null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setLocalCoverImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLocalPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (editingItem) {
        const formData = new FormData();
        formData.append("name", localName);
        formData.append("description", localDescription);
        if (localCoverImage) {
          formData.append("cover_image", localCoverImage);
        }
        
        router.post(`/admin/categories/${editingItem.id}?_method=PUT`, formData, {
          preserveScroll: true,
          onSuccess: () => {
            setShowCategoryModal(false);
            setEditingItem(null);
            router.reload();
          }
        });
      } else {
        const formData = new FormData();
        formData.append("name", localName);
        formData.append("description", localDescription);
        if (localCoverImage) {
          formData.append("cover_image", localCoverImage);
        }
        
        router.post("/admin/categories", formData, {
          preserveScroll: true,
          onSuccess: () => {
            setShowCategoryModal(false);
            setEditingItem(null);
            router.reload();
          }
        });
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-lg w-full my-8 mx-auto overflow-hidden">
          <div className="sticky top-0 bg-white/10 backdrop-blur-md p-6 border-b border-white/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-light text-white">{editingItem ? "Edit Category" : "New Collection Category"}</h2>
              <button onClick={() => setShowCategoryModal(false)} className="w-8 h-8 rounded-full hover:bg-white/20 transition flex items-center justify-center">
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-white/60 text-sm mb-2">Category Name</label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Description</label>
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Cover Image</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                />
                {localPreview && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <img src={localPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/5 backdrop-blur-sm -mx-6 px-6 py-4 mt-4">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 transition">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition">
                {editingItem ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ WORK MODAL - SCROLLABLE ============
  const WorkModal = () => {
    const [localCategoryId, setLocalCategoryId] = useState(editingItem?.categoryId?.toString() || "");
    const [localTitle, setLocalTitle] = useState(editingItem?.title || "");
    const [localDescription, setLocalDescription] = useState(editingItem?.description || "");
    const [localImage, setLocalImage] = useState<File | null>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(editingItem?.imageUrl || null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setLocalImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLocalPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append("categoryId", localCategoryId);
      formData.append("title", localTitle);
      formData.append("description", localDescription);
      if (localImage) {
        formData.append("imageUrl", localImage);
      }
      
      if (editingItem) {
        router.post(`/admin/works/${editingItem.id}?_method=PUT`, formData, {
          preserveScroll: true,
          onSuccess: () => {
            setShowWorkModal(false);
            setEditingItem(null);
            router.reload();
          }
        });
      } else {
        router.post("/admin/works", formData, {
          preserveScroll: true,
          onSuccess: () => {
            setShowWorkModal(false);
            setEditingItem(null);
            router.reload();
          }
        });
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-lg w-full my-8 mx-auto overflow-hidden">
          <div className="sticky top-0 bg-white/10 backdrop-blur-md p-6 border-b border-white/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-light text-white">{editingItem ? "Edit Work" : "Add New Work"}</h2>
              <button onClick={() => setShowWorkModal(false)} className="w-8 h-8 rounded-full hover:bg-white/20 transition flex items-center justify-center">
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-white/60 text-sm mb-2">Category</label>
              <select
                value={localCategoryId}
                onChange={(e) => setLocalCategoryId(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Title</label>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Description</label>
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Image</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                />
                {localPreview && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <img src={localPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/5 backdrop-blur-sm -mx-6 px-6 py-4 mt-4">
              <button type="button" onClick={() => setShowWorkModal(false)} className="px-4 py-2 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 transition">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition">
                {editingItem ? "Update" : "Upload"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ PRODUCT MODAL - SCROLLABLE ============
  const ProductModal = () => {
    const formatJsonInput = (value: any, fallback: string) => {
      if (!value) return fallback;
      if (typeof value === 'string') return value;
      return JSON.stringify(value, null, 2);
    };

    const [localName, setLocalName] = useState(editingItem?.name || "");
    const [localDescription, setLocalDescription] = useState(editingItem?.description || "");
    const [localPrice, setLocalPrice] = useState(editingItem?.price?.toString() || "");
    const [localSize, setLocalSize] = useState(editingItem?.size || "");
    const [localStock, setLocalStock] = useState(editingItem?.stock?.toString() || "");
    const [localStoreCategory, setLocalStoreCategory] = useState(editingItem?.storeCategory || "");
    const [localImage, setLocalImage] = useState<File | null>(null);
    const [localColorVariations, setLocalColorVariations] = useState(
      formatJsonInput(
        editingItem?.colorVariations,
        '[\n  { "name": "Black", "hex": "#111111", "imageUrl": "" },\n  { "name": "Ivory", "hex": "#f4efe6", "imageUrl": "" }\n]'
      )
    );
    const [localTailorMeasurements, setLocalTailorMeasurements] = useState(
      formatJsonInput(editingItem?.tailorMeasurements, '["chest","waist","hips","length"]')
    );
    const [localAllowCustomTailoring, setLocalAllowCustomTailoring] = useState(editingItem?.allowCustomTailoring !== false);
    const [formError, setFormError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");

      try {
        JSON.parse(localColorVariations || "[]");
        JSON.parse(localTailorMeasurements || "[]");
      } catch {
        setFormError("Color variations and tailor measurement fields must be valid JSON.");
        return;
      }

      const formData = new FormData();
      formData.append("name", localName);
      formData.append("description", localDescription);
      formData.append("price", localPrice);
      formData.append("size", localSize);
      formData.append("stock", localStock);
      formData.append("store_category", localStoreCategory);
      formData.append("color_variations", localColorVariations);
      formData.append("tailor_measurements", localTailorMeasurements);
      formData.append("allow_custom_tailoring", String(localAllowCustomTailoring));
      if (localImage) {
        formData.append("imageUrl", localImage);
      }
      
      if (editingItem) {
        router.post(`/admin/products/${editingItem.id}?_method=PUT`, formData, {
          preserveScroll: true,
          onSuccess: () => {
            setShowProductModal(false);
            setEditingItem(null);
            setActiveTab('store');
            router.visit('/admin/store', { preserveScroll: false, replace: true });
          },
          onError: (errors) => {
            setFormError((errors.form as string) || "Product could not be updated. Please try again.");
          }
        });
      } else {
        router.post("/admin/products", formData, {
          preserveScroll: true,
          onSuccess: () => {
            setShowProductModal(false);
            setEditingItem(null);
            setActiveTab('store');
            router.visit('/admin/store', { preserveScroll: false, replace: true });
          },
          onError: (errors) => {
            setFormError((errors.form as string) || "Product could not be added. Please try again.");
          }
        });
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-lg w-full my-8 mx-auto overflow-hidden">
          <div className="sticky top-0 bg-white/10 backdrop-blur-md p-6 border-b border-white/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-light text-white">{editingItem ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowProductModal(false)} className="w-8 h-8 rounded-full hover:bg-white/20 transition flex items-center justify-center">
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {formError && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-white/60 text-sm mb-2">Store Category</label>
              <select
                value={localStoreCategory}
                onChange={(e) => setLocalStoreCategory(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Uncategorized</option>
                {storeCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Product Name</label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Description</label>
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localPrice}
                  onChange={(e) => setLocalPrice(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Stock</label>
                <input
                  type="number"
                  value={localStock}
                  onChange={(e) => setLocalStock(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Sizes (comma separated)</label>
              <input
                type="text"
                value={localSize}
                onChange={(e) => setLocalSize(e.target.value)}
                placeholder="XS,S,M,L,XL"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLocalImage(e.target.files?.[0] || null)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-purple-500 file:text-white hover:file:bg-purple-600"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Color Variations JSON</label>
              <textarea
                value={localColorVariations}
                onChange={(e) => setLocalColorVariations(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
                rows={5}
              />
              <p className="mt-1 text-xs text-white/40">Each color supports name, hex, and imageUrl for preview.</p>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Tailor Measurement Fields JSON</label>
              <input
                type="text"
                value={localTailorMeasurements}
                onChange={(e) => setLocalTailorMeasurements(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white">
              Enable custom tailor sizing
              <input
                type="checkbox"
                checked={localAllowCustomTailoring}
                onChange={(e) => setLocalAllowCustomTailoring(e.target.checked)}
                className="h-5 w-5 accent-purple-500"
              />
            </label>
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/5 backdrop-blur-sm -mx-6 px-6 py-4 mt-4">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 transition">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition">
                {editingItem ? "Update" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ STORE CATEGORY MODAL - SCROLLABLE ============
  const StoreCategoryModal = () => {
    const [localName, setLocalName] = useState(editingItem?.name || "");
    const [localSlug, setLocalSlug] = useState(editingItem?.slug || "");
    const [formError, setFormError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");
      const data = {
        name: localName,
        slug: localSlug || localName.toLowerCase().replace(/\s+/g, '-')
      };
      
      if (editingItem) {
        router.put(`/admin/store-categories/${editingItem.id}`, data, {
          preserveScroll: true,
          onSuccess: () => {
            setShowStoreCategoryModal(false);
            setEditingItem(null);
            fetchFreshStoreCategories();
            router.reload();
          },
          onError: (errors) => {
            setFormError((errors.form as string) || "Store category could not be updated. Please try again.");
          }
        });
      } else {
        router.post("/admin/store-categories", data, {
          preserveScroll: true,
          onSuccess: () => {
            setShowStoreCategoryModal(false);
            setEditingItem(null);
            fetchFreshStoreCategories();
            router.reload();
          },
          onError: (errors) => {
            setFormError((errors.form as string) || "Store category could not be created. Please try again.");
          }
        });
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-lg w-full my-8 mx-auto overflow-hidden">
          <div className="sticky top-0 bg-white/10 backdrop-blur-md p-6 border-b border-white/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-light text-white">{editingItem ? "Edit Store Category" : "New Store Category"}</h2>
              <button onClick={() => setShowStoreCategoryModal(false)} className="w-8 h-8 rounded-full hover:bg-white/20 transition flex items-center justify-center">
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {formError && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-white/60 text-sm mb-2">Category Name</label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Slug (optional)</label>
              <input
                type="text"
                value={localSlug}
                onChange={(e) => setLocalSlug(e.target.value)}
                placeholder="auto-generated from name"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/5 backdrop-blur-sm -mx-6 px-6 py-4 mt-4">
              <button type="button" onClick={() => setShowStoreCategoryModal(false)} className="px-4 py-2 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 transition">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition">
                {editingItem ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ CONTENT MODAL - SCROLLABLE ============
  const ContentModal = () => {
    const [localBio, setLocalBio] = useState(pageContent?.bio || collection?.bio || "");
    const [localMiddleInfo, setLocalMiddleInfo] = useState(pageContent?.middleInfo || collection?.journeyText || "");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      router.put("/admin/collection", {
        bio: localBio,
        journeyText: localMiddleInfo,
      }, {
        preserveScroll: true,
        onSuccess: () => {
          setShowContentModal(false);
          router.reload();
        }
      });
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full my-8 mx-auto overflow-hidden">
          <div className="sticky top-0 bg-white/10 backdrop-blur-md p-6 border-b border-white/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-light text-white">Edit Page Content</h2>
              <button onClick={() => setShowContentModal(false)} className="w-8 h-8 rounded-full hover:bg-white/20 transition flex items-center justify-center">
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-white/60 text-sm mb-2">Bio (Top of Homepage)</label>
              <textarea
                value={localBio}
                onChange={(e) => setLocalBio(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Middle Info (Journey Section)</label>
              <textarea
                value={localMiddleInfo}
                onChange={(e) => setLocalMiddleInfo(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/5 backdrop-blur-sm -mx-6 px-6 py-4 mt-4">
              <button type="button" onClick={() => setShowContentModal(false)} className="px-4 py-2 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 transition">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ ORDER DETAILS MODAL - SCROLLABLE ============
  const OrderDetailsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full my-8 mx-auto overflow-hidden">
        <div className="sticky top-0 bg-white/10 backdrop-blur-md p-6 border-b border-white/20">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-light text-white">Order Details</h2>
            <button onClick={() => setShowOrderModal(false)} className="w-8 h-8 rounded-full hover:bg-white/20 transition flex items-center justify-center">
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-xs mb-1">Order Number</p>
                  <p className="text-white font-medium">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedOrder.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedOrder.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                    selectedOrder.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Tracking Stage</p>
                  <select
                    value={selectedOrder.tracking_stage || 'received'}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, selectedOrder.status, e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-sm focus:outline-none"
                  >
                    <option value="received">Order received</option>
                    <option value="packaged">Being packaged</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Customer Name</p>
                  <p className="text-white">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Order Date</p>
                  <p className="text-white">{selectedOrder.created_at}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Total Amount</p>
                  <p className="text-white font-bold text-lg">${selectedOrder.total_amount}</p>
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <div>
                          <p className="text-white text-sm font-medium">{item.product_name}</p>
                          <p className="text-white/40 text-xs">Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'} | Quantity: {item.quantity}</p>
                          {item.isCustomTailored && <p className="text-purple-300 text-xs mt-1">Custom tailored measurements included</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">${item.price}</p>
                          <p className="text-white/40 text-xs">Total: ${item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-center py-4">No items found</p>
                  )}
                </div>
              </div>

              {selectedOrder.user && (
                <div>
                  <h3 className="text-white font-medium mb-3">Customer Information</h3>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-white text-sm">{selectedOrder.user.fullName}</p>
                    <p className="text-white/40 text-sm">{selectedOrder.user.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Total Products", value: stats.totalProducts || 0, icon: ShoppingBag, color: "from-purple-500 to-pink-500" },
                { title: "Total Orders", value: stats.totalOrders || 0, icon: Package, color: "from-blue-500 to-cyan-500" },
                { title: "Works Published", value: stats.totalWorks || 0, icon: Briefcase, color: "from-emerald-500 to-teal-500" },
                { title: "Revenue", value: `$${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "from-green-500 to-emerald-500" },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <h3 className="text-white/40 text-sm mb-1">{stat.title}</h3>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h2 className="text-white font-medium mb-4">Recent Orders</h2>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <p className="text-white text-sm font-medium">{order.order_number}</p>
                        <p className="text-white/40 text-xs">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">${order.total_amount}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                          order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h2 className="text-white font-medium mb-4">Most Wishlisted</h2>
                <div className="space-y-3">
                  {(stats.popularProducts || []).slice(0, 5).map((product: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <p className="text-white text-sm font-medium">{product.title}</p>
                        <p className="text-white/40 text-xs">{product.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart size={14} className="text-rose-400" />
                        <span className="text-white text-sm">{product.wishlist_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-white font-medium mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl border-b border-white/5 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <div className="flex-1">
                      <p className="text-white/80 text-sm">{activity.action}</p>
                      <p className="text-white/30 text-xs">{activity.created_at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "collections":
        return (
          <div>
            <div className="mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-medium">Page Content</h2>
                  <button
                    onClick={() => setShowContentModal(true)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white text-sm flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit Content
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-white/40 text-xs mb-1">Bio (top of page)</p>
                    <p className="text-white/80 text-sm line-clamp-2">{pageContent?.bio || collection?.bio || "No bio set"}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Middle Info</p>
                    <p className="text-white/80 text-sm line-clamp-2">{pageContent?.middleInfo || collection?.journeyText || "No info set"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowCategoryModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition text-white text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                Add New Collection Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                  <div className="relative h-40 bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center">
                    {category.coverImage ? (
                      <img src={category.coverImage} alt={category.name} className="w-full h-full object-cover" />
                    ) : (
                      <Images size={40} className="text-white/20" />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button onClick={() => {
                        setEditingItem(category);
                        setShowCategoryModal(true);
                      }} className="p-2 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-white/20 transition">
                        <Edit2 size={14} className="text-white" />
                      </button>
                      <button onClick={() => handleDeleteCategory(category.id)} className="p-2 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-red-500/50 transition">
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">{category.works_count || 0} works</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-1">{category.name}</h3>
                    <p className="text-white/40 text-sm line-clamp-2">{category.description || "No description"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "works":
        return (
          <div>
            <div className="mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-medium">Works Management</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowWorkModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition text-white text-sm flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add New Work
                  </button>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 mt-4 border-t border-white/10 pt-4">
                  <button
                    onClick={() => setSelectedWorkCategory("all")}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                      selectedWorkCategory === "all" 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    All Categories ({works.length})
                  </button>
                  {categories.map(cat => {
                    const workCount = works.filter(w => w.categoryId === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedWorkCategory(cat.id.toString())}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                          selectedWorkCategory === cat.id.toString() 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {cat.name} ({workCount})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorks.map((work) => {
                const category = categories.find(c => c.id === work.categoryId);
                return (
                  <div key={work.id} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                    <div className="relative h-64 bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center">
                      {work.imageUrl ? (
                        <img src={work.imageUrl} alt={work.title} className="w-full h-full object-cover" />
                      ) : (
                        <Briefcase size={48} className="text-white/20" />
                      )}
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button onClick={() => {
                          setEditingItem(work);
                          setShowWorkModal(true);
                        }} className="p-2 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-white/20 transition">
                          <Edit2 size={14} className="text-white" />
                        </button>
                        <button onClick={() => handleDeleteWork(work.id)} className="p-2 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-red-500/50 transition">
                          <Trash2 size={14} className="text-white" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">{category?.name}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-medium mb-1 text-lg">{work.title}</h3>
                      <p className="text-white/60 text-sm line-clamp-2">{work.description || "No description"}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredWorks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/40">No works found in this category.</p>
              </div>
            )}
          </div>
        );

      case "store":
        return (
          <div>
            <div className="mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-medium">Store Categories</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowStoreCategoryModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition text-white text-sm flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Store Category
                  </button>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {storeCategories && storeCategories.length > 0 ? (
                    storeCategories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                        <span>{cat.name}</span>
                        <button 
                          onClick={() => {
                            setEditingItem(cat);
                            setShowStoreCategoryModal(true);
                          }} 
                          className="hover:text-purple-400 transition"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStoreCategory(cat.id, cat.name)} 
                          className="hover:text-red-400 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm">No store categories yet. Add one to organize your products.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-medium">Products</h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition text-white text-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-white/10">
                <button
                  onClick={() => setSelectedStoreCategory("all")}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                    selectedStoreCategory === "all" 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  All Products ({products.length})
                </button>
                <button
                  onClick={() => setSelectedStoreCategory("uncategorized")}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                    selectedStoreCategory === "uncategorized" 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  Uncategorized ({products.filter(p => !p.storeCategory).length})
                </button>
                {storeCategories.map(cat => {
                  const productCount = products.filter(p => p.storeCategory === cat.name).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedStoreCategory(cat.name)}
                      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                        selectedStoreCategory === cat.name 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {cat.name} ({productCount})
                    </button>
                  );
                })}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr className="text-left text-white/60 text-sm">
                      <th className="p-4">Image</th>
                      <th className="p-4">Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const storeCat = storeCategories.find(c => c.name === product.storeCategory);
                      return (
                        <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <ShoppingBag size={16} className="text-white/40" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-white text-sm">{product.name}</td>
                          <td className="p-4 text-white/60 text-sm">{storeCat?.name || product.storeCategory || "Uncategorized"}</td>
                          <td className="p-4 text-white text-sm">${product.price}</td>
                          <td className="p-4 text-white/60 text-sm">{product.size || "N/A"}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${product.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button onClick={() => {
                                setEditingItem(product);
                                setShowProductModal(true);
                              }} className="p-1 rounded hover:bg-white/10 transition">
                                <Edit2 size={14} className="text-white/60" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="p-1 rounded hover:bg-red-500/20 transition">
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "orders":
        return (
          <div>
            <div className="mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h2 className="text-white font-medium mb-4">Order Management</h2>
                <div className="flex gap-2 flex-wrap">
                  {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(status => (
                    <button key={status} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm capitalize transition">
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr className="text-left text-white/60 text-sm">
                      <th className="p-4">Order #</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Progress</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-4 text-white text-sm font-medium">{order.order_number}</td>
                        <td className="p-4 text-white/80 text-sm">{order.customer_name}</td>
                        <td className="p-4 text-white/60 text-sm">{order.created_at}</td>
                        <td className="p-4 text-white text-sm">${order.total_amount}</td>
                        <td className="p-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value, order.tracking_stage)}
                            className="px-3 py-1 rounded-full text-xs bg-black/60 border border-white/20 text-white focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select
                            value={order.tracking_stage || 'received'}
                            onChange={(e) => handleUpdateOrderStatus(order.id, order.status, e.target.value)}
                            className="px-3 py-1 rounded-full text-xs bg-black/60 border border-white/20 text-white focus:outline-none"
                          >
                            <option value="received">Received</option>
                            <option value="packaged">Packaged</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => handleViewOrder(order)}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition flex items-center gap-1"
                          >
                            <Eye size={12} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "activity":
        return (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h2 className="text-white font-medium mb-4">Activity Overview</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                    <span className="text-white/60 text-sm">Total Wishlists</span>
                    <span className="text-white text-xl font-bold">{stats.totalWishlists || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                    <span className="text-white/60 text-sm">Pending Orders</span>
                    <span className="text-white text-xl font-bold">{stats.pendingOrders || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                    <span className="text-white/60 text-sm">Total Views</span>
                    <span className="text-white text-xl font-bold">{stats.totalViews || 0}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h2 className="text-white font-medium mb-4">Activity Log</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl border-b border-white/5 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white/80 text-sm">{activity.description || `${activity.type} activity`}</p>
                        <p className="text-white/30 text-xs">{activity.created_at}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr className="text-left text-white/60 text-sm">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="p-4 text-white text-sm">No users data available</td>
                      <td className="p-4 text-white/60 text-sm">-</td>
                      <td className="p-4 text-white/60 text-sm">-</td>
                      <td className="p-4 text-white/60 text-sm">-</td>
                      <td className="p-4 text-white/60 text-sm">-</td>
                      <td className="p-4">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Head title="Admin Dashboard - Annie's Stitches" />
      
      <div className="min-h-screen font-sans relative">
        
        {/* Custom Background Image */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 z-0"
          style={{
            backgroundImage: `url('/images/admin.png')`,
            backgroundAttachment: 'fixed',
          }}
        />
        
        {/* Dark overlay for better readability */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[1]" />
        
        {/* Sidebar Drawer - TRANSPARENT */}
        <aside className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ${isSidebarOpen ? "w-72" : "w-20"} bg-transparent backdrop-blur-xl border-r border-white/10 shadow-2xl`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            {isSidebarOpen && (
              <Link href="/admin" className="text-white font-bold text-xl tracking-tight">
                creator<br/><span className="text-sm text-white/40">Annie's stitches</span>
              </Link>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white">
              {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {isMobile && isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition md:hidden">
              <X size={20} className="text-white" />
            </button>
          )}

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.id ? "bg-white/15 text-white border border-white/20" : "text-white/60 hover:bg-white/10 hover:text-white"
                  } ${!isSidebarOpen && "justify-center"}`}
                >
                  <Icon size={20} />
                  {isSidebarOpen && <span className="text-sm">{item.name}</span>}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className={`flex items-center gap-3 ${!isSidebarOpen && "justify-center"}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              {isSidebarOpen && (
                <>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Admin User</p>
                    <p className="text-white/40 text-xs">admin@annies.com</p>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-red-400">
                    <LogOut size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`transition-all duration-300 relative z-10 ${isSidebarOpen ? "ml-72" : "ml-20"}`}>
          <div className="sticky top-0 z-40 bg-transparent backdrop-blur-md border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isMobile && !isSidebarOpen && (
                  <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition text-white">
                    <Menu size={24} />
                  </button>
                )}
                <h1 className="text-xl font-light text-white capitalize">{activeTab}</h1>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">A</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {errors?.form && (
              <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                {errors.form}
              </div>
            )}
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showCategoryModal && <CategoryModal />}
      {showWorkModal && <WorkModal />}
      {showProductModal && <ProductModal />}
      {showStoreCategoryModal && <StoreCategoryModal />}
      {showOrderModal && <OrderDetailsModal />}
      {showContentModal && <ContentModal />}
    </>
  );
}


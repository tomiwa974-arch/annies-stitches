// import React, { useState, useEffect, useRef } from "react";
// import { Head, Link } from "@inertiajs/react";

// interface AdminLayoutProps {
//   children: React.ReactNode;
//   title: string;
// }

// export default function AdminLayouts({ children, title }: AdminLayoutProps) {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowProfileDropdown(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const menuItems = [
//     { name: 'Dashboard', icon: '📊', path: '/admin' },
//     { name: 'Collection', icon: '🖼️', path: '/admin/collection' },
//     { name: 'Categories', icon: '📁', path: '/admin/categories' },
//     { name: 'Works', icon: '🎨', path: '/admin/works' },
//     { name: 'Store', icon: '🛒', path: '/admin/products' },
//     { name: 'Orders', icon: '📦', path: '/admin/orders' },
//     { name: 'Activity', icon: '📈', path: '/admin/activities' },
//   ];

//   return (
//     <>
//       <Head title={`${title} | Admin`} />
      
//       <div className="min-h-screen bg-black text-white">
//         {/* Sidebar */}
//         <div className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} bg-black/40 backdrop-blur-xl border-r border-white/10`}>
//           {/* Logo */}
//           <div className="h-16 flex items-center px-4 border-b border-white/10">
//             <Link href="/admin" className="text-xl font-light tracking-wider text-white/90">
//               {isSidebarOpen ? 'ANNIE\'S ADMIN' : 'A'}
//             </Link>
//           </div>
          
//           {/* Toggle button */}
//           <button
//             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition"
//           >
//             {isSidebarOpen ? '◀' : '▶'}
//           </button>
          
//           {/* Menu items - Links that load different pages */}
//           <nav className="p-4 space-y-2">
//             {menuItems.map((item) => (
//               <Link
//                 key={item.path}
//                 href={item.path}
//                 className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition group"
//               >
//                 <span className="text-xl">{item.icon}</span>
//                 {isSidebarOpen && (
//                   <span className="text-sm text-white/80 group-hover:text-white">{item.name}</span>
//                 )}
//               </Link>
//             ))}
//           </nav>
          
//           {/* Bottom section */}
//           <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//                 className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition w-full"
//               >
//                 <span className="text-xl">👤</span>
//                 {isSidebarOpen && (
//                   <span className="text-sm text-white/80">Admin</span>
//                 )}
//               </button>
              
//               {showProfileDropdown && (
//                 <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
//                   <Link href="/admin/profile" className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg">
//                     Profile
//                   </Link>
//                   <Link href="/admin/settings" className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg">
//                     Settings
//                   </Link>
//                   <div className="border-t border-white/10 my-2"></div>
//                   <Link href="/logout" className="block px-4 py-2 text-sm text-red-300 hover:bg-white/10 rounded-lg">
//                     Sign Out
//                   </Link>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
        
//         {/* Main content */}
//         <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
//           <div className="p-8">
//             {children}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
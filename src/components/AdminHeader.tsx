// components/AdminHeader.tsx
'use client';

import {LogOut, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = () => {
    // Clear tokens from storage
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    // Redirect to login page
    router.push('/');
  };

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Inventory', href: '/inventory' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Sales', href: '/sales' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white shadow-md py-3' 
            : 'bg-white/85 backdrop-blur-md py-4'
        } px-4 sm:px-8 flex items-center justify-between border-b border-gray-100`}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tighter text-gray-900">
            <span className="bg-black text-white px-2 sm:px-3 py-1 rounded-lg mr-1">Forever</span>
            <span className="font-light">Young</span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex">
          <ul className="flex space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <li key={item.name} className="relative group">
                <Link 
                  href={item.href}
                  className={`text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm lg:text-base ${
                    pathname === item.href ? 'text-black font-semibold' : ''
                  }`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-black transition-all duration-300 ${
                    pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Profile and Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-black transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-dashed flex items-center justify-center group-hover:bg-gray-300">
              <LogOut className="h-4 w-4 text-gray-500 group-hover:text-black" />
            </div>
            <span className="ml-2 font-medium">Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex flex-col h-[calc(100%-80px)]">
              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <Link 
                        href={item.href}
                        className={`block py-3 px-6 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors ${
                          pathname === item.href ? 'bg-gray-50 text-black' : ''
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              
              {/* Mobile Logout Button */}
              <div className="border-t border-gray-200 p-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center text-gray-700 hover:text-black transition-colors group py-3 px-4 rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  <LogOut className="h-5 w-5 text-gray-500 group-hover:text-black mr-2" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
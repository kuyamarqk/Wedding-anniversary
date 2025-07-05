'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NavBar = () => {
  const pathname = usePathname();
  const isAlbumPage = pathname.startsWith('/albums');
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on navigation (optional, for better UX)
  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md shadow-md">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-white text-xl font-bold tracking-wide" onClick={handleNavClick}>
          💖 12 Years
        </Link>

        {/* Hamburger for mobile */}
        {!isAlbumPage && (
          <button
            className="sm:hidden text-white text-3xl focus:outline-none"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        )}

        {/* Desktop menu */}
        <ul className="hidden sm:flex space-x-6 text-white font-medium items-center">
          {!isAlbumPage && (
            <>
              <li>
                <a href="#hero" className="hover:text-pink-400 transition">Home</a>
              </li>
              <li>
                <a href="#story" className="hover:text-pink-400 transition">Our Story</a>
              </li>
              <li>
                <a href="#messages" className="hover:text-pink-400 transition">Messages</a>
              </li>
              <li>
                <a href="#memories" className="hover:text-pink-400 transition">Albums</a>
              </li>
            </>
          )}
          {isAlbumPage && (
            <li>
              <Link
                href="/#memories"
                className="text-2xl hover:text-rose-400 transition"
                title="Close Album"
              >
                ✕
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile menu */}
        {!isAlbumPage && menuOpen && (
          <ul className="absolute top-full left-0 w-full bg-black/90 flex flex-col items-center space-y-6 py-8 sm:hidden text-white font-medium text-lg shadow-lg">
            <li>
              <a href="#hero" className="hover:text-pink-400 transition" onClick={handleNavClick}>Home</a>
            </li>
            <li>
              <a href="#story" className="hover:text-pink-400 transition" onClick={handleNavClick}>Our Story</a>
            </li>
            <li>
              <a href="#messages" className="hover:text-pink-400 transition" onClick={handleNavClick}>Messages</a>
            </li>
            <li>
              <a href="#memories" className="hover:text-pink-400 transition" onClick={handleNavClick}>Albums</a>
            </li>
          </ul>
        )}

        {/* Album page mobile close button */}
        {isAlbumPage && (
          <button
            className="sm:hidden text-2xl text-white hover:text-rose-400 transition ml-4"
            onClick={() => window.location.href = '/#memories'}
            title="Close Album"
            aria-label="Close Album"
          >
            ✕
          </button>
        )}
      </nav>
    </header>
  );
};

export default NavBar;
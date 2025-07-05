'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavBar = () => {
  const pathname = usePathname();
  const isAlbumPage = pathname.startsWith('/albums');

  return (
    <header className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md shadow-md">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-white text-xl font-bold tracking-wide">
          💖 12 Years
        </Link>

        <ul className="flex space-x-6 text-white font-medium items-center">
          {/* Show anchor links only on the homepage */}
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

          {/* Show ✕ symbol when in album page */}
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
      </nav>
    </header>
  );
};

export default NavBar;

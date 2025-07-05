import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from './components/NavBar';
import Footer from './components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Happy 12th Anniversary',
  description: 'A celebration of our love, journey, and memories.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <body className="min-h-screen scroll-smooth font-[Playfair Display] text-gray-900 relative">
          <NavBar />
        <div className="fixed inset-0 z-0 bg-[url('/images/background.jpeg')] bg-cover bg-center bg-no-repeat brightness-75" />
  <div className="fixed inset-0 z-10 bg-gradient-to-b from-white/10 via-rose-200/20 to-pink-100/20 backdrop-blur-sm" />
  <div className="relative z-20">{children}</div>
        <Footer />
        
      </body>
    </html>
  );
}

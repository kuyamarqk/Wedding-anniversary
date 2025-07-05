'use client'; // This directive is necessary for client-side components in Next.js App Router

import { useEffect, useState } from 'react';

// Define TypeScript types for better code clarity and safety
type AlbumPreview = {
  preview: string; // URL to the preview image (e.g., /images/travel/preview.jpg)
  count: number;   // Number of photos in the album
};

type AlbumsData = Record<string, AlbumPreview>; // A map from album name (string) to AlbumPreview

type AlbumImages = Record<string, string[]>; // A map from album name (string) to an array of image URLs (string[])

const MemoriesSection = () => {
  // State to store the metadata for all albums (used to display album cards)
  const [albumsMeta, setAlbumsMeta] = useState<AlbumsData>({});
  // State to store the actual image URLs for each album (fetched when an album is opened)
  const [albums, setAlbums] = useState<AlbumImages>({});
  // State to track which album is currently selected/open in the modal
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // useEffect hook to fetch album metadata when the component mounts
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        // Make an API request to your /api/images route
        // This route should return the 'albumsMeta' data from your data/albums.json
        const res = await fetch('/api/images');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('CLIENT: Fetched albums metadata:', data); // Debug log for client-side console
        setAlbumsMeta(data); // Update state with the fetched album metadata
      } catch (error) {
        console.error('CLIENT ERROR: Failed to fetch albums metadata:', error);
        // Optionally, set an error state to display to the user
      }
    };
    fetchAlbums(); // Call the fetch function
  }, []); // Empty dependency array means this effect runs once after the initial render

  // Function to handle opening an album (e.g., when a user clicks an album card)
  const openAlbum = async (album: string) => {
    setSelectedAlbum(album); // Set the selected album to open the modal

    // Only fetch album images if they haven't been fetched before
    if (!albums[album]) {
      try {
        // Make an API request to your /api/images/[album] route
        // This route should return the 'images' array for the specific album from your data/albums.json
        const res = await fetch(`/api/images/${album}`);
        console.log('CLIENT: Response for specific album:', res); // Debug log for the raw response
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('CLIENT: Fetched images for album', album, ':', data); // Debug log for fetched images

        // Update the 'albums' state.
        // It should store an array of image URLs for the selected album.
        // `data.images` is expected here based on your API route's response structure.
        setAlbums((prev) => ({ ...prev, [album]: data.images || [] }));
      } catch (error) {
        console.error(`CLIENT ERROR: Failed to fetch images for album ${album}:`, error);
        // Optionally, clear selectedAlbum or show an error message
      }
    }
  };

  // The main rendering logic for the Memories Section
  return (
    <section
      id="memories"
      // Tailwind CSS classes for styling the section
      className="min-h-screen px-6 py-20 bg-white/10 backdrop-blur-md rounded-xl mx-4 my-8 shadow-lg"
    >
      <div className="max-w-6xl mx-auto text-center space-y-10">
        <h2 className="text-4xl md:text-5xl font-bold text-rose-500 drop-shadow-md">
          Cherished Memories
        </h2>
        <p className="text-lg max-w-2xl mx-auto text-white/90">
          Select an album to view our captured moments.
        </p>

        {/* Album Preview Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {/* Map over the albumsMeta to display each album as a clickable card */}
          {Object.entries(albumsMeta).map(([album, meta]) => (
            <div
              key={album} // Unique key for React list rendering
              onClick={() => openAlbum(album)} // Call openAlbum function on click
              // Tailwind CSS classes for album card styling
              className="cursor-pointer group overflow-hidden rounded-xl shadow-lg relative"
            >
              {/* Album preview image */}
              <img
                // Use the preview image URL from meta, or a placeholder if not available
                src={meta.preview || '/images/placeholder.jpg'}
                alt={`${album} preview`}
                // Tailwind CSS classes for image styling
                className="h-64 w-full object-cover transform group-hover:scale-110 transition duration-500"
                loading="lazy" // Optimize image loading
              />
              {/* Overlay for album title and photo count */}
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4">
                <h3 className="text-xl font-semibold text-white capitalize">
                  {album} {/* Display album name, capitalized */}
                </h3>
                <p className="text-white/80 text-sm">{meta.count} photos</p> {/* Display photo count */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Viewer for Selected Album */}
      {/* This modal is only rendered if an album is selected and its images array is valid */}
      {selectedAlbum && Array.isArray(albums[selectedAlbum]) && (
        <div
          // Tailwind CSS classes for the modal overlay and content
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-start p-6 overflow-y-auto"
        >
          {/* Close button for the modal */}
          <button
            onClick={() => setSelectedAlbum(null)} // Close modal by setting selectedAlbum to null
            className="text-white text-3xl font-bold self-end mb-6 hover:text-rose-500"
          >
            ✕ {/* 'X' icon */}
          </button>
          {/* Album title in the modal */}
          <h3 className="text-2xl text-white font-semibold mb-6 capitalize">
            {selectedAlbum} Album
          </h3>
          {/* Grid to display images within the modal */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full max-w-7xl">
            {/* Map over the images of the selected album */}
            {albums[selectedAlbum].map((src, i) => (
              <div
                key={i} // Unique key for each image
                // Tailwind CSS classes for individual image cards in the modal
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <img
                  src={src} // Image source URL
                  alt={`Memory ${i + 1}`}
                  // Tailwind CSS classes for image styling
                  className="w-full h-full max-h-[400px] object-cover object-center rounded-lg transition-transform duration-300 group-hover:scale-125"
                  loading="lazy" // Optimize image loading
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default MemoriesSection;
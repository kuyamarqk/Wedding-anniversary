'use client';

import { useEffect, useState } from 'react';

type AlbumPreview = {
  preview: string;
  count: number;
};

type AlbumsData = Record<string, AlbumPreview>;
type AlbumImages = Record<string, string[]>;

const MemoriesSection = () => {
  const [albumsMeta, setAlbumsMeta] = useState<AlbumsData>({});
  const [albums, setAlbums] = useState<AlbumImages>({});
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // State to hold any fetch errors

  // Fetch album metadata (preview + count)
  useEffect(() => {
    const fetchAlbums = async () => {
      setError(null); // Clear previous errors
      try {
        const res = await fetch('/api/images');

        // Check if the response itself was not OK (e.g., 404, 500)
        if (!res.ok) {
          const errorText = await res.text(); // Read the response body as text for more info
          console.error(`CLIENT ERROR: Failed to fetch /api/images. Status: ${res.status} ${res.statusText}`, errorText);
          setError(`Failed to load albums: ${res.status} ${res.statusText}. Details: ${errorText.substring(0, 100)}...`); // Show limited details
          setAlbumsMeta({}); // Ensure albumsMeta is reset on error
          return;
        }

        const data: AlbumsData = await res.json();
        console.log('CLIENT: Fetched albums metadata:', data); // CRUCIAL LOG
        
        // Basic validation of fetched data structure
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            console.error('CLIENT ERROR: Received unexpected data format for albums metadata:', data);
            setError('Received invalid album data from server.');
            setAlbumsMeta({});
            return;
        }

        setAlbumsMeta(data);
      } catch (err) {
        // This catches network errors, JSON parsing errors, etc.
        console.error('CLIENT ERROR: Network or parsing error fetching /api/images:', err);
        setError(`An error occurred fetching albums: ${(err as Error).message}`);
        setAlbumsMeta({}); // Ensure albumsMeta is reset on error
      }
    };
    fetchAlbums();
  }, []); // Empty dependency array means this runs once on mount

  // Optional: Log albumsMeta whenever it changes, useful for seeing its final state
  useEffect(() => {
    console.log('CLIENT: albumsMeta state updated:', albumsMeta);
  }, [albumsMeta]);


  // Fetch album images when selected
  const openAlbum = async (album: string) => {
    setError(null); // Clear errors for this action
    
    // Add a check to ensure 'album' is a valid string before proceeding
    if (typeof album !== 'string' || !album.trim()) {
        console.error('CLIENT ERROR: Attempted to open album with invalid name:', album);
        setError('Invalid album name provided.');
        return; // Prevent making the fetch request with an invalid album name
    }

    setSelectedAlbum(album);

    // Only fetch if album images are not already loaded
    if (!albums[album]) {
      try {
        console.log(`CLIENT: Fetching images for album: /api/images/${album}`); // CRUCIAL LOG
        const res = await fetch(`/api/images/${album}`);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`CLIENT ERROR: Failed to fetch /api/images/${album}. Status: ${res.status} ${res.statusText}`, errorText);
          setError(`Failed to load images for album "${album}": ${res.status} ${res.statusText}. Details: ${errorText.substring(0, 100)}...`);
          // Optionally, deselect the album or show an empty state
          setAlbums((prev) => ({ ...prev, [album]: [] })); // Store empty array on error
          return;
        }

        const data = await res.json();
        console.log(`CLIENT: Fetched images for album "${album}":`, data); // CRUCIAL LOG
        
        // Ensure data.images is an array
        if (!data || !Array.isArray(data.images)) {
            console.error('CLIENT ERROR: Expected an array of images, but received:', data);
            setError(`Unexpected data format for album "${album}" images.`);
            setAlbums((prev) => ({ ...prev, [album]: [] })); // Store empty array on parsing error
            return;
        }

        setAlbums((prev) => ({ ...prev, [album]: data.images || [] }));
      } catch (err) {
        console.error(`CLIENT ERROR: Network or parsing error fetching images for album "${album}":`, err);
        setError(`An error occurred loading images for "${album}": ${(err as Error).message}`);
        setAlbums((prev) => ({ ...prev, [album]: [] })); // Store empty array on network error
      }
    }
  };

  return (
    <section
      id="memories"
      className="min-h-screen px-6 py-20 bg-white/10 backdrop-blur-md rounded-xl mx-4 my-8 shadow-lg"
    >
      <div className="max-w-6xl mx-auto text-center space-y-10">
        <h2 className="text-4xl md:text-5xl font-bold text-rose-500 drop-shadow-md">
          Cherished Memories
        </h2>
        <p className="text-lg max-w-2xl mx-auto text-white/90">
          Select an album to view our captured moments.
        </p>

        {/* Display general error message if any */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-md mx-auto max-w-md">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-2">Check your browser console and Vercel logs for more details.</p>
          </div>
        )}

        {/* Album Preview Cards */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {/* Check if albumsMeta is an object and has entries before mapping */}
          {Object.keys(albumsMeta).length === 0 && !error ? (
              <p className="text-white/70 col-span-full">Loading albums...</p>
          ) : Object.keys(albumsMeta).length === 0 && error ? (
              <p className="text-white/70 col-span-full">No albums found or an error occurred.</p>
          ) : (
            Object.entries(albumsMeta).map(([album, meta]) => {
                // Add a final check here just in case, though the previous checks should prevent this
                if (typeof album !== 'string' || !album.trim()) {
                    console.error('CLIENT: Skipping album card due to invalid album name:', album);
                    return null; // Don't render invalid album cards
                }

                return (
                    <div
                        key={album}
                        onClick={() => openAlbum(album)} // Pass the clean album string
                        className="cursor-pointer group overflow-hidden rounded-xl shadow-lg relative"
                    >
                        <img
                            src={meta.preview || '/images/placeholder.jpg'}
                            alt={`${album} preview`}
                            className="h-64 w-full object-cover transform group-hover:scale-110 transition duration-500"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4">
                            <h3 className="text-xl font-semibold text-white capitalize">
                                {album}
                            </h3>
                            <p className="text-white/80 text-sm">{meta.count} photos</p>
                        </div>
                    </div>
                );
            })
          )}
        </div>
      </div>

      {/* Modal Viewer */}
      {selectedAlbum && Array.isArray(albums[selectedAlbum]) && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-start p-6 overflow-y-auto">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="text-white text-3xl font-bold self-end mb-6 hover:text-rose-500"
          >
            ✕
          </button>
          <h3 className="text-2xl text-white font-semibold mb-6 capitalize">
            {selectedAlbum} Album
          </h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full max-w-7xl">
            {albums[selectedAlbum].map((src, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <img
                  src={src}
                  alt={`Memory ${i + 1}`}
                  className="w-full h-full max-h-[400px] object-cover object-center rounded-lg transition-transform duration-300 group-hover:scale-125"
                  loading="lazy"
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
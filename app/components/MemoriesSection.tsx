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

  // Fetch album metadata (preview + count)
  useEffect(() => {
    const fetchAlbums = async () => {
      const res = await fetch('/api/images');
      const data = await res.json();
      console.log('Fetched albums metadata:', data); // Debug log
      setAlbumsMeta(data);
    };
    fetchAlbums();
  }, []);

  // Fetch album images when selected
  const openAlbum = async (album: string) => {
    setSelectedAlbum(album);

    if (!albums[album]) {
      const res = await fetch(`api/images/${album}`);
      console.log(res);
      const data = await res.json();
  
      // FIX: Only store the images array, not the whole object
      setAlbums((prev) => ({ ...prev, [album]: data.images || [] }));
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

        {/* Album Preview Cards */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {Object.entries(albumsMeta).map(([album, meta]) => (
            <div
              key={album}
              onClick={() => openAlbum(album)}
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
          ))}
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
import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';

interface PageProps {
  params: { [key: string]: string };
}

interface AlbumPageProps extends PageProps {
  params: { album: string };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const album = params.album;
  const folder = path.join(process.cwd(), 'public', 'images', album);

  let images: string[] = [];

  try {
    const files = await fs.readdir(folder);
    images = files
      .filter((file) => /\.(jpe?g|png|webp|gif|jfif)$/i.test(file))
      .map((file) => `/images/${album}/${file}`);
  } catch (err) {
    // If the folder doesn't exist or can't be read, show not found message
    return (
      <div className="p-10 text-red-500 text-xl font-semibold">
        Album not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-white/10 backdrop-blur-md">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white capitalize">
            {album} Album
          </h1>
          <Link href="/" className="text-rose-400 hover:underline">
            ← Back to Albums
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.length === 0 ? (
            <div className="col-span-full text-center text-white/80 text-lg">
              No images found in this album.
            </div>
          ) : (
            images.map((src, i) => (
              <div key={i} className="overflow-hidden rounded-lg shadow hover:shadow-lg transition">
                <img
                  src={src}
                  alt={`${album} image ${i}`}
                  className="w-full h-full max-h-[400px] object-cover object-center transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
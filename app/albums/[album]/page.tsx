import Link from 'next/link';

    type AlbumPageProps = {
      params: Promise<{ album: string }>;
    };

export default async function AlbumPage({ params }: AlbumPageProps) {
  const album = (await params).album;
  let images: string[] = [];

  try {
    // Fetch images from your API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const res = await fetch(`${baseUrl}/api/images/${album}`, { cache: 'no-store' });
    const data = await res.json();
    images = data.images || [];
  } catch (err) {
    images = [];
  }

  if (!images.length) {
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
          {images.map((src, i) => (
            <div key={i} className="overflow-hidden rounded-lg shadow hover:shadow-lg transition">
              <img
                src={src}
                alt={`${album} image ${i}`}
                className="w-full h-full max-h-[400px] object-cover object-center transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

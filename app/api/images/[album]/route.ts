import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Base directory for your albums inside public
const IMAGES_BASE_DIR = 'public/images'; 

export async function GET(request: Request, { params }: { params: { albumName: string } }) {
  // --- CRUCIAL DEBUGGING & VALIDATION ---
  // Log what params is receiving to Vercel logs
  console.log('SERVER: Received params for [albumName] route:', params); 

  // Explicitly check if albumName is present and is a string
  const albumName = params.albumName; // Access directly

  if (typeof albumName !== 'string' || !albumName.trim()) {
    console.error('SERVER ERROR: Invalid or missing albumName parameter.', { params, albumName });
    return NextResponse.json({
      error: 'Invalid album name provided in URL.',
      details: 'The albumName parameter was missing or not a valid string.',
      receivedParams: params // Include params in the error for debugging
    }, { status: 400 }); // Use 400 Bad Request for client-side parameter issues
  }
  // --- END CRUCIAL DEBUGGING & VALIDATION ---


  try {
    const albumFullPath = path.join(process.cwd(), IMAGES_BASE_DIR, albumName);
    console.log('SERVER: Attempting to read album directory:', albumFullPath); // Log for debugging

    // Check if the album directory exists
    try {
      await fs.access(albumFullPath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.warn(`SERVER: Album directory "${albumFullPath}" not found.`);
        return NextResponse.json({ error: `Album "${albumName}" not found on server.` }, { status: 404 });
      }
      throw error; // Re-throw other errors
    }

    // Read files within the specific album directory
    const albumFiles = await fs.readdir(albumFullPath, { withFileTypes: true });

    const imageUrls: string[] = [];
    // Ensure this path mapping is correct: it should be relative to the public root
    // For `public/images/albumName`, the public URL is `/images/albumName`
    const publicAlbumPath = `/${IMAGES_BASE_DIR.replace('public/', '')}/${albumName}`;

    for (const dirent of albumFiles) {
      if (dirent.isFile()) {
        const fileName = dirent.name;
        const fileExtension = path.extname(fileName).toLowerCase();

        // Filter for common image types
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
          imageUrls.push(`${publicAlbumPath}/${fileName}`);
        }
      }
    }

    console.log(`SERVER: Dynamically fetched ${imageUrls.length} images for album "${albumName}".`);
    return NextResponse.json({ images: imageUrls }, { status: 200 });

  } catch (error) {
    console.error(`SERVER ERROR: Failed to process request for album "${albumName}":`, error);
    if ((error as any).code === 'ENOENT') {
         console.error(`SERVER ERROR: ENOENT - Album directory not found at ${path.join(process.cwd(), IMAGES_BASE_DIR, albumName)}. ` +
                       `This likely means the files are not bundled with the serverless function on Vercel. ` +
                       `Check 'next.config.js' outputFileTracingIncludes.`);
     }
    return NextResponse.json({
      error: `Failed to fetch images for album ${albumName} on server.`,
      details: (error as Error).message,
    }, { status: 500 });
  }
}
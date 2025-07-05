// app/api/images/[album]/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Base directory for your albums inside public
const IMAGES_PUBLIC_PATH = 'public/images'; // Relative to process.cwd()

// Define types for clarity
interface AlbumMetadata {
  preview: string;
  images: string[];
}

interface AlbumsData {
  [albumName: string]: AlbumMetadata;
}

export async function GET(
  request: Request,
  // --- CRITICAL FIX: Directly destructure 'params' from the second argument ---
  { params }: { params: { album: string } } // Type correctly for dynamic segment 'album'
) {
  // Now, 'params' is directly available in the function scope
  // The 'rawParams' variable is no longer needed as 'params' is the direct object
  console.log('SERVER: Received raw params for [album] route:', params);

  // Safely extract the album name using the correct key 'album'
  // Since 'params' is directly destructured, we access 'params.album'
  const albumNameFromParams = (params && typeof params.album === 'string')
    ? params.album
    : '';

  if (!albumNameFromParams.trim()) {
    console.error('SERVER ERROR: Invalid or empty albumName parameter after extraction.', {
      originalParams: params, // Use 'params' directly for logging
      extractedAlbumName: albumNameFromParams
    });
    return NextResponse.json({
      error: 'Invalid album name provided in URL.',
      details: 'The album name parameter was missing or not a valid non-empty string. (Server-side)',
      receivedParams: params // Use 'params' directly for debugging
    }, { status: 400 });
  }

  const albumName = albumNameFromParams;

  try {
    const albumFullPath = path.join(process.cwd(), IMAGES_PUBLIC_PATH, albumName);
    console.log('SERVER: Attempting to read album directory:', albumFullPath);

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
    const imageDirents = await fs.readdir(albumFullPath, { withFileTypes: true });

    const imageUrls: string[] = [];
    const publicAlbumUrl = `/${IMAGES_PUBLIC_PATH.replace('public/', '')}/${albumName}`;

    for (const dirent of imageDirents) {
      if (dirent.isFile()) {
        const fileName = dirent.name;
        const fileExtension = path.extname(fileName).toLowerCase();

        // Filter for common image types
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
          imageUrls.push(`${publicAlbumUrl}/${fileName}`);
        }
      }
    }

    console.log(`SERVER: Dynamically fetched ${imageUrls.length} images for album "${albumName}".`);
    return NextResponse.json({ images: imageUrls }, { status: 200 });

  } catch (error) {
    console.error(`SERVER ERROR: Failed to process request for album "${albumName}":`, error);
    if ((error as any).code === 'ENOENT') {
         console.error(`SERVER ERROR: ENOENT - Album directory not found at ${path.join(process.cwd(), IMAGES_PUBLIC_PATH, albumName)}. ` +
                       `This likely means the files are not bundled with the serverless function on Vercel. ` +
                       `Double-check 'next.config.js' outputFileTracingIncludes.`);
     }
    return NextResponse.json({
      error: `Failed to fetch images for album ${albumName} on server.`,
      details: (error as Error).message,
    }, { status: 500 });
  }
}
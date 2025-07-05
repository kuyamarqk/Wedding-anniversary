// app/api/images/[album]/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Base directory for your albums inside public
const IMAGES_PUBLIC_PATH = 'public/images'; // Relative to process.cwd()

export async function GET(
  request: Request,
  context: { params: { album: string } } // Make sure your folder is `[album]`
) {
  // --- CRITICAL FIX FOR "params should be awaited" ---
  const rawParams = context.params;

  console.log('SERVER: Received raw params for [album] route:', rawParams);

  const albumNameFromParams = (rawParams && typeof rawParams.album === 'string')
    ? rawParams.album
    : '';

  if (!albumNameFromParams.trim()) {
    console.error('SERVER ERROR: Invalid or empty albumName parameter after extraction.', {
      originalParams: rawParams,
      extractedAlbumName: albumNameFromParams
    });
    return NextResponse.json({
      error: 'Invalid album name provided in URL.',
      details: 'The album name parameter was missing or not a valid non-empty string. (Server-side)',
      receivedParams: rawParams
    }, { status: 400 });
  }

  const albumName = albumNameFromParams;
  // --- END CRITICAL FIX & VALIDATION ---

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
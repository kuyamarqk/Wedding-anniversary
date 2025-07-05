// app/api/images/[album]/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Define TypeScript interfaces (should be consistent with route.ts)
interface AlbumMetadata {
  preview: string;
  images: string[];
}

interface AlbumsData {
  [albumName: string]: AlbumMetadata;
}

export async function GET(
  request: Request,
  // The second argument is automatically populated by Next.js with dynamic route parameters
  { params }: { params: { album: string } } // Type definition for the 'album' dynamic segment
) {
  console.log('SERVER: Received raw params for [album] route:', params);

  // Extract and validate the album name from the URL parameters
  const albumNameFromParams = (params && typeof params.album === 'string')
    ? params.album
    : '';

  if (!albumNameFromParams.trim()) {
    console.error('SERVER ERROR: Invalid or empty albumName parameter after extraction.', {
      originalParams: params,
      extractedAlbumName: albumNameFromParams
    });
    return NextResponse.json({
      error: 'Invalid album name provided in URL.',
      details: 'The album name parameter was missing or not a valid non-empty string. (Server-side)',
      receivedParams: params
    }, { status: 400 }); // Bad Request
  }

  const albumName = albumNameFromParams; // Use the validated album name

  try {
    // Construct the absolute path to the albums.json file
    const filePath = path.join(process.cwd(), 'data', 'albums.json');
    console.log(`SERVER: Attempting to read album data for "${albumName}" from: ${filePath}`);

    // Read and parse the albums.json file
    const fileContents = await fs.readFile(filePath, 'utf8');
    const allAlbums: AlbumsData = JSON.parse(fileContents);

    // Look up the specific album using the album name from the URL
    const album = allAlbums[albumName];

    // If the album is not found in albums.json, return a 404 Not Found response
    if (!album) {
      console.warn(`SERVER: Album "${albumName}" not found in data/albums.json.`);
      return NextResponse.json({ error: `Album "${albumName}" not found` }, { status: 404 });
    }

    console.log(`SERVER: Successfully fetched ${album.images.length} images for album "${albumName}" from JSON.`);
    // Return the array of image URLs for the requested album
    return NextResponse.json({ images: album.images }, { status: 200 });

  } catch (error) {
    // Log detailed error on the server side
    console.error(`SERVER ERROR: Error fetching images for album "${albumName}" from JSON:`, error);
    if (error instanceof Error) {
        // Specific handling for 'file not found' error for albums.json
        if ((error as any).code === 'ENOENT') {
            console.error(`SERVER DETAIL: 'data/albums.json' not found at ${path.join(process.cwd(), 'data', 'albums.json')}.`);
            console.error('SERVER REMINDER: Ensure generate-albums-json.js has been run and data/albums.json is committed to Git.');
            return NextResponse.json({
                error: 'Album data file (data/albums.json) not found on server.',
                details: `Please ensure 'data/albums.json' exists and is correctly committed to your repository. Server error: ${error.message}`
            }, { status: 500 });
        }
        // General error for other issues during file read or JSON parsing
        return NextResponse.json({
            error: `Failed to fetch images for album ${albumName} from JSON.`,
            details: (error as Error).message
        }, { status: 500 });
    }
    // Fallback for unknown error types
    return NextResponse.json({ error: `An unknown server error occurred for album ${albumName}.` }, { status: 500 });
  }
}
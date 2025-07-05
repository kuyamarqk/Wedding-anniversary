// app/api/images/[album]/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Define TypeScript interfaces (consistent with route.ts)
interface AlbumMetadata {
  preview: string;
  images: string[];
}

interface AlbumsData {
  [albumName: string]: AlbumMetadata;
}

// FIX START: Correct GET function signature for Next.js App Router
export async function GET(
  request: Request,
  // The correct type for params in App Router is often directly as a destructured object:
  { params }: { params: { album: string } }
  // OR sometimes it's expected as `context: { params: { album: string } }`
  // The current error implies `params: { album: string }` directly as the second arg is the issue.
  // Let's try the common and officially recommended way.
) {
// FIX END: Correct GET function signature

  console.log('SERVER: Received raw params for [album] route:', params);

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
    }, { status: 400 });
  }

  const albumName = albumNameFromParams;

  try {
    const filePath = path.join(process.cwd(), 'data', 'albums.json');
    console.log(`SERVER: Attempting to read album data for "${albumName}" from: ${filePath}`);

    const fileContents = await fs.readFile(filePath, 'utf8');
    const allAlbums: AlbumsData = JSON.parse(fileContents);

    const album = allAlbums[albumName];

    if (!album) {
      console.warn(`SERVER: Album "${albumName}" not found in data/albums.json.`);
      return NextResponse.json({ error: `Album "${albumName}" not found` }, { status: 404 });
    }

    console.log(`SERVER: Successfully fetched ${album.images.length} images for album "${albumName}" from JSON.`);
    return NextResponse.json({ images: album.images }, { status: 200 });

  } catch (error) {
    console.error(`SERVER ERROR: Error fetching images for album "${albumName}" from JSON:`, error);
    if (error instanceof Error) {
        if ((error as any).code === 'ENOENT') {
            console.error(`SERVER DETAIL: 'data/albums.json' not found at ${path.join(process.cwd(), 'data', 'albums.json')}.`);
            console.error('SERVER REMINDER: Ensure generate-albums-json.js has been run and data/albums.json is committed to Git.');
            return NextResponse.json({
                error: 'Album data file (data/albums.json) not found on server.',
                details: `Please ensure 'data/albums.json' exists and is correctly committed to your repository. Server error: ${error.message}`
            }, { status: 500 });
        }
        return NextResponse.json({
            error: `Failed to fetch images for album ${albumName} from JSON.`,
            details: (error as Error).message
        }, { status: 500 });
    }
    return NextResponse.json({ error: `An unknown server error occurred for album ${albumName}.` }, { status: 500 });
  }
}
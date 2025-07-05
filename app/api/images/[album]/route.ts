// app/api/images/[album]/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

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
  // Directly destructure 'params' for the dynamic route segment
  { params }: { params: { album: string } } // Type correctly for dynamic segment 'album'
) {
  // Console log the received params for debugging purposes
  console.log('SERVER: Received raw params for [album] route:', params);

  // Safely extract the album name from params
  const albumNameFromParams = (params && typeof params.album === 'string')
    ? params.album
    : '';

  // Validate the album name parameter
  if (!albumNameFromParams.trim()) {
    console.error('SERVER ERROR: Invalid or empty albumName parameter after extraction.', {
      originalParams: params,
      extractedAlbumName: albumNameFromParams
    });
    return NextResponse.json({
      error: 'Invalid album name provided in URL.',
      details: 'The album name parameter was missing or not a valid non-empty string. (Server-side)',
      receivedParams: params
    }, { status: 400 }); // Return 400 Bad Request for invalid client input
  }

  const albumName = albumNameFromParams; // Use the validated album name

  try {
    // Construct the path to your albums.json file (relative to process.cwd())
    const filePath = path.join(process.cwd(), 'data', 'albums.json');
    console.log('SERVER: Attempting to read JSON file from:', filePath);

    // Read the JSON file
    const fileContents = await fs.readFile(filePath, 'utf8');
    const allAlbums: AlbumsData = JSON.parse(fileContents);

    // Look up the specific album using the extracted albumName
    const album = allAlbums[albumName];

    // If the album is not found in albums.json, return a 404 Not Found response
    if (!album) {
      console.warn(`SERVER: Album "${albumName}" not found in data/albums.json.`);
      return NextResponse.json({ error: `Album "${albumName}" not found` }, { status: 404 });
    }

    console.log(`SERVER: Successfully fetched images for album "${albumName}" from JSON.`);
    // Return the images array from the found album entry
    return NextResponse.json({ images: album.images }, { status: 200 });

  } catch (error) {
    console.error(`SERVER ERROR: Error fetching images for album "${albumName}" from JSON:`, error);
    if (error instanceof Error) {
        if ((error as any).code === 'ENOENT') {
            // This specific ENOENT means albums.json itself wasn't found by the serverless function
            return NextResponse.json({
                error: 'Album data file (data/albums.json) not found on server.',
                details: `Ensure 'data/albums.json' exists at project root and is bundled. Error: ${error.message}`
            }, { status: 500 });
        }
        // Handle other general errors during file read or JSON parsing
        return NextResponse.json({
            error: `Failed to fetch images for album ${albumName} from JSON.`,
            details: error.message
        }, { status: 500 });
    }
    // Catch any unknown errors
    return NextResponse.json({ error: `An unknown server error occurred for album ${albumName}.` }, { status: 500 });
  }
}
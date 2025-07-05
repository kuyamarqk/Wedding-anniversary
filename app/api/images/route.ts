// app/api/images/route.ts

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

export async function GET(request: Request) {
  try {
    // Construct the path to your albums.json file (relative to process.cwd())
    // This assumes 'data/albums.json' is at your project root.
    const filePath = path.join(process.cwd(), 'data', 'albums.json');
    console.log('SERVER: Attempting to read JSON file from:', filePath);

    // Read the JSON file
    const fileContents = await fs.readFile(filePath, 'utf8');
    const allAlbums: AlbumsData = JSON.parse(fileContents);

    // Prepare the metadata needed by the client for the album list
    const albumsMeta: Record<string, { preview: string; count: number }> = {};
    for (const albumName in allAlbums) {
      // Ensure it's an own property to avoid iterating prototype chain
      if (Object.prototype.hasOwnProperty.call(allAlbums, albumName)) {
        const album = allAlbums[albumName];
        albumsMeta[albumName] = {
          preview: album.preview,
          count: album.images.length,
        };
      }
    }

    console.log('SERVER: Successfully fetched albums metadata from JSON.');
    return NextResponse.json(albumsMeta, { status: 200 });

  } catch (error) {
    console.error('SERVER ERROR: Error fetching albums metadata from JSON:', error);
    if (error instanceof Error) {
        if ((error as any).code === 'ENOENT') {
            // This error means data/albums.json was not found by the serverless function
            return NextResponse.json({
                error: 'Album data file (data/albums.json) not found on server.',
                details: `Ensure 'data/albums.json' exists at project root and is bundled. Error: ${error.message}`
            }, { status: 500 });
        }
        return NextResponse.json({
            error: 'Failed to fetch album metadata from JSON.',
            details: error.message
        }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown server error occurred while fetching albums.' }, { status: 500 });
  }
}
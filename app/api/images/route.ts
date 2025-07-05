// app/api/images/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Define TypeScript interfaces for data structure clarity
interface AlbumMetadata {
  preview: string; // Public URL path to the album's preview image
  images: string[]; // Array of public URL paths to all images in the album
}

interface AlbumsData {
  [albumName: string]: AlbumMetadata; // An object where keys are album names and values are AlbumMetadata
}

export async function GET(request: Request) {
  try {
    // Construct the absolute path to the albums.json file.
    // process.cwd() refers to the current working directory, which is the project root on Vercel.
    const filePath = path.join(process.cwd(), 'data', 'albums.json');
    console.log(`SERVER: Attempting to read albums metadata from: ${filePath}`);

    // Read the albums.json file content as a UTF-8 string
    const fileContents = await fs.readFile(filePath, 'utf8');
    // Parse the JSON string into a JavaScript object
    const allAlbums: AlbumsData = JSON.parse(fileContents);

    // Prepare the data structure needed by the client's MemoriesSection.tsx (album name, preview, count)
    const albumsMeta: Record<string, { preview: string; count: number }> = {};
    for (const albumName in allAlbums) {
      // Ensure the property belongs to the object itself, not its prototype chain
      if (Object.prototype.hasOwnProperty.call(allAlbums, albumName)) {
        const album = allAlbums[albumName];
        albumsMeta[albumName] = {
          preview: album.preview, // The public URL for the album's preview image
          count: album.images.length, // The number of images in this album
        };
      }
    }

    console.log(`SERVER: Successfully fetched ${Object.keys(albumsMeta).length} albums metadata.`);
    // Return the albums metadata as a JSON response with a 200 OK status
    return NextResponse.json(albumsMeta, { status: 200 });

  } catch (error) {
    // Log detailed error on the server side for debugging
    console.error('SERVER ERROR: Error fetching albums metadata from data/albums.json:', error);

    if (error instanceof Error) {
        // Specific handling for 'file not found' error
        if ((error as any).code === 'ENOENT') {
            console.error(`SERVER DETAIL: 'data/albums.json' not found at ${path.join(process.cwd(), 'data', 'albums.json')}.`);
            console.error('SERVER REMINDER: Ensure generate-albums-json.js has been run and data/albums.json is committed to Git.');
            return NextResponse.json({
                error: 'Album data file (data/albums.json) not found on server.',
                details: `Please ensure 'data/albums.json' exists and is correctly committed to your repository. Server error: ${error.message}`
            }, { status: 500 }); // Return 500 Internal Server Error
        }
        // General error for other issues during file read or JSON parsing
        return NextResponse.json({
            error: 'Failed to fetch album metadata from JSON.',
            details: (error as Error).message
        }, { status: 500 });
    }
    // Fallback for unknown error types
    return NextResponse.json({ error: 'An unknown server error occurred while fetching albums.' }, { status: 500 });
  }
}
// app/api/images/route.ts - Make sure it looks like this!

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

interface AlbumMetadata {
  preview: string;
  images: string[];
}

interface AlbumsData {
  [albumName: string]: AlbumMetadata;
}

export async function GET(request: Request) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'albums.json');
    console.log(`SERVER: Attempting to read albums metadata from: ${filePath}`);

    const fileContents = await fs.readFile(filePath, 'utf8');
    const allAlbums: AlbumsData = JSON.parse(fileContents);

    const albumsMeta: Record<string, { preview: string; count: number }> = {};
    for (const albumName in allAlbums) {
      if (Object.prototype.hasOwnProperty.call(allAlbums, albumName)) {
        const album = allAlbums[albumName];
        albumsMeta[albumName] = {
          preview: album.preview,
          count: album.images.length,
        };
      }
    }
    console.log(`SERVER: Successfully fetched ${Object.keys(albumsMeta).length} albums metadata.`);
    return NextResponse.json(albumsMeta, { status: 200 });

  } catch (error) {
    console.error('SERVER ERROR: Error fetching albums metadata from data/albums.json:', error);
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
            error: 'Failed to fetch album metadata from JSON.',
            details: (error as Error).message
        }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown server error occurred while fetching albums.' }, { status: 500 });
  }
}
// app/api/images/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Base directory for your albums inside public
const IMAGES_BASE_DIR = 'public/images'; // This is relative to process.cwd()

export async function GET(request: Request) {
  try {
    const fullPath = path.join(process.cwd(), IMAGES_BASE_DIR);
    console.log('Attempting to read directory:', fullPath); // Log for debugging

    // Read all items (folders) in the base directory
    const albumFolders = await fs.readdir(fullPath, { withFileTypes: true });

    const albumsData: Record<string, { preview: string; count: number }> = {};

    for (const dirent of albumFolders) {
      // Only process directories (which are your albums)
      if (dirent.isDirectory()) {
        const albumName = dirent.name;
        const albumFullPath = path.join(fullPath, albumName);
        const publicAlbumPath = `/${IMAGES_BASE_DIR.replace('public/', '')}/${albumName}`; // Public URL path

        // Read files within the album directory
        const albumFiles = await fs.readdir(albumFullPath, { withFileTypes: true });

        let imageCount = 0;
        let previewImage = '';

        for (const fileDirent of albumFiles) {
          if (fileDirent.isFile()) {
            const fileName = fileDirent.name;
            const fileExtension = path.extname(fileName).toLowerCase();

            // Only count common image types
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
              imageCount++;
              // Set a common preview image name or just the first one found
              if (fileName.includes('preview') || previewImage === '') {
                previewImage = `${publicAlbumPath}/${fileName}`;
              }
            }
          }
        }

        // Fallback preview if no images found or specific preview not set
        if (!previewImage && imageCount > 0) {
             // Use the first image found if no specific 'preview' image exists
            const firstImage = albumFiles.find(f => f.isFile() && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(f.name).toLowerCase()));
            if (firstImage) {
                previewImage = `${publicAlbumPath}/${firstImage.name}`;
            }
        } else if (!previewImage && imageCount === 0) {
            previewImage = '/images/placeholder.jpg'; // Path to your default placeholder in public/images
        }

        albumsData[albumName] = {
          preview: previewImage,
          count: imageCount,
        };
      }
    }

    console.log('Dynamically fetched albums metadata:', albumsData);
    return NextResponse.json(albumsData, { status: 200 });

  } catch (error) {
    console.error('Error dynamically fetching albums metadata:', error);
    // Log more details if it's an ENOENT error
    if ((error as any).code === 'ENOENT') {
      console.error(`ENOENT error: Directory not found at ${path.join(process.cwd(), IMAGES_BASE_DIR)}. ` +
                    `This usually means the files are not bundled with the serverless function on Vercel. ` +
                    `Check 'next.config.js' outputFileTracingIncludes.`);
    }
    return NextResponse.json({
      error: 'Failed to dynamically fetch album metadata',
      details: (error as Error).message,
    }, { status: 500 });
  }
}
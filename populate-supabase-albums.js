// populate-supabase-albums.js

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
// Load environment variables from .env.local file explicitly
require('dotenv').config({ path: '.env.local' });

const PUBLIC_IMAGES_DIR = path.join(__dirname, 'public', 'images');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) or Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set in .env.local.');
  console.error('Please ensure your .env.local file is in the project root and contains the correct Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to check if a file extension is an image
const isImageFile = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'].includes(ext);
};

async function populateSupabaseAlbums() {
  console.log('Starting Supabase album population...');
  console.log('Reading image folders from:', PUBLIC_IMAGES_DIR);

  try {
    const albumFolders = await fs.readdir(PUBLIC_IMAGES_DIR, { withFileTypes: true });

    for (const dirent of albumFolders) {
      if (dirent.isDirectory()) {
        const albumName = dirent.name;
        const albumPath = path.join(PUBLIC_IMAGES_DIR, albumName);
        // CRITICAL: Ensure public URL base is correctly formed
        // This is the public facing path, not the local file system path
        const publicAlbumUrlBase = `/images/${albumName}`;

        console.log(`\n--- Processing album folder: ${albumName} ---`);

        const filesInAlbum = await fs.readdir(albumPath, { withFileTypes: true });

        const imagesToInsert = [];
        let previewImageUrl = '';

        for (const fileDirent of filesInAlbum) {
          if (fileDirent.isFile() && isImageFile(fileDirent.name)) {
            // CRITICAL: Ensure image URL includes the publicAlbumUrlBase
            const imageUrl = `${publicAlbumUrlBase}/${fileDirent.name}`;
            imagesToInsert.push(imageUrl);

            // Heuristic for preview image
            if (fileDirent.name.toLowerCase().includes('preview') && !previewImageUrl) {
                previewImageUrl = imageUrl;
            }
          }
        }

        // Fallback: If no specific 'preview' image found, use the first image.
        if (!previewImageUrl && imagesToInsert.length > 0) {
            previewImageUrl = imagesToInsert[0];
        } else if (imagesToInsert.length === 0) {
            // If no images found, use a generic placeholder (ensure this exists in public/images/)
            previewImageUrl = '/images/placeholder.jpg';
            console.warn(`WARNING: Album "${albumName}" contains no images. Using placeholder for preview.`);
        }

        imagesToInsert.sort();

        // --- Supabase Operations ---

        let albumId;

        const { data: existingAlbum, error: fetchAlbumError } = await supabase
          .from('albums')
          .select('id')
          .eq('name', albumName)
          .single();

        if (fetchAlbumError && fetchAlbumError.code !== 'PGRST116') {
          console.error(`Error checking for existing album ${albumName}:`, fetchAlbumError);
          continue;
        }

        if (existingAlbum) {
          albumId = existingAlbum.id;
          const { error: updateAlbumError } = await supabase
            .from('albums')
            .update({ preview_url: previewImageUrl })
            .eq('id', albumId);
          if (updateAlbumError) console.error(`Error updating album ${albumName}:`, updateAlbumError);
          else console.log(`Updated existing album: ${albumName} (ID: ${albumId})`);

          const { error: deleteImagesError } = await supabase
            .from('images')
            .delete()
            .eq('album_id', albumId);
          if (deleteImagesError) console.error(`Error deleting old images for album ${albumName}:`, deleteImagesError);
          else console.log(`Deleted old images for album: ${albumName}`);

        } else {
          const { data: newAlbum, error: insertAlbumError } = await supabase
            .from('albums')
            .insert({ name: albumName, preview_url: previewImageUrl })
            .select('id')
            .single();

          if (insertAlbumError) {
            console.error(`Error inserting new album ${albumName}:`, insertAlbumError);
            continue;
          }
          albumId = newAlbum.id;
          console.log(`Inserted new album: ${albumName} (ID: ${albumId})`);
        }

        if (albumId && imagesToInsert.length > 0) {
          const imagesData = imagesToInsert.map((url, index) => ({
            album_id: albumId,
            url: url,
            order: index,
          }));

          const { error: insertImagesError } = await supabase
            .from('images')
            .insert(imagesData);
          if (insertImagesError) console.error(`Error inserting images for album ${albumName}:`, insertImagesError);
          else console.log(`Inserted ${imagesToInsert.length} images for album: ${albumName}`);
        } else if (albumId && imagesToInsert.length === 0) {
            console.log(`No images to insert for album: ${albumName}`);
        }
      }
    }

    console.log('\nSupabase album population completed successfully!');

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`ERROR: Could not find the public/images directory at ${PUBLIC_IMAGES_DIR}.`);
      console.error('Please ensure your image folders are located inside public/images/.');
    } else {
      console.error('An unexpected error occurred during Supabase album population:', error);
    }
    process.exit(1);
  }
}

populateSupabaseAlbums();
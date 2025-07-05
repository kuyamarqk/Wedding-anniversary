// populate-supabase-albums.js

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
// Load environment variables from .env.local file explicitly
require('dotenv').config({ path: '.env.local' });

const PUBLIC_IMAGES_DIR = path.join(__dirname, 'public', 'images');

// Initialize Supabase client using environment variables
// Ensure these variables are set in your .env.local file in the project root
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
  // Add more image extensions if you have them
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'].includes(ext);
};

async function populateSupabaseAlbums() {
  console.log('Starting Supabase album population...');
  console.log('Reading image folders from:', PUBLIC_IMAGES_DIR);

  try {
    // Read contents of the public/images directory
    const albumFolders = await fs.readdir(PUBLIC_IMAGES_DIR, { withFileTypes: true });

    for (const dirent of albumFolders) {
      // Process only directories (which represent albums)
      if (dirent.isDirectory()) {
        const albumName = dirent.name; // The folder name is the album name
        const albumPath = path.join(PUBLIC_IMAGES_DIR, albumName);
        const publicAlbumUrlBase = `/images/${albumName}`; // Public URL base for this specific album

        console.log(`\n--- Processing album folder: ${albumName} ---`);

        const filesInAlbum = await fs.readdir(albumPath, { withFileTypes: true });

        const imagesToInsert = [];
        let previewImageUrl = ''; // Will store the public URL of the preview image for this album

        for (const fileDirent of filesInAlbum) {
          if (fileDirent.isFile() && isImageFile(fileDirent.name)) {
            const imageUrl = `${publicAlbumUrlBase}/${fileDirent.name}`;
            imagesToInsert.push(imageUrl);

            // Heuristic for preview image:
            // 1. Look for 'preview' in filename (case-insensitive)
            // 2. Otherwise, take the first image found
            if (fileDirent.name.toLowerCase().includes('preview') && !previewImageUrl) {
                previewImageUrl = imageUrl;
            }
          }
        }

        // Fallback: If no specific 'preview' image found in the folder, use the first image in the list
        if (!previewImageUrl && imagesToInsert.length > 0) {
            previewImageUrl = imagesToInsert[0];
        } else if (imagesToInsert.length === 0) {
            // If no images found in the album folder, use a generic placeholder
            // Make sure you have this file in public/images/
            previewImageUrl = '/images/placeholder.jpg';
            console.warn(`WARNING: Album "${albumName}" contains no images. Using placeholder for preview.`);
        }

        // Sort images alphabetically for consistent order in the database
        imagesToInsert.sort();

        // --- Supabase Operations ---

        let albumId;

        // 1. Check if album already exists in 'albums' table
        const { data: existingAlbum, error: fetchAlbumError } = await supabase
          .from('albums')
          .select('id')
          .eq('name', albumName)
          .single(); // Use .single() as name is UNIQUE

        if (fetchAlbumError && fetchAlbumError.code !== 'PGRST116') { // PGRST116 means "No rows found"
          console.error(`Error checking for existing album ${albumName}:`, fetchAlbumError);
          continue; // Skip to next album if unable to check existence
        }

        if (existingAlbum) {
          albumId = existingAlbum.id;
          // Album exists, update its preview_url (if needed)
          const { error: updateAlbumError } = await supabase
            .from('albums')
            .update({ preview_url: previewImageUrl })
            .eq('id', albumId); // Update by ID
          if (updateAlbumError) console.error(`Error updating album ${albumName}:`, updateAlbumError);
          else console.log(`Updated existing album: ${albumName} (ID: ${albumId})`);

          // Delete all old images associated with this album before re-inserting
          // This ensures no stale image entries remain if images were removed from folder
          const { error: deleteImagesError } = await supabase
            .from('images')
            .delete()
            .eq('album_id', albumId);
          if (deleteImagesError) console.error(`Error deleting old images for album ${albumName}:`, deleteImagesError);
          else console.log(`Deleted old images for album: ${albumName}`);

        } else {
          // Album does not exist, insert new album
          const { data: newAlbum, error: insertAlbumError } = await supabase
            .from('albums')
            .insert({ name: albumName, preview_url: previewImageUrl })
            .select('id') // Select the generated ID
            .single(); // Expect a single row back

          if (insertAlbumError) {
            console.error(`Error inserting new album ${albumName}:`, insertAlbumError);
            continue; // Skip to next album if insertion fails
          }
          albumId = newAlbum.id;
          console.log(`Inserted new album: ${albumName} (ID: ${albumId})`);
        }

        // 2. Insert Images into 'images' table, linked to the album_id
        if (albumId && imagesToInsert.length > 0) {
          const imagesData = imagesToInsert.map((url, index) => ({
            album_id: albumId,
            url: url,
            order: index, // Use index for 'order' column to maintain sorting
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
    process.exit(1); // Exit with an error code if an error occurs
  }
}

// Run the function
populateSupabaseAlbums();
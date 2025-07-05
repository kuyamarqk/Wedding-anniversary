const fs = require('fs').promises; // Use promises version for async/await
const path = require('path');

const PUBLIC_IMAGES_DIR = path.join(__dirname, 'public', 'images');
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'albums.json');

// Function to check if a file extension is an image
const isImageFile = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  // Add more image extensions if you have them
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'].includes(ext);
};

async function generateAlbumsJson() {
  console.log('Starting generation of albums.json based on subfolders...');
  console.log('Reading from:', PUBLIC_IMAGES_DIR);
  console.log('Writing to:', OUTPUT_FILE);

  let albumsData = {}; // This will hold all your albums

  try {
    // Ensure the data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Read contents of the public/images directory
    const albumFolders = await fs.readdir(PUBLIC_IMAGES_DIR, { withFileTypes: true });

    for (const dirent of albumFolders) {
      // Process only directories (which represent albums)
      if (dirent.isDirectory()) {
        const albumName = dirent.name; // The folder name is the album name
        const albumPath = path.join(PUBLIC_IMAGES_DIR, albumName);
        const publicAlbumUrlBase = `/images/${albumName}`; // Public URL base for this specific album

        console.log(`Processing album folder: ${albumName}`);

        const filesInAlbum = await fs.readdir(albumPath, { withFileTypes: true });

        const images = [];
        let previewImage = ''; // Will store the public URL of the preview image for this album

        for (const fileDirent of filesInAlbum) {
          if (fileDirent.isFile() && isImageFile(fileDirent.name)) {
            const imageUrl = `${publicAlbumUrlBase}/${fileDirent.name}`;
            images.push(imageUrl);

            // Heuristic for preview image:
            // 1. Look for 'preview' in filename (case-insensitive)
            // 2. Otherwise, take the first image found
            if (fileDirent.name.toLowerCase().includes('preview') && !previewImage) {
                previewImage = imageUrl;
            }
          }
        }

        // Fallback: If no specific 'preview' image found in the folder, use the first image in the list
        if (!previewImage && images.length > 0) {
            previewImage = images[0];
        } else if (images.length === 0) {
            // If no images found in the album folder, use a generic placeholder
            previewImage = '/images/placeholder.jpg'; // Make sure you have this file in public/images/
            console.warn(`WARNING: Album "${albumName}" contains no images. Using placeholder for preview.`);
        }

        // Sort images alphabetically for consistent order in the JSON
        images.sort();

        // Add this album's data to the overall albumsData object
        albumsData[albumName] = {
          preview: previewImage,
          images: images,
        };
      }
    }

    // Write the compiled albumsData to the JSON file, formatted for readability
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(albumsData, null, 2), 'utf8');

    console.log('Successfully generated albums.json!');
    console.log('Generated albums:', Object.keys(albumsData).join(', '));

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`ERROR: Could not find the public/images directory at ${PUBLIC_IMAGES_DIR}.`);
      console.error('Please ensure your image folders are located inside public/images/.');
    } else {
      console.error('An error occurred during albums.json generation:', error);
    }
    process.exit(1); // Exit with an error code if an error occurs
  }
}

// Run the function
generateAlbumsJson();
const fs = require('fs').promises; // Use promises version for async/await
const path = require('path');

const PUBLIC_IMAGES_DIR = path.join(__dirname, 'public', 'images');
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'albums.json');

// Function to check if a file extension is an image
const isImageFile = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'].includes(ext);
};

async function generateAlbumsJson() {
  console.log('Starting generation of albums.json...');
  console.log('Reading from:', PUBLIC_IMAGES_DIR);
  console.log('Writing to:', OUTPUT_FILE);

  let albumsData = {};

  try {
    // Ensure the data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    const albumFolders = await fs.readdir(PUBLIC_IMAGES_DIR, { withFileTypes: true });

    for (const dirent of albumFolders) {
      if (dirent.isDirectory()) {
        const albumName = dirent.name;
        const albumPath = path.join(PUBLIC_IMAGES_DIR, albumName);
        const publicAlbumUrlBase = `/images/${albumName}`; // Public URL base for this album

        console.log(`Processing album: ${albumName}`);

        const filesInAlbum = await fs.readdir(albumPath, { withFileTypes: true });

        const images = [];
        let previewImage = '';

        for (const fileDirent of filesInAlbum) {
          if (fileDirent.isFile() && isImageFile(fileDirent.name)) {
            const imageUrl = `${publicAlbumUrlBase}/${fileDirent.name}`;
            images.push(imageUrl);

            // Heuristic for preview image:
            // 1. Look for 'preview' in filename (case-insensitive)
            // 2. Otherwise, take the first image found (you can refine this)
            if (fileDirent.name.toLowerCase().includes('preview') && !previewImage) {
                previewImage = imageUrl;
            }
          }
        }

        // Fallback: If no specific 'preview' image found, use the first image in the list
        if (!previewImage && images.length > 0) {
            previewImage = images[0];
        } else if (images.length === 0) {
            // If no images found, use a generic placeholder
            previewImage = '/images/placeholder.jpg'; // Make sure you have this!
            console.warn(`WARNING: Album "${albumName}" contains no images. Using placeholder for preview.`);
        }

        // Sort images alphabetically for consistent order
        images.sort();

        albumsData[albumName] = {
          preview: previewImage,
          images: images,
        };
      }
    }

    // Write the data to the JSON file, formatted for readability
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(albumsData, null, 2), 'utf8');

    console.log('Successfully generated albums.json!');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`ERROR: Could not find the public/images directory at ${PUBLIC_IMAGES_DIR}.`);
      console.error('Please ensure your image folders are located inside public/images/.');
    } else {
      console.error('An error occurred during albums.json generation:', error);
    }
    process.exit(1); // Exit with an error code
  }
}

// Run the function
generateAlbumsJson();
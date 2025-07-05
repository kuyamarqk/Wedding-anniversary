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

async function generateSingleMemoriesAlbumJson() {
  console.log('Starting generation of albums.json for a single "Memories" album...');
  console.log('Reading from:', PUBLIC_IMAGES_DIR);
  console.log('Writing to:', OUTPUT_FILE);

  let memoriesAlbum = {
    preview: '', // To be determined
    images: [],
  };

  try {
    // Ensure the data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Read all items (files and subdirectories) directly in public/images
    const itemsInPublicImages = await fs.readdir(PUBLIC_IMAGES_DIR, { withFileTypes: true });

    let firstImageFound = ''; // To serve as a fallback preview if no specific one is found

    for (const dirent of itemsInPublicImages) {
      const itemPath = path.join(PUBLIC_IMAGES_DIR, dirent.name);
      const publicUrlBase = `/images`; // Base URL for public images

      if (dirent.isDirectory()) {
        // If it's a directory, read its contents
        const filesInSubdir = await fs.readdir(itemPath, { withFileTypes: true });
        for (const subDirent of filesInSubdir) {
          if (subDirent.isFile() && isImageFile(subDirent.name)) {
            const imageUrl = `${publicUrlBase}/${dirent.name}/${subDirent.name}`;
            memoriesAlbum.images.push(imageUrl);
            if (!firstImageFound) {
              firstImageFound = imageUrl; // Capture the first image for potential preview
            }
          }
        }
      } else if (dirent.isFile() && isImageFile(dirent.name)) {
        // If it's a file directly in public/images (less common for albums, but handled)
        const imageUrl = `${publicUrlBase}/${dirent.name}`;
        memoriesAlbum.images.push(imageUrl);
        if (!firstImageFound) {
          firstImageFound = imageUrl; // Capture the first image for potential preview
        }
      }

      // Check if the current item is a candidate for the overall preview (e.g., named 'preview.jpg' at any level)
      if (dirent.isFile() && dirent.name.toLowerCase().includes('preview') && !memoriesAlbum.preview) {
          memoriesAlbum.preview = `${publicUrlBase}/${dirent.name}`;
      } else if (dirent.isDirectory()) {
          // If it's a directory, check for a preview image inside it
          const filesInSubdir = await fs.readdir(itemPath, { withFileTypes: true });
          const subdirPreview = filesInSubdir.find(
            (f) => f.isFile() && f.name.toLowerCase().includes('preview') && isImageFile(f.name)
          );
          if (subdirPreview && !memoriesAlbum.preview) {
              memoriesAlbum.preview = `${publicUrlBase}/${dirent.name}/${subdirPreview.name}`;
          }
      }
    }

    // Sort images alphabetically for consistent order
    memoriesAlbum.images.sort();

    // Final fallback for preview image if no specific 'preview' image was found
    if (!memoriesAlbum.preview && firstImageFound) {
      memoriesAlbum.preview = firstImageFound;
    } else if (!memoriesAlbum.preview && memoriesAlbum.images.length === 0) {
      memoriesAlbum.preview = '/images/placeholder.jpg'; // Ensure you have this placeholder!
      console.warn('WARNING: No images found in public/images. Using placeholder for preview.');
    } else if (!memoriesAlbum.preview) {
      // If no explicit preview and no first image (but other images exist), just pick the first sorted one
      memoriesAlbum.preview = memoriesAlbum.images[0] || '/images/placeholder.jpg';
    }


    const albumsData = {
      "Memories": memoriesAlbum, // All images go into a single "Memories" album
    };

    // Write the data to the JSON file, formatted for readability
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(albumsData, null, 2), 'utf8');

    console.log('Successfully generated albums.json for "Memories" album!');
    console.log(`Total images in "Memories" album: ${memoriesAlbum.images.length}`);

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`ERROR: Could not find the public/images directory at ${PUBLIC_IMAGES_DIR}.`);
      console.error('Please ensure your image files are located inside public/images/ (or its subfolders).');
    } else {
      console.error('An error occurred during albums.json generation:', error);
    }
    process.exit(1); // Exit with an error code
  }
}

// Run the function
generateSingleMemoriesAlbumJson();
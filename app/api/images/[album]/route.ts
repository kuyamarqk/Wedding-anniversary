// app/api/images/[album]/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Correct import for Supabase

// Initialize Supabase client using environment variables
// These variables must be set in your .env.local file (for local development)
// and in your Vercel project's Environment Variables (for deployment).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Basic validation for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('SERVER ERROR: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) or Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set.');
    console.error('Please ensure these are configured in your .env.local file and Vercel project environment variables.');
}
// Ensure createClient is called with non-null/undefined strings
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');


export async function GET(
  request: NextRequest, // The first argument is the NextRequest object
  // The second argument is the context object, containing dynamic route parameters.
  // We name it 'ctx' here to be explicit and potentially avoid any cached type issues
  // that might have been associated with the name 'context'.
  ctx: any // This is the precise type signature for context
) {
  // Directly access the album parameter from ctx.params.
  // This approach is robust and should resolve the "params should be awaited" error.
  const albumName = ctx.params.album;

  console.log('SERVER: Received album name:', albumName);

  // Perform robust validation on the extracted albumName
  if (!albumName || typeof albumName !== 'string' || albumName.trim() === '') {
    console.error('SERVER ERROR: Invalid or empty albumName parameter.', { receivedParams: ctx.params });
    return NextResponse.json({
      error: 'Invalid album name provided in URL.',
      details: 'The album name parameter was missing or not a valid non-empty string.',
      receivedParams: ctx.params // Include original params for debugging
    }, { status: 400 });
  }

  try {
    // 1. Fetch the album's ID from the 'albums' table using the album name
    const { data: albumData, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('name', albumName)
      .single(); // Use .single() as album name is unique

    if (albumError) {
      console.error(`SERVER ERROR: Supabase fetch error for album "${albumName}":`, albumError);
      // Supabase specific error code for "no rows found" (album not in DB)
      if (albumError.code === 'PGRST116') {
          return NextResponse.json({ error: `Album "${albumName}" not found.` }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch album data from Supabase', details: albumError.message }, { status: 500 });
    }

    if (!albumData) {
        console.warn(`SERVER: Album "${albumName}" not found in Supabase (no data returned after initial query).`);
        return NextResponse.json({ error: `Album "${albumName}" not found` }, { status: 404 });
    }

    const albumId = albumData.id; // Extract the UUID of the album

    // 2. Fetch all image URLs associated with that album_id from the 'images' table
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('url') // We only need the URL of each image
      .eq('album_id', albumId) // Filter images by the album's ID
      .order('order', { ascending: true }); // Order images based on the 'order' column

    if (imagesError) {
      console.error(`SERVER ERROR: Supabase fetch error for images in album "${albumName}":`, imagesError);
      return NextResponse.json({ error: `Failed to fetch images for album "${albumName}"`, details: imagesError.message }, { status: 500 });
    }

    // Extract just the URLs into an array
    const imageUrls = images ? images.map(img => img.url) : [];

    console.log(`SERVER: Successfully fetched ${imageUrls.length} images for album "${albumName}" from Supabase.`);
    return NextResponse.json({ images: imageUrls }, { status: 200 });

  } catch (error) {
    console.error(`SERVER ERROR: An unexpected error occurred while fetching images for album "${albumName}" from Supabase:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'An unexpected server error occurred.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown server error occurred.' }, { status: 500 });
  }
}
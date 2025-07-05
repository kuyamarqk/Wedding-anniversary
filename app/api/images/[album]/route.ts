// app/api/images/[album]/route.ts

import { NextResponse, type NextRequest } from 'next/server'; // Correct import for NextRequest type
import { createClient } from '@supabase/supabase-js'; // Correct import for Supabase

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('SERVER ERROR: Supabase URL or Anon Key not set.');
}
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');


export async function GET(
  request: NextRequest, // First argument is the Request object
  context: { params: { album: string } } // Second argument is the context object containing params
) {
  const { params } = context; // Correctly destructure params from context

  // Use the album name directly from params.album. No await needed here.
  const albumName = params.album; //
  
  // This check now uses the directly accessed albumName
  if (!albumName || typeof albumName !== 'string' || !albumName.trim()) {
    console.error('SERVER ERROR: Invalid or empty albumName parameter.', { receivedParams: params });
    return NextResponse.json({
      error: 'Invalid album name provided in URL.',
      details: 'The album name parameter was missing or not a valid non-empty string.',
      receivedParams: params
    }, { status: 400 });
  }

  try {
    // 1. Get the album_id from the 'albums' table using the album name
    const { data: albumData, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('name', albumName)
      .single(); // Use .single() as album name is unique

    if (albumError) {
      console.error(`SERVER ERROR: Supabase fetch error for album ${albumName}:`, albumError);
      if (albumError.code === 'PGRST116') { // Supabase error code for "no rows found"
          return NextResponse.json({ error: `Album "${albumName}" not found.` }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch album data from Supabase', details: albumError.message }, { status: 500 });
    }

    if (!albumData) {
        console.warn(`SERVER: Album "${albumName}" not found in Supabase (no data returned after query).`);
        return NextResponse.json({ error: `Album "${albumName}" not found` }, { status: 404 });
    }

    const albumId = albumData.id;

    // 2. Fetch all image URLs associated with that album_id
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('url')
      .eq('album_id', albumId)
      .order('order', { ascending: true }); // Order by 'order' column if you use it

    if (imagesError) {
      console.error(`SERVER ERROR: Supabase fetch error for images in album ${albumName}:`, imagesError);
      return NextResponse.json({ error: `Failed to fetch images for album ${albumName}`, details: imagesError.message }, { status: 500 });
    }

    const imageUrls = images ? images.map(img => img.url) : [];

    console.log(`SERVER: Successfully fetched ${imageUrls.length} images for album "${albumName}" from Supabase.`);
    return NextResponse.json({ images: imageUrls }, { status: 200 });

  } catch (error) {
    console.error(`SERVER ERROR: An unexpected error occurred while fetching images for album ${albumName} from Supabase:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'An unexpected server error occurred.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown server error occurred.' }, { status: 500 });
  }
}
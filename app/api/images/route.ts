// app/api/images/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Correct import for Supabase

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Basic validation for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('SERVER ERROR: Supabase URL or Anon Key not set. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and Vercel environment variables.');
    // In a real app, you might want to throw an error or return a 500 here immediately.
    // For now, we'll proceed with potentially empty strings which createClient will likely fail on.
}
// Ensure createClient is called with non-null/undefined strings
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export async function GET() {
    try {
        // Fetch album ID, name, and preview URL from the 'albums' table
        const { data: albums, error } = await supabase
            .from('albums')
            .select('id, name, preview_url');

        if (error) {
            console.error('SERVER ERROR: Supabase fetch error for albums:', error);
            return NextResponse.json({ error: 'Failed to fetch album data from Supabase', details: error.message }, { status: 500 });
        }

        if (!albums || albums.length === 0) {
            console.log('SERVER: No albums found in Supabase.');
            return NextResponse.json({}, { status: 200 }); // Return empty object if no albums
        }

        const albumsMeta: Record<string, { preview: string; count: number }> = {};

        // For each album, fetch its image count
        for (const album of albums) {
            const { count, error: countError } = await supabase
                .from('images')
                .select('id', { count: 'exact' }) // Get exact count of images
                .eq('album_id', album.id); // Filter by album ID

            if (countError) {
                console.error(`SERVER ERROR: Supabase fetch error for image count for album ${album.name}:`, countError);
                // Continue despite count error, or handle as needed
                albumsMeta[album.name] = {
                    preview: album.preview_url || '/images/placeholder.jpg',
                    count: 0, // Default to 0 if count fails
                };
            } else {
                albumsMeta[album.name] = {
                    preview: album.preview_url || '/images/placeholder.jpg', // Fallback placeholder
                    count: count || 0,
                };
            }
        }

        console.log(`SERVER: Successfully fetched ${Object.keys(albumsMeta).length} albums metadata from Supabase.`);
        return NextResponse.json(albumsMeta, { status: 200 });

    } catch (error) {
        console.error('SERVER ERROR: An unexpected error occurred while fetching albums from Supabase:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: 'An unexpected server error occurred.', details: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown server error occurred.' }, { status: 500 });
    }
}
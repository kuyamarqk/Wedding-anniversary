import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return NextResponse.json([], { status: 200 }); // ✅ Always return array
  }

  return NextResponse.json(data);
}

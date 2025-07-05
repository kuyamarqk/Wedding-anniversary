import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: any // <-- Use 'any' here to bypass type issues
) {
  const album = context.params.album;
  const folder = path.join(process.cwd(), 'public', 'images', album);

  try {
    const files = await fs.readdir(folder);
    const images = files
      .filter((file) => /\.(jpe?g|png|webp|gif|jfif)$/i.test(file))
      .map((file) => `/images/${album}/${file}`);
    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ images: [] }, { status: 404 });
  }
}
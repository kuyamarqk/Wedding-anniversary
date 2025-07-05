import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const albums = ['bond', 'travel', 'latest'];
  const result: Record<string, { preview: string; count: number }> = {};

  for (const album of albums) {
    const dirPath = path.join(process.cwd(), 'public', 'images', album);
    const files = fs.readdirSync(dirPath).filter((file) =>
      /\.(jpe?g|png|gif|webp|jfif)$/i.test(file)
    );
    if (files.length > 0) {
      result[album] = {
        preview: `/images/${album}/${files [0]}`, // use first image as preview
        count: files.length,
      };
    }
  }

  return NextResponse.json(result);
}
// /app/api/images/[album]/route.ts
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { album: string } }) {
  const { album } = params;
  const dirPath = path.join(process.cwd(), 'public', 'images', album);

  if (!fs.existsSync(dirPath)) {
    return NextResponse.json([], { status: 404 });
  }

  const files = fs.readdirSync(dirPath).filter((file) =>
    /\.(jpe?g|png|gif|webp|jfif)$/i.test(file)
  );

  const images = files.map((file) => `/images/${album}/${file}`);
  return NextResponse.json(images);
}

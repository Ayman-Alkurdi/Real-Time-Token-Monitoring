
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const sessionsDir = path.resolve(process.cwd(), '..', 'sessions');
  try {
    const dirents = await fs.readdir(sessionsDir, { withFileTypes: true });
    const directories = dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    return NextResponse.json(directories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read sessions directory' }, { status: 500 });
  }
}

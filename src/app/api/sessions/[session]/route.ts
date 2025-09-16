
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request
) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const session = pathParts[3];

  const sessionDir = path.resolve(process.cwd(), '..', 'sessions', session, 'chats');
  try {
    const dirents = await fs.readdir(sessionDir, { withFileTypes: true });
    const files = dirents
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json'))
      .map((dirent) => dirent.name);
    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read session directory' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request
) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const session = pathParts[3];
  const file = pathParts[4];

  const filePath = path.resolve(process.cwd(), '..', 'sessions', session, 'chats', file);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

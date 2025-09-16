
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET(
  request: Request
) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const session = pathParts[3];
  const filesOnly = url.searchParams.get('files') === 'true';

  const sessionDir = path.join(os.homedir(), '.gemini', 'tmp', session, 'chats');
  try {
    const dirents = await fs.readdir(sessionDir, { withFileTypes: true });
    const files = dirents
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json'))
      .map((dirent) => dirent.name);

    if (filesOnly) {
      return NextResponse.json(files);
    }

    let allMessages: any[] = [];
    for (const file of files) {
      const filePath = path.join(sessionDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const jsonContent = JSON.parse(content);
      if (jsonContent.messages) {
        allMessages = allMessages.concat(jsonContent.messages);
      }
    }

    return NextResponse.json({ messages: allMessages });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to read session directory' }, { status: 500 });
  }
}

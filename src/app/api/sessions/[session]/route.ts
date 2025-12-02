
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

  const sessionDir = path.join(process.env.MONITORING_DIR || path.join(os.homedir(), '.gemini', 'tmp'), session, 'chats');
  try {
    const dirents = await fs.readdir(sessionDir, { withFileTypes: true });
    const filesWithStats = await Promise.all(
      dirents
        .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json'))
        .map(async (dirent) => {
          const fullPath = path.join(sessionDir, dirent.name);
          const stats = await fs.stat(fullPath);
          return {
            name: dirent.name,
            createdAt: stats.birthtime,
          };
        })
    );

    filesWithStats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const files = filesWithStats.map((file) => file.name);

    if (filesOnly) {
      return NextResponse.json(files);
    }

    const filesContent: { [key: string]: any[] } = {};
    for (const file of files) {
      const filePath = path.join(sessionDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const jsonContent = JSON.parse(content);
      if (jsonContent.messages) {
        filesContent[file] = jsonContent.messages;
      }
    }

    return NextResponse.json({ files: filesContent });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to read session directory' }, { status: 500 });
  }
}

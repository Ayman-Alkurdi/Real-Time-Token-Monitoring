
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET() {
  const sessionsDir = process.env.MONITORING_DIR || path.join(os.homedir(), '.gemini', 'tmp');
  try {
    const dirents = await fs.readdir(sessionsDir, { withFileTypes: true });
    const directories = await Promise.all(
      dirents
        .filter((dirent) => dirent.isDirectory() && dirent.name !== 'bin')
        .map(async (dirent) => {
          const fullPath = path.join(sessionsDir, dirent.name);
          const stats = await fs.stat(fullPath);
          let lastActiveAt = stats.birthtime;

          try {
            const chatsDir = path.join(fullPath, 'chats');
            const chatFiles = await fs.readdir(chatsDir);
            for (const file of chatFiles) {
              const filePath = path.join(chatsDir, file);
              const fileStats = await fs.stat(filePath);
              if (fileStats.mtime > lastActiveAt) {
                lastActiveAt = fileStats.mtime;
              }
            }
          } catch (error) {
            // Ignore if chats directory doesn't exist or is empty
          }

          return {
            name: dirent.name,
            createdAt: stats.birthtime,
            lastActiveAt,
          };
        })
    );

    directories.sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());

    return NextResponse.json(directories.map((dir) => ({ name: dir.name, createdAt: dir.createdAt, lastActiveAt: dir.lastActiveAt })));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to read sessions directory' }, { status: 500 });
  }
}


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
        .filter((dirent) => dirent.isDirectory())
        .map(async (dirent) => {
          const fullPath = path.join(sessionsDir, dirent.name);
          const stats = await fs.stat(fullPath);
          return {
            name: dirent.name,
            createdAt: stats.birthtime,
          };
        })
    );

    directories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(directories.map((dir) => ({ name: dir.name, createdAt: dir.createdAt })));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to read sessions directory' }, { status: 500 });
  }
}

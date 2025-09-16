
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET() {
  const sessionsDir = process.env.MONITORING_DIR || path.join(os.homedir(), '.gemini', 'tmp');
  try {
    const dirents = await fs.readdir(sessionsDir, { withFileTypes: true });
    const directories = dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    return NextResponse.json(directories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to read sessions directory' }, { status: 500 });
  }
}

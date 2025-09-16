
import { createServer } from 'http';
import { Server } from 'socket.io';
import { FSWatcher } from 'chokidar';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let watcher: FSWatcher | null = null;

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('watchFile', async (filePath) => {
    if (watcher) {
      watcher.close();
    }
    const fullPath = path.join(os.homedir(), '.gemini', 'tmp', filePath.replace('/', '/chats/'));
    console.log('Watching file:', fullPath); // Added for debugging
    watcher = chokidar.watch(fullPath);
    watcher.on('change', async () => {
      console.log('File changed:', fullPath); // Added for debugging
      const content = await fs.readFile(fullPath, 'utf-8');
      socket.emit('fileUpdate', content);
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (watcher) {
      watcher.close();
    }
  });
});

httpServer.listen(3001, () => {
  console.log('listening on *:3001');
});

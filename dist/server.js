import { createServer } from 'http';
import { Server } from 'socket.io';
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
let watcher = null;
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('watchFile', async (filePath) => {
        if (watcher) {
            watcher.close();
        }
        const sessionDir = process.env.MONITORING_DIR || path.join(os.homedir(), '.gemini', 'tmp');
        const fullPath = path.join(sessionDir, filePath.replace('/', '/chats/'));
        console.log('Watching file:', fullPath); // Added for debugging
        watcher = chokidar.watch(fullPath);
        watcher.on('change', async () => {
            console.log('File changed:', fullPath); // Added for debugging
            const content = await fs.readFile(fullPath, 'utf-8');
            socket.emit('fileUpdate', content);
        });
    });
    socket.on('watchSession', async (sessionId) => {
        if (watcher) {
            watcher.close();
        }
        const baseDir = process.env.MONITORING_DIR || path.join(os.homedir(), '.gemini', 'tmp');
        const sessionDir = path.join(baseDir, sessionId, 'chats');
        console.log('Watching session directory:', sessionDir);
        watcher = chokidar.watch(sessionDir);
        watcher.on('all', async (event, filePath) => {
            // console.log(`Event: ${event} on ${filePath}`);
            if (['add', 'change'].includes(event) && filePath.endsWith('.json')) {
                console.log(`File ${event}:`, filePath);
                const content = await fs.readFile(filePath, 'utf-8');
                const fileName = path.basename(filePath);
                socket.emit('sessionFileUpdate', { fileName, content });
            }
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

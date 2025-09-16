
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const os = require('os');

const socket = io('http://localhost:3001');

const SESSION_DIR = '26ff604af91546a40e00da4dc3a4250c351e41fe08706ecac9e929db96b06470';
const FILE_NAME = 'session-2025-09-15T13-28-199815dc.json';
const FILE_PATH_FOR_SERVER = `${SESSION_DIR}/${FILE_NAME}`;
const FULL_FILE_PATH = path.join(os.homedir(), '.gemini', 'tmp', SESSION_DIR, 'chats', FILE_NAME);

let testPassed = false;

socket.on('connect', () => {
  console.log('Connected to WebSocket server.');

  // 1. Tell the server to watch our test file
  console.log(`Requesting to watch file: ${FILE_PATH_FOR_SERVER}`);
  socket.emit('watchFile', FILE_PATH_FOR_SERVER);

  // 2. After a short delay, modify the file to trigger the watcher
  setTimeout(() => {
    console.log(`Modifying file: ${FULL_FILE_PATH}`);
    // Read the existing file, append a message, and write it back
    fs.readFile(FULL_FILE_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading test file:', err);
        process.exit(1);
      }
      try {
        const json = JSON.parse(data);
        json.messages.push({ id: 'test-append', content: `Test update at ${new Date().toISOString()}` });
        const newContent = JSON.stringify(json, null, 2);
        fs.writeFile(FULL_FILE_PATH, newContent, (writeErr) => {
          if (writeErr) {
            console.error('Error writing to test file:', writeErr);
            process.exit(1);
          }
          console.log('File modified successfully.');
        });
      } catch (parseErr) {
        console.error('Error parsing JSON from test file:', parseErr);
        process.exit(1);
      }
    });
  }, 1000); // 1-second delay
});

// 3. Listen for the update from the server
socket.on('fileUpdate', (content) => {
  console.log('Received fileUpdate event!');
  try {
    const data = JSON.parse(content);
    const lastMessage = data.messages[data.messages.length - 1];
    if (lastMessage && lastMessage.id === 'test-append') {
      console.log('SUCCESS: Received the correct content update.');
      testPassed = true;
    } else {
      console.error('ERROR: Received content, but the test message was not found at the end.');
    }
  } catch (e) {
    console.error('ERROR: Failed to parse received content.', e);
  }
  socket.disconnect();
});

socket.on('disconnect', () => {
  console.log('Disconnected from server.');
  if (testPassed) {
    process.exit(0); // Success
  } else {
    process.exit(1); // Failure
  }
});

// 4. Add a timeout in case the server never responds
setTimeout(() => {
  if (!testPassed) {
    console.error('ERROR: Test timed out. No fileUpdate event received.');
    socket.disconnect();
  }
}, 5000); // 5-second timeout

console.log('Starting WebSocket test...');

# Current Project Features

This document outlines the existing features of the monitoring application.

## Core Functionality

*   **Real-time File Monitoring:** The application can monitor a specified file for changes in real-time.
*   **WebSocket Communication:** A WebSocket server (`socket.io`) is used for instant communication between the frontend and the backend, pushing updates to the client as they happen.
*   **File System Watching:** The `chokidar` library is used on the server to efficiently watch for file modifications.

## Frontend

*   **Next.js Application:** The user interface is a modern web application built with Next.js and React.
*   **Data Visualization:** The `recharts` library is integrated to display the monitored data in the form of charts.
*   **Session Management API:** The application includes Next.js API routes for handling session-related logic, such as listing session directories.

## Backend

*   **Custom WebSocket Server:** A custom server is implemented in `src/server/server.ts` to manage WebSocket connections and file watching.
*   **Dynamic File Watching:** The server can be instructed by the client to start or stop watching a specific file.

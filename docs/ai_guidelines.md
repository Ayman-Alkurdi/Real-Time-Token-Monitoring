# AI Tool Guidelines for Project Understanding

This document provides a concise overview of the project to help AI tools understand its structure, purpose, and key technologies. This will enable faster and more accurate search and analysis.

## Project Overview

This is a web-based monitoring application built with Next.js. It's designed to monitor file changes in a specific directory and visualize the data in real-time. The application consists of a Next.js frontend and a custom WebSocket server.

## Key Technologies

*   **Frontend:**
    *   **Framework:** Next.js (with React)
    *   **Language:** TypeScript
    *   **UI Components:** React components, potentially using a library like Tailwind CSS for styling.
    *   **Real-time Communication:** `socket.io-client` is used to connect to the WebSocket server.
    *   **Data Visualization:** `recharts` is used for creating charts.

*   **Backend:**
    *   **Framework:** Next.js API Routes and a custom WebSocket server.
    *   **Language:** TypeScript
    *   **Real-time Communication:** A custom WebSocket server (`src/server/server.ts`) built with `socket.io` is used to monitor file changes.
    *   **File System Monitoring:** The `chokidar` library is used to watch for file changes in the `~/.gemini/tmp/` directory.

*   **Tooling:**
    *   **Package Manager:** npm
    *   **Linting:** ESLint
    *   **TypeScript:** Used for static typing.

## Project Structure

*   **`src/app`**: The main directory for the Next.js application, using the App Router.
    *   **`src/app/api`**: Contains the Next.js API routes.
        *   `src/app/api/sessions` handles session-related logic, such as listing session directories.
    *   **`src/app/page.tsx`**: The main page of the application.
*   **`src/components`**: Contains reusable React components.
*   **`src/server`**: Contains the custom WebSocket server implementation (`server.ts`).
*   **`public`**: Contains static assets like images and SVGs.
*   **`docs`**: Contains project documentation.
*   **`next.config.ts`**: The configuration file for Next.js.
*   **`package.json`**: Lists project dependencies and scripts.
*   **`tsconfig.json`**: The configuration file for TypeScript.

## How it Works

1.  The Next.js application starts, and the custom WebSocket server (`src/server/server.ts`) also starts.
2.  The frontend connects to the WebSocket server using `socket.io-client`.
3.  The user can select a file to monitor through the UI.
4.  The frontend sends a `watchFile` event to the WebSocket server with the file path.
5.  The server starts watching the specified file for changes using `chokidar`.
6.  When the file is modified, the server reads the file content and sends a `fileUpdate` event to the frontend.
7.  The frontend receives the updated content and updates the UI, potentially visualizing the data using `recharts`.
8.  The Next.js API routes are used to get session information, such as listing available session directories.

## How to Search this Project

When searching this project, consider the following:

*   For frontend-related queries, look in `src/app` and `src/components`.
*   For backend API logic, look in `src/app/api`.
*   For the real-time WebSocket logic, look in `src/server/server.ts`.
*   For dependencies and scripts, refer to `package.json`.
*   For build and configuration, refer to `next.config.ts` and `tsconfig.json`.

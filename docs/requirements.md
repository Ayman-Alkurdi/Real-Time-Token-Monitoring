# Requirements for Real-Time Token Consumption Dashboard

## 1. Introduction
This document outlines the functional and non-functional requirements for a web-based dashboard designed to provide real-time monitoring of token consumption. The dashboard will read data from a local JSON file, automatically refresh its display whenever the file is updated, and present the information in a clear, easily digestible format.

## 2. Functional Requirements

### FR1: Data Source & Dynamic File Selection
- **FR1.1:** The application must dynamically discover and allow the user to select a specific chat session JSON file to monitor.
- **FR1.2:** The base directory for sessions (e.g., `C:\Users\ayman\.gemini\tmp\`) must be configurable via an environment variable.
- **FR1.3:** The application will scan the base directory to find available session folders.
- **FR1.4:** For a selected session, the application will scan its `chats` subdirectory to find available chat session JSON files.

### FR2: Real-Time Updates
- **FR2.1:** The application must implement a mechanism to detect modifications (e.g., saves, overwrites) to the source JSON file.
- **FR2.2:** Upon detection of a file update, the application must automatically re-read and re-process the file's content.
- **FR2.3:** The front-end dashboard must update its display with the new data immediately after processing, without requiring a manual browser refresh.

### FR3: Dashboard Display & Visualization
- **FR3.1: Session Selector UI:**
    - A dropdown menu to select an available session ID.
    - A second dropdown menu, populated based on the first selection, to choose a specific chat session file.
    - The dashboard will load data from the selected file.
- **FR3.2: Key Metrics (KPIs):** The dashboard must display the following metrics for the selected session:
    - Total Tokens Consumed (Input + Output)
    - Total Input Tokens
    - Total Output Tokens
    - Number of API Calls
- **FR3.3: Time-Series Chart:**
    - A line or bar chart visualizing token consumption over time.
    - X-axis: Timestamp of each event.
    - Y-axis: Number of tokens.
    - Ability to toggle the view between total, input, and output tokens.
- **FR3.4: Recent Activity Log:**
    - A table displaying the last 10-20 events.
    - Columns: Timestamp, Input Tokens, Output Tokens, Total Tokens.

## 3. Non-Functional Requirements

- **NFR1: Performance:** The dashboard UI should update within 2 seconds of the source file being modified.
- **NFR2: Usability:** The dashboard must be clean, intuitive, and easy to understand.
- **NFR3: Reliability:** The application should handle file errors (e.g., malformed JSON, file lock) gracefully and recover automatically.

## 4. Technology Stack

- **TS1: Framework:** The project must be built using **Next.js**.
- **TS2: Language:** TypeScript should be used for development.
- **TS3: Styling:** A modern CSS framework (e.g., Tailwind CSS, Shadcn/ui) should be used for styling to ensure a clean and responsive UI.

## 5. Data Schema Example
The dashboard will parse the root JSON object from the session file. The primary data to be processed is within the `messages` array. The application should iterate through this array and extract token information from messages where `type` is `gemini`.

### Example JSON Structure:
```json
{
  "sessionId": "497f8734-6da6-4567-ac0d-89cc31003d51",
  "startTime": "2025-09-15T11:40:48.283Z",
  "messages": [
    {
      "id": "90657074-5673-4511-8075-b4674152eb79",
      "timestamp": "2025-09-15T11:40:48.283Z",
      "type": "user",
      "content": "check the current project"
    },
    {
      "id": "e48fc57c-b190-44ab-b0d1-8553f1648bfa",
      "timestamp": "2025-09-15T11:41:01.666Z",
      "type": "gemini",
      "content": "Okay, I'll start by checking...",
      "tokens": {
        "input": 9315,
        "output": 61,
        "cached": 0,
        "thoughts": 507,
        "tool": 0,
        "total": 9883
      },
      "model": "gemini-2.5-pro"
    }
  ]
}
```

### Key fields to be extracted from each `gemini` message:
- `timestamp`
- `tokens.input`
- `tokens.output`
- `tokens.total`


# Gemini CLI Monitoring App

This project is a monitoring application designed to help you understand and optimize your token consumption when using the Gemini CLI. By visualizing the token count of your requests, you can identify patterns and adopt strategies to reduce costs and improve efficiency.


## How It Works

The application monitors a file for changes in real-time and uses WebSockets to send the updated data to the frontend. The frontend then visualizes the data, allowing you to see how your token count changes as you interact with the Gemini CLI.

For a detailed breakdown of the project's features, please see [CURRENT_FEATURES.md](docs/CURRENT_FEATURES.md).

## Reducing Token Consumption with Gemini CLI

## Gemini CLI Token Optimization Checklist

Use this checklist to configure your environment and workflow for minimal token consumption and maximum cost efficiency.

### ⚙️ Configuration
- [ ] **Create a `.geminiignore` File**
  - Place a `.geminiignore` file in your project root to prevent accidental ingestion of massive files.
  - **Suggested content:**
    ```text
    node_modules/
    dist/
    build/
    *.log
    *.lock
    *.csv
    ```
- [ ] **Add "Concise" System Instructions**
  - Create a `GEMINI.md` context file to instruct the model to be brief.
  - **Suggested content:** "You are a helpful assistant. BE CONCISE. Output code only unless an explanation is requested."
- [ ] **Limit Tool Output (Optional)**
  - Edit `~/.gemini/settings.json` to place a `tokenBudget` on shell commands so they don't flood the context window.

### 🔄 Usage Habits
- [ ] **Clear Context on New Topics**
  - Run `/clear` immediately when switching tasks to wipe the expensive conversation history.
- [ ] **Compress Long Histories**
  - Run `/compress` during long debugging sessions to summarize the chat history and free up tokens.
- [ ] **Use Specific File References**
  - Avoid generic `@.` (current directory) calls. Instead, reference only the specific files needed (e.g., `@src/main.py`).


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

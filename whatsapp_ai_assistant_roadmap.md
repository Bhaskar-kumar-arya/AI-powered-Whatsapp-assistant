# WhatsApp AI Assistant – Updated Roadmap 🚀

---

## ✅ Prerequisites & Tools

### Software

* **Node.js (18+)** and npm installed.
* **Electron** for the desktop GUI.
* VS Code (or another code editor).
* Git for version control.

### Node.js Libraries

* `whatsapp-web.js`: To connect with WhatsApp Web.
* `qrcode-terminal`: To display QR codes in the terminal for initial setup.
* `electron`: The framework for building the desktop app.
* `@google/generative-ai` or `openai`: To interact with the LLM.
* `sqlite3`: For local database storage.

### Accounts

* A WhatsApp account (preferably a secondary one for testing).
* An OpenAI or Google AI Platform account (API key required).

---
---

## Phase 1: Core Service & Data Pipeline 🧱

**Goal:** Establish a reliable, background-safe connection to WhatsApp and continuously sync messages into a local database. This phase focuses purely on the data backend.

### Step 1: Project & Service Setup

* Create a Node.js project.
* Structure the project to have a dedicated service module (`whatsapp-service.js`) that handles all `whatsapp-web.js` logic.
* The service should be designed to be called by the main Electron process. It will handle initialization, QR code generation, and message listening.

### Step 2: Database Schema & Storage

* Initialize `sqlite3` and create a `whatsapp.db` file.
* Define a robust `messages` table with a `UNIQUE` constraint on `message_id` to prevent duplicates. Include columns for media metadata.
    * `id`, `message_id` (UNIQUE), `chat_id`, `chat_name`, `sender`, `message_content`, `media_type`, `timestamp`.
* Create indexes on `chat_id` and `timestamp` for fast lookups.

### Step 3: Implement Sync Logic

* Write functions within the service to:
    * Save new incoming messages to the database in real-time.
    * On startup, perform a "warm-up" sync of the most recent N chats to populate the database.
    * Provide on-demand functions to fetch older message history for a specific chat.

**Milestone:** You have a Node.js service that can be run independently. It connects to WhatsApp, logs you in, and reliably saves all incoming and recent messages to the `whatsapp.db` file.

---
---

## Phase 2: UI Foundation & Read-Only Client 🖥️

**Goal:** Build the complete three-pane user interface in Electron and connect it to the database to display chats and messages. This phase focuses on creating a functional, visually appealing "read-only" client.

refer to UIplan.md

## Phase 3: The Brain (AI Integration & Intelligence) 🧠

**Goal:** Connect the UI to the AI model. Enable core intelligent features like summarization and conversational interaction within the Co-pilot panel.

### Step 1: AI Service Module

* Create an `ai-service.js` module in your Electron project.
* Install the `openai` or `@google/generative-ai` library.
* Write functions that take prompts (like a formatted conversation history) and return the AI's response.

### Step 2: Connect the Co-pilot Chat

* When a user sends a message in the Pane 3 Co-pilot chat, the UI will send the prompt to the main process via IPC.
* The main process will call the `ai-service.js` to get a response.
* The response is sent back to the UI and displayed in the Co-pilot chat window.

### Step 3: Implement Basic AI Features

* Connect the UI buttons to the AI service:
    * **Summarize Chat Button:** When clicked, it fetches the current chat's history, sends it to the AI for summarization, and displays the result in the `Summary` tab of Pane 3.
    * **Contextual Menu Actions:** Wire up the "Draft reply to this" action to generate a response and display it in the `Drafts` tab.

**Milestone:** The AI is alive. You can have a conversation with the Co-pilot, ask it questions, and use UI buttons to summarize chats or draft replies.

---
---

## Phase 4: The Agent (Automation & Function Calling) 🚀

**Goal:** Empower the AI to take actions on your behalf by giving it "tools" (functions) it can call. This transforms the assistant from an advisor to an agent.

### Step 1: Define Your Toolbelt

* Create a `tools.js` module.
* Define a set of async JavaScript functions that the AI can use, for example:
    * `createTask(taskDetails)`: Adds a task to the `Tasks` tab/database.
    * `scheduleMessage(chatId, message, time)`: Schedules a message to be sent.
    * `createCalendarEvent(title, date, attendees)`: Interacts with an external calendar API.

### Step 2: Implement Function Calling Logic

* Update your `ai-service.js` to support function calling with your chosen LLM.
* When the main process receives a response from the AI that includes a function call request:
    * Parse the function name and arguments.
    * Securely execute the corresponding function from `tools.js`.
    * Send the function's output back to the AI for a final, natural language response.

### Step 3: Visualize Tool Use

* Implement the "Function Calling Transparency" feature in the Co-pilot chat UI, showing the user which tools the AI is using in real-time.

### Step 4: Build the Scheduler

* Add a `scheduled_tasks` table to your SQLite database.
* Create a simple background "ticker" process in your main Electron process that checks this table every minute.
* If a task (like a scheduled message) is due, it triggers the appropriate function in the `whatsapp-service`.

**Milestone:** Your AI assistant is now an agent. You can ask it in plain English to "remind me to call John tomorrow" or "schedule a happy birthday message to Mom," and it will execute these tasks.
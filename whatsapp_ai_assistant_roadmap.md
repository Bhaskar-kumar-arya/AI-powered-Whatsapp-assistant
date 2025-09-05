# WhatsApp AI Assistant – Updated Roadmap 🚀

---

## Prerequisites & Tools

### Software

* Python **3.8+** installed on your machine.
* Node.js **(16+)** installed (for WhatsApp API).
* VS Code (or another code editor).
* Git for version control.

### Python Libraries

* `customtkinter`: For the modern-looking GUI.
* `openai` or `google-generativeai`: To interact with the LLM.
* `sqlite3` (built-in): For local database storage.

### Node.js Libraries

* `whatsapp-web.js`: To connect with WhatsApp Web.
* `qrcode-terminal`: To display QR codes in the terminal.

### Accounts

* A WhatsApp account.
* An OpenAI or Google AI Platform account (API key required).

---

## Phase 1: The Foundation (Core WhatsApp Data Pipeline) 🧱

**Goal:** Reliably connect to WhatsApp, read messages (including old ones), and save them to a local database.

### Step 1: Node.js WhatsApp Listener

* Create a small Node.js project (`whatsapp-bot/`).
* Install dependencies:

```bash
npm install whatsapp-web.js qrcode-terminal sqlite3
```

* Write a script to:

  * Connect to WhatsApp Web.
  * Scan the QR code (displayed in terminal).
  * Listen for new messages.
  * Fetch chat history if needed.
  * Save messages to `whatsapp.db` using SQLite.

### Step 2: Database Creation

Define a `messages` table with:

* `id` (primary key)
* `chat_name`
* `sender`
* `message_content`
* `timestamp`

### Step 3: Node.js → Python Bridge

* Your Python scripts will read from the SQLite database.
* No direct communication needed yet.

**Milestone:** You can see live WhatsApp messages being saved into `whatsapp.db`.

---

## Phase 2: The Brain (AI Integration & Logic) 🧠

**Goal:** Connect your Python app to the database and use an LLM for intelligent tasks.

### Step 1: API Key Setup

* Get your API key from OpenAI or Google.
* Install Python dependencies:

```bash
pip install openai customtkinter
```

### Step 2: Simple AI Task

* Write a Python script to:

  * Fetch the last 20 messages from a chosen chat in `whatsapp.db`.
  * Format them into a clean prompt.
  * Ask the LLM to summarize the conversation.

**Milestone:** AI prints summaries of chats from your database.

---

## Phase 3: The Control Panel (GUI with CustomTkinter) 🖥️

**Goal:** Build a GUI to interact with your assistant.

### Step 1: Static UI

Build a CustomTkinter window with:

* A large text box for logs/output.
* A dropdown menu to select a chat.
* A text input field for commands.
* An **"Execute"** button.

### Step 2: Backend Integration

* Populate the dropdown with `chat_names` from `whatsapp.db`.
* When **"Execute"** is pressed:

  * Fetch chat messages.
  * Send them + your command to the LLM.
  * Display the result in the text box.

**Milestone:** You can pick a chat, run a command, and see AI output in your GUI.

---

## Phase 4: The Agent (Automation & Tools) 🚀

**Goal:** Add features where the assistant can take actions for you.

### Step 1: Define Tools

* Create `tools.py` in Python.
* Define functions like:

  * `schedule_message(contact, message, time)`
  * `calendar_event(title, date, time)`

### Step 2: Function Calling with AI

* When the LLM responds with a function call:

  * Parse the function name + arguments.
  * Call the corresponding Python function.

### Step 3: Scheduler

* Add a `scheduled_messages` table in SQLite.
* A background Python thread checks due messages.
* When a message is due → call your Node.js WhatsApp bot to send it.

### Step 4: External Integrations

* Add integrations like Google Calendar, Email, or Notes.
* Start with one API (Google Calendar).
* Expand step by step.

**Milestone:** Your AI assistant can read messages, summarize them, and also schedule tasks or send messages on your behalf.

---

## ✅ With this setup:

* Node.js (`whatsapp-web.js`) handles WhatsApp connection + database updates.
* Python handles AI + GUI + scheduling.
* Both connect through the shared SQLite database.

---

*Roadmap prepared for building a personal WhatsApp AI assistant — follow phases in order and iterate.*

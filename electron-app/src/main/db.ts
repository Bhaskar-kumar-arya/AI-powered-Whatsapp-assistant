import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// Define the path for the database in the user's app data folder
const dbDir = app.getPath('userData');
const dbPath = path.join(dbDir, 'whatsapp_data.db');

// Ensure the directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize the database connection
export const db : DatabaseType = new Database(dbPath);

// Function to create tables if they don't exist, based on your dbSchema.md
export function initializeDatabase() {
  const createChatsTable = `
    CREATE TABLE IF NOT EXISTS Chats (
      id TEXT PRIMARY KEY,
      name TEXT,
      isGroup BOOLEAN,
      unreadCount INTEGER,
      unreadMentions INTEGER,
      pinned BOOLEAN,
      muteEndTime INTEGER,
      archived BOOLEAN,
      readOnly BOOLEAN
    );
  `;

  const createContactsTable = `
    CREATE TABLE IF NOT EXISTS Contacts (
      id TEXT PRIMARY KEY,
      phoneNumber TEXT,
      name TEXT,
      notifyName TEXT,
      imgUrl TEXT,
      isBusiness BOOLEAN,
      verifiedName TEXT
    );
  `;

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS Messages (
      msgId TEXT PRIMARY KEY,
      chatId TEXT,
      fromMe BOOLEAN,
      senderId TEXT,
      timestamp INTEGER,
      contentType TEXT,
      textBody TEXT,
      media TEXT, -- Storing as JSON string
      quoted TEXT, -- Storing as JSON string
      mentions TEXT, -- Storing as JSON string
      reaction TEXT, -- Storing as JSON string
      status INTEGER,
      pushName TEXT,
      FOREIGN KEY (chatId) REFERENCES Chats(id)
    );
  `;

  // Execute all table creation statements
  db.exec(createChatsTable);
  db.exec(createContactsTable);
  db.exec(createMessagesTable);
  console.log('Database initialized successfully.');
}

// Ensure the DB is closed when the app quits
app.on('will-quit', () => {
  if (db) {
    db.close();
  }
});
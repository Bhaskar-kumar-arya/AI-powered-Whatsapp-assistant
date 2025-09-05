const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { GoogleGenAI } = require("@google/genai");
const config = require('./config');

// --- DATABASE SETUP ---
const dbPath = path.resolve(__dirname, 'whatsapp.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('Error opening database', err.message);
    console.log('Connected to the SQLite database.');
    
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT, message_id TEXT UNIQUE, chat_id TEXT,
            chat_name TEXT, sender TEXT, message_content TEXT, media_id TEXT,
            media_type TEXT, media_mime TEXT, timestamp INTEGER
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_chat_id ON messages (chat_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_sender ON messages (sender)');
        db.run('CREATE INDEX IF NOT EXISTS idx_timestamp ON messages (timestamp)');
        console.log('Database schema is ready.');
    });
});

// --- WHATSAPP CLIENT & GENAI SETUP ---
const client = new Client({ authStrategy: new LocalAuth() });
const genAI = new GoogleGenAI({ apiKey: config.apiKey });

/**
 * Initializes the WhatsApp client and sets up event listeners.
 * @param {function(string): void} onQRCode - Callback function for when a QR code is generated.
 * @param {function(object[]): void} onReady - Callback for when the client is ready, returns the list of chats.
 * @param {function(object): void} onMessage - Callback for any new incoming message.
 */
function initialize(onQRCode, onReady, onMessage) {
    console.log('Initializing WhatsApp client...');

    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true }); // Still useful for console fallback
        onQRCode(qr); // Send QR to the GUI
    });

    client.on('ready', async () => {
        console.log('Client is ready!');
        // 1. Immediately get the list of all chats for the GUI
        const chats = await client.getChats();
        onReady(chats);

        // 2. In the background, sync the most recent chats to warm up the cache
        console.log('Starting background sync for top 10 chats...');
        syncTopChats(10, 50); // Sync top 10 chats, 50 messages each
    });

    client.on('message', async (message) => {
        const savedMessage = await saveMessageToDB(message);
        if (savedMessage) {
            onMessage(savedMessage); // Notify the GUI of a new message
        }
    });

    client.initialize();
}

// --- CORE METHODS FOR GUI INTERACTION ---

/**
 * Fetches the complete list of chats directly from the client.
 * @returns {Promise<object[]>} A promise that resolves to an array of chat objects.
 */
async function getChats() {
    return await client.getChats();
}

/**
 * Syncs the history for the top N most recent chats. Designed for initial app load.
 * @param {number} chatLimit - The number of recent chats to sync (e.g., 10).
 * @param {number} messageLimit - The number of messages to fetch for each chat (e.g., 50).
 */
async function syncTopChats(chatLimit = 10, messageLimit = 50) {
    try {
        const chats = await client.getChats();
        const topChats = chats.slice(0, chatLimit);
        console.log(`Syncing history for ${topChats.length} chats.`);
        for (const chat of topChats) {
            // This is a "fire and forget" sync, no need to await each one
            syncChatHistory(chat.id._serialized, messageLimit);
        }
    } catch (err) {
        console.error('Error during top chats sync:', err);
    }
}

/**
 * Fetches the latest messages for a specific chat from WhatsApp and saves them to the DB.
 * Ideal for when a user clicks on a chat.
 * @param {string} chatId - The ID of the chat to sync (e.g., '1234567890@c.us').
 * @param {number} limit - The number of messages to fetch.
 */
async function syncChatHistory(chatId, limit = 50) {
    try {
        const chat = await client.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit });
        for (const msg of messages) {
            await saveMessageToDB(msg);
        }
        console.log(`Synced ${messages.length} messages for chat: ${chat.name || chatId}`);
    } catch (err) {
        console.error(`Error fetching history for chat ${chatId}:`, err);
    }
}

/**
 * Fetches older messages for a chat, for use with "infinite scroll".
 * @param {string} chatId - The ID of the chat.
 * @param {string} oldestMessageId - The ID of the oldest message currently displayed.
 * @param {number} limit - The number of older messages to fetch.
 */
async function fetchOlderMessages(chatId, oldestMessageId, limit = 50) {
    try {
        const chat = await client.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit, before: oldestMessageId });
        for (const msg of messages) {
            await saveMessageToDB(msg);
        }
        console.log(`Fetched ${messages.length} older messages for chat ${chatId}`);
        // The onMessage callback will notify the GUI as each message is saved.
    } catch (err) {
        console.error(`Error fetching older messages for chat ${chatId}:`, err);
    }
}

/**
 * Retrieves messages for a chat directly from the local database.
 * @param {string} chatId - The ID of the chat.
 * @param {number} limit - The max number of messages to retrieve.
 * @returns {Promise<object[]>} A promise that resolves to an array of message objects.
 */
function getMessagesFromDB(chatId, limit = 50) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ?`,
            [chatId, limit],
            (err, rows) => (err ? reject(err) : resolve(rows.reverse()))
        );
    });
}


// --- HELPER & DATA PROCESSING METHODS ---

async function saveMessageToDB(message) {
    return new Promise(async (resolve, reject) => {
        try {
            const chat = await message.getChat();
            const contact = await message.getContact();
            const messageData = {
                message_id: message.id._serialized,
                chat_id: chat.id._serialized,
                chat_name: chat.name || chat.id._serialized,
                sender: contact.pushname || message.from,
                message_content: message.body,
                media_id: message.hasMedia ? message.id._serialized : null,
                media_type: message.hasMedia ? message.type : null,
                media_mime: message.hasMedia ? (message._data?.mimetype || null) : null,
                timestamp: message.timestamp,
            };

            const stmt = db.prepare(`INSERT OR IGNORE INTO messages
                (message_id, chat_id, chat_name, sender, message_content, media_id, media_type, media_mime, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
            stmt.run(Object.values(messageData), function(err) {
                if (err) return reject(err);
                if (this.changes > 0) {
                    // Only resolve with data if it was a new message
                    resolve({ ...messageData, id: this.lastID });
                } else {
                    resolve(null); // Resolve with null if it was a duplicate
                }
            });
            stmt.finalize();
        } catch (err) {
            console.error('Failed to process and save message:', err);
            reject(err);
        }
    });
}


// (The getMediaForMessage and summarizeSender functions remain the same as the previous version)

async function getMediaForMessage(messageId) {
    // ... same as before ...
}
async function summarizeSender(senderName, limit = 20) {
    // ... same as before ...
}


module.exports = {
    initialize,
    getChats,
    getMessagesFromDB,
    syncChatHistory,
    fetchOlderMessages,
    getMediaForMessage,
    summarizeSender
};

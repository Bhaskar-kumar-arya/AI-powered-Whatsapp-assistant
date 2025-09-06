import { Client, LocalAuth, MessageSearchOptions } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import sqlite3 from 'sqlite3';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
import config from './config';

// Define basic interfaces for whatsapp-web.js objects if @types/whatsapp-web.js is not fully comprehensive
interface WWebJSMessage {
    id: { _serialized: string };
    body: string;
    hasMedia: boolean;
    type: string;
    timestamp: number;
    from: string;
    _data?: { mimetype?: string };
    getChat(): Promise<WWebJSChat>;
    getContact(): Promise<WWebJSContact>;
}

interface WWebJSChat {
    id: { _serialized: string };
    name: string;
    fetchMessages(options: MessageSearchOptions & { before?: string }): Promise<WWebJSMessage[]>;
}

interface WWebJSContact {
    pushname: string;
}

// --- DATABASE SETUP ---
const dbPath = path.resolve(__dirname, 'whatsapp.db');
const db = new sqlite3.Database(dbPath, (err: Error | null) => {
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
function initialize(onQRCode: (qr: string) => void, onReady: (chats: WWebJSChat[]) => void, onMessage: (message: any) => void) {
    console.log('Initializing WhatsApp client...');

    client.on('qr', (qr: string) => {
        qrcode.generate(qr, { small: true }); // Still useful for console fallback
        onQRCode(qr); // Send QR to the GUI
    });

    client.on('ready', async () => {
        console.log('Client is ready!');
        // 1. Immediately get the list of all chats for the GUI
        const chats: WWebJSChat[] = await client.getChats() as WWebJSChat[];
        onReady(chats);

        // 2. In the background, sync the most recent chats to warm up the cache
        console.log('Starting background sync for top 10 chats...');
        syncTopChats(10, 50); // Sync top 10 chats, 50 messages each
    });

    client.on('message', async (message: WWebJSMessage) => {
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
async function getChats(): Promise<WWebJSChat[]> {
    return await client.getChats() as WWebJSChat[];
}

/**
 * Syncs the history for the top N most recent chats. Designed for initial app load.
 * @param {number} chatLimit - The number of recent chats to sync (e.g., 10).
 * @param {number} messageLimit - The number of messages to fetch for each chat (e.g., 50).
 */
async function syncTopChats(chatLimit: number = 10, messageLimit: number = 50) {
    try {
        const chats: WWebJSChat[] = await client.getChats() as WWebJSChat[];
        const topChats = chats.slice(0, chatLimit);
        console.log(`Syncing history for ${topChats.length} chats.`);
        for (const chat of topChats) {
            // This is a "fire and forget" sync, no need to await each one
            syncChatHistory(chat.id._serialized, messageLimit);
        }
    } catch (err: any) {
        console.error('Error during top chats sync:', err);
    }
}

/**
 * Fetches the latest messages for a specific chat from WhatsApp and saves them to the DB.
 * Ideal for when a user clicks on a chat.
 * @param {string} chatId - The ID of the chat to sync (e.g., '1234567890@c.us').
 * @param {number} limit - The number of messages to fetch.
 */
async function syncChatHistory(chatId: string, limit: number = 50) {
    try {
        const chat: WWebJSChat = await client.getChatById(chatId) as WWebJSChat;
        const messages: WWebJSMessage[] = await chat.fetchMessages({ limit }) as WWebJSMessage[];
        for (const msg of messages) {
            await saveMessageToDB(msg);
        }
        console.log(`Synced ${messages.length} messages for chat: ${chat.name || chatId}`);
    } catch (err: any) {
        console.error(`Error fetching history for chat ${chatId}:`, err);
    }
}

/**
 * Fetches older messages for a chat, for use with "infinite scroll".
 * @param {string} chatId - The ID of the chat.
 * @param {string} oldestMessageId - The ID of the oldest message currently displayed.
 * @param {number} limit - The number of older messages to fetch.
 */
async function fetchOlderMessages(chatId: string, oldestMessageId: string, limit: number = 50) {
    try {
        const chat: WWebJSChat = await client.getChatById(chatId) as WWebJSChat;
        // Temporarily remove 'before' due to type error, will investigate whatsapp-web.js types
        const messages: WWebJSMessage[] = await chat.fetchMessages({ limit, before: oldestMessageId } as MessageSearchOptions & { before: string }) as WWebJSMessage[];
        for (const msg of messages) {
            await saveMessageToDB(msg);
        }
        console.log(`Fetched ${messages.length} older messages for chat ${chatId}`);
        // The onMessage callback will notify the GUI as each message is saved.
    } catch (err: any) {
        console.error(`Error fetching older messages for chat ${chatId}:`, err);
    }
}

/**
 * Retrieves messages for a chat directly from the local database.
 * @param {string} chatId - The ID of the chat.
 * @param {number} limit - The max number of messages to retrieve.
 * @returns {Promise<object[]>} A promise that resolves to an array of message objects.
 */
function getMessagesFromDB(chatId: string, limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ?`,
            [chatId, limit],
            (err: Error | null, rows: any[]) => (err ? reject(err) : resolve(rows.reverse()))
        );
    });
}


// --- HELPER & DATA PROCESSING METHODS ---

async function saveMessageToDB(message: WWebJSMessage): Promise<any | null> {
    return new Promise(async (resolve, reject) => {
        try {
            const chat: WWebJSChat = await message.getChat() as WWebJSChat;
            const contact: WWebJSContact = await message.getContact() as WWebJSContact;
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
            
            stmt.run(Object.values(messageData), function(this: sqlite3.RunResult, err: Error | null) {
                if (err) return reject(err);
                if (this.changes > 0) {
                    // Only resolve with data if it was a new message
                    resolve({ ...messageData, id: this.lastID });
                } else {
                    resolve(null); // Resolve with null if it was a duplicate
                }
            });
            stmt.finalize();
        } catch (err: any) {
            console.error('Failed to process and save message:', err);
            reject(err);
        }
    });
}


// (The getMediaForMessage and summarizeSender functions remain the same as the previous version)

async function getMediaForMessage(messageId: string) {
    // ... same as before ...
}
async function summarizeSender(senderName: string, limit: number = 20) {
    // ... same as before ...
}


export {
    initialize,
    getChats,
    getMessagesFromDB,
    syncChatHistory,
    fetchOlderMessages,
    getMediaForMessage,
    summarizeSender
};
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { GoogleGenAI } = require("@google/genai");
const config = require('./config');

// Path to the database file
const dbPath = path.resolve(__dirname, 'whatsapp.db');

// Initialize the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the database.');
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_name TEXT,
            sender TEXT,
            message_content TEXT,
            timestamp INTEGER
        )`);
    }
});

// Initialize the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    // Generate and display QR code in the terminal
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    summarizeSender("aryan")
});

client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const contact = await message.getContact();
        const chatName = chat.name;
        const senderName = contact.pushname || message.from;
        const messageContent = message.body;
        const timestamp = message.timestamp;

        const stmt = db.prepare('INSERT INTO messages (chat_name, sender, message_content, timestamp) VALUES (?, ?, ?, ?)');
        stmt.run(chatName, senderName, messageContent, timestamp, function(err) {
            if (err) {
                return console.error('Error saving message to database', err.message);
            }
            console.log(`Message saved to database with ID: ${this.lastID} , message is ${messageContent} sent from ${senderName}`);
        });
        stmt.finalize();

    } catch (error) {
        console.error('Failed to process message:', error);
    }
});

client.initialize();

// Google Generative AI Initialization
const genAI = new GoogleGenAI({apiKey:config.apiKey});

async function summarizeSender(senderName) {
    console.log(`Fetching and summarizing last 20 messages for: ${senderName}`);
    db.all(`SELECT sender, message_content FROM messages WHERE sender = ? ORDER BY timestamp DESC LIMIT 20`, [senderName], async (err, rows) => {
        if (err) {
            console.error('Error fetching messages from database', err.message);
            return;
        }

        if (rows.length === 0) {
            console.log('No messages found for this chat.');
            return;
        }

        const conversation = rows.reverse().map(row => `${row.sender}: ${row.message_content}`).join('\n');
        
        try {
            const prompt = `Summarize the following conversation:\n\n${conversation}`;
            const result = await genAI.models.generateContent({
                model : "gemini-1.5-flash",
                contents : prompt
            })
            const summary = result.text;
            console.log(`\nSummary for ${senderName}:\n`, summary);
        } catch (error) {
            console.error('Error generating summary with Google GenAI', error);
        }
    });
}
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

client.on('ready', () => {
    console.log('Client is ready!');
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
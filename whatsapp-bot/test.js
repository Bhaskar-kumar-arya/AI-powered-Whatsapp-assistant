const whatsappService = require('./index.js');

/**
 * Handles the QR code event from the service.
 * @param {string} qr - The QR code string.
 */
const handleQRCode = (qr) => {
    console.log('--- QR Code Received ---');
    console.log('Please scan the QR code printed in your terminal with the WhatsApp app on your phone.');
};

/**
 * Handles the ready event, which fires after successful login.
 * @param {object[]} chats - The initial list of all chats.
 */
const handleReady = async (chats) => {
    console.log('\n--- WhatsApp Client is Ready! ---');
    console.log(`Successfully fetched ${chats.length} chats.`);
    console.log('Here are your 5 most recent chats:');
    
    chats.slice(0, 5).forEach(chat => {
        const unreadInfo = chat.unreadCount > 0 ? `| Unread: ${chat.unreadCount}` : '';
        console.log(`- ${chat.name} ${unreadInfo}`);
    });

    if (chats.length > 0) {
        const mostRecentChat = chats[0];
        console.log(`\n--- Testing DB Fetch for: "${mostRecentChat.name}" ---`);
        try {
            const messages = await whatsappService.getMessagesFromDB(mostRecentChat.id._serialized, 10);
            if (messages.length > 0) {
                console.log(`Found ${messages.length} cached messages in the local DB.`);
            } else {
                console.log('No messages found in the local DB for this chat yet. They will appear after the background sync.');
            }
        } catch (e) {
            console.error("Error fetching messages from DB:", e);
        }

        // --- NEW TEST: Test fetching media for the latest media message ---
        console.log(`\n--- Testing Media Fetch for: "${mostRecentChat.name}" ---`);
        try {
            const recentMessages = await whatsappService.getMessagesFromDB(mostRecentChat.id._serialized, 25);
            // Find the most recent message that has media
            const latestMediaMessage = recentMessages.reverse().find(m => m.media_id);

            if (latestMediaMessage) {
                console.log(`Found a recent media message (Type: ${latestMediaMessage.media_type}). Attempting to download...`);
                const media = await whatsappService.getMediaForMessage(latestMediaMessage.message_id);
                if (media) {
                    console.log(`✅ Successfully downloaded media!`);
                    console.log(`   - MimeType: ${media.mimetype}`);
                    console.log(`   - Filename: ${media.filename || 'N/A'}`);
                    console.log(`   - Size: ~${(media.data.length * 3/4 / 1024).toFixed(2)} KB`);
                } else {
                    console.log('Could not download media for the message. It might be too old or inaccessible.');
                }
            } else {
                console.log('No recent media messages found in the last 25 messages of this chat to test downloading.');
            }
        } catch(e) {
            console.error("Error during media test:", e);
        }
    }
     console.log('\n--- Service is now listening for new messages ---');
};

/**
 * Handles new incoming messages.
 * @param {object} message - The message object saved to the database.
 */
const handleMessage = (message) => {
    console.log('\n--- ✅ New Message Received! ---');
    console.log(`From: ${message.sender}`);
    console.log(`Chat: ${message.chat_name}`);
    // IMPROVEMENT: Check if the message contains media
    if (message.media_id) {
        console.log(`Content: [MEDIA] Type: ${message.media_type}, Mime: ${message.media_mime}`);
    } else {
        console.log(`Content: "${message.message_content}"`);
    }
    console.log('--------------------------------\n');
};

// --- Start the Test ---
console.log('Starting WhatsApp service via test-runner...');
whatsappService.initialize(handleQRCode, handleReady, handleMessage);

console.log('Test runner is active. Please follow the instructions.');


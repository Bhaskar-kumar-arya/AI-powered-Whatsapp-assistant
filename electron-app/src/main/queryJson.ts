import * as fs from 'fs';
import * as path from 'path';
import { getAllChats, getAllContacts, getAllMessages } from './dbQueries';

/**
 * Exports the entire database content to a single JSON file.
 * @param {string} outputFilePath The path where the JSON file will be saved.
 */
export function exportDatabaseToJson(outputFilePath: string) {
  console.log('Starting database export to JSON...');

  try {
    // 1. Fetch all data from the database
    const chats = getAllChats();
    const contacts = getAllContacts();
    const messages = getAllMessages();

    // 2. Structure the data into a single object
    const databaseContent = {
      chats,
      contacts,
      messages,
    };

    // 3. Convert the object to a formatted JSON string
    // The `null, 2` argument makes the JSON file human-readable (pretty-printed)
    const jsonString = JSON.stringify(databaseContent, null, 2);

    // 4. Write the JSON string to the specified file
    fs.writeFileSync(outputFilePath, jsonString, 'utf-8');

    console.log(`✅ Database successfully exported to ${outputFilePath}`);
  } catch (error) {
    console.error('❌ Failed to export database to JSON:', error);
  }
}

/**
 * Exports chats with their nested messages to a single JSON file.
 * @param {string} outputFilePath The path where the JSON file will be saved.
 */
export function exportChatsWithMessagesToJson(outputFilePath: string) {
  console.log('Starting export of chats with nested messages to JSON...');

  try {
    const messages = getAllMessages()
    const chats = getAllChats()

    // Step 1: Group messages by chatId
    const messagesByChatId = {}
    messages.forEach(msg => {
      (messagesByChatId[msg.chatId ?? ""] = messagesByChatId[msg.chatId ?? ""] || []).push(msg)
    })

    // Step 2: Build structured chats
    const structuredChats = {}
    chats.forEach(chat => {
      structuredChats[chat.id] = {
        ...chat, // include all original chat properties
        messages: messagesByChatId[chat.id] || [] // attach its messages
      }
    })

    const databaseContent = {
      chats: structuredChats,
      contacts: getAllContacts(), // Include contacts as well, if desired
    };

    const jsonString = JSON.stringify(databaseContent, null, 2);
    fs.writeFileSync(outputFilePath, jsonString, 'utf-8');

    console.log(`✅ Chats with nested messages successfully exported to ${outputFilePath}`);
  } catch (error) {
    console.error('❌ Failed to export chats with nested messages to JSON:', error);
  }
}
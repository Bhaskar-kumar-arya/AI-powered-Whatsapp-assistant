import { db } from './db';
import type { NormalizedMessage } from './messageUtils';
import fs from 'fs';

// Define interfaces for the data we'll be returning.
// These should match the structure of your tables.
export interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  unreadCount: number;
  unreadMentions: number;
  pinned: boolean;
  muteEndTime: number | null;
  archived: boolean;
  readOnly: boolean;
}

export interface Contact {
  id: string;
  phoneNumber: string | null;
  name: string | null;
  notifyName: string | null;
  imgUrl: string | null;
  isBusiness: boolean;
  verifiedName: string | null;
}

/**
 * Retrieves all chats from the database.
 * @returns {Chat[]} An array of all chats.
 */
export function getAllChats(limit: number = 25): Chat[] {
  try {
    const stmt = db.prepare('SELECT * FROM Chats LIMIT ?');
    const chats = stmt.all(limit) as any[];

    // Convert database values (0/1) back to booleans
    return chats.map(chat => ({
      ...chat,
      isGroup: !!chat.isGroup,
      pinned: !!chat.pinned,
      archived: !!chat.archived,
      readOnly: !!chat.readOnly,
    }));
  } catch (error) {
    console.error('Failed to get all chats:', error);
    return [];
  }
}

/**
 * Retrieves all contacts from the database.
 * @returns {Contact[]} An array of all contacts.
 */
export function getAllContacts(): Contact[] {
  try {
    const stmt = db.prepare('SELECT * FROM Contacts ORDER BY name ASC');
    const contacts = stmt.all() as any[];

    // Convert database values (0/1) back to booleans
    return contacts.map(contact => ({
      ...contact,
      isBusiness: !!contact.isBusiness,
    }));
  } catch (error) {
    console.error('Failed to get all contacts:', error);
    return [];
  }
}

/**
 * Retrieves all messages for a specific chat, ordered by timestamp.
 * @param {string} chatId The ID of the chat to retrieve messages for.
 * @returns {NormalizedMessage[]} An array of messages for the given chat.
 */
export function getMessagesForChat(chatId: string, limit: number = 100): NormalizedMessage[] {
  try {
    const stmt = db.prepare('SELECT * FROM Messages WHERE chatId = ? ORDER BY timestamp DESC LIMIT ?');
    const messages = stmt.all(chatId, limit) as any[];

    // Convert database values back to their original types
    return messages.map(msg => {
      try {
        return {
          ...msg,
          id: msg.msgId, // Remap msgId to id for consistency
          fromMe: !!msg.fromMe,
          type: msg.contentType || 'unknown', // Ensure type is always a string
          text: msg.textBody, // Map textBody from DB to text property
          // Parse the JSON string fields back into objects
          media: JSON.parse(msg.media),
          quoted: JSON.parse(msg.quoted),
          mentions: JSON.parse(msg.mentions),
          reaction: JSON.parse(msg.reaction),
        };
      } catch (parseError) {
        console.error('Failed to parse message JSON:', parseError, msg);
        return { ...msg, fromMe: !!msg.fromMe }; // Return partially parsed message on error
      }
    }).reverse(); // Reverse to maintain ascending order after fetching with DESC LIMIT
  } catch (error) {
    console.error(`Failed to get messages for chat ${chatId}:`, error);
    return [];
  }
}

/**
 * Retrieves ALL messages from the database, ordered by timestamp.
 * @returns {NormalizedMessage[]} An array of all messages.
 */
export function getAllMessages(): NormalizedMessage[] {
  try {
    const stmt = db.prepare('SELECT * FROM Messages ORDER BY timestamp ASC');
    const messages = stmt.all() as any[];

    // Convert database values back to their original types
    return messages.map(msg => {
      try {
        return {
          ...msg,
          id: msg.msgId, // Remap msgId to id for consistency
          fromMe: !!msg.fromMe,
          type: msg.contentType || 'unknown', // Ensure type is always a string
          text: msg.textBody, // Map textBody from DB to text property
          // Parse the JSON string fields back into objects
          media: JSON.parse(msg.media),
          quoted: JSON.parse(msg.quoted),
          mentions: JSON.parse(msg.mentions),
          reaction: JSON.parse(msg.reaction),
        };
      } catch (parseError) {
        console.error('Failed to parse message JSON:', parseError, msg);
        return { ...msg, fromMe: !!msg.fromMe }; // Return partially parsed
      }
    });
  } catch (error) {
    console.error(`Failed to get all messages:`, error);
    return [];
  }
}

/**
 * Retrieves all chats and their messages from the database.
 * @returns {Chat[]} An array of all chats with their messages.
 */
export function getChatsWithMessages(): any[] {
  const chats = getAllChats(25); // Get only 25 chats
  const chatsWithMessages = chats.map(chat => {
    const messages = getMessagesForChat(chat.id, 100); // Get at most 100 messages for each chat
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    return {
      ...chat,
      messages,
      lastMessage,
    };
  });

  // try {
  //   fs.writeFileSync('chatsWithMessages.json', JSON.stringify(chatsWithMessages, null, 2));
  //   console.log('Successfully saved chats with messages to chatsWithMessages.json');
  // } catch (error) {
  //   console.error('Failed to save chats with messages to JSON file:', error);
  // }

  return chatsWithMessages;
}
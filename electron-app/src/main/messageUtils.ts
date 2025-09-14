import { proto, type WAMessage, type Chat as BaileysChat, type Contact, getContentType } from '@whiskeysockets/baileys'
import Long from 'long'
import { db } from './db' // Your database instance
import fs from 'fs';

// ...
// The NormalizedMessage interface and normalizeMessage function remain unchanged.
// ...
export interface NormalizedMessage {
    id: string | undefined
    chatId: string | undefined
    fromMe: boolean | undefined
    senderId: string | undefined
    timestamp: number
    pushName?: string | null
    status?: proto.WebMessageInfo.Status | null
    type: string | undefined
    text: string | null
    media: null | {
      url?: string | null
      directPath?: string | null
      mediaKey?: string | null
      mimetype?: string | null
      fileSize?: number | Long | null
      fileSha256?: string | null
      fileEncSha256?: string | null
      thumbnail?: string | null
      duration?: number | null
      fileName?: string | null
      isAnimated?: boolean | null
    }
    quoted: null | {
      msgId?: string | null
      senderId?: string | null
      text?: string | null
    }
    mentions?: string[]
    reaction: null | {
      emoji?: string | null
      targetMsgId?: string | null
      from?: string | null
    }
  }

  export function normalizeMessage(msg: WAMessage): NormalizedMessage {
      const {
          key: { remoteJid, fromMe, id: msgId } = {},
          message,
          messageTimestamp,
          pushName,
          status
        } = msg
        
        const contentType = getContentType(message ?? undefined)
      
        let normalized: NormalizedMessage = {
          id: msgId ?? undefined,
          chatId: remoteJid ?? undefined,
          fromMe: fromMe ?? false,
          senderId: msg.participant ?? undefined,
          timestamp: Number(messageTimestamp) || 0,
          pushName,
          status,
          type: contentType,
          text: null,
          media: null,
          quoted: null,
          mentions: [],
          reaction: null
        }
      
        if (contentType === "conversation") {
          normalized.text = message?.conversation || null
        }
      
        else if (contentType === "extendedTextMessage") {
          const ext = message?.extendedTextMessage
          normalized.text = ext?.text || null
          if (ext?.contextInfo) {
            normalized.quoted = {
              msgId: ext.contextInfo.stanzaId || null,
              senderId: ext.contextInfo.participant || null,
              text: ext.contextInfo.quotedMessage?.conversation || null
            }
            normalized.mentions = ext.contextInfo.mentionedJid || []
          }
        }
      
        else if (contentType === "imageMessage" || contentType === "videoMessage" || contentType === "documentMessage" || contentType === "stickerMessage") {
          const media = message?.[contentType] as any
          if (media) {
            normalized.text = media.caption || null
            normalized.media = {
              url: media.url || null,
              directPath: media.directPath || null,
              mediaKey: media.mediaKey?.toString("base64") || null,
              mimetype: media.mimetype || null,
              fileSize: media.fileLength || null,
              fileSha256: media.fileSha256?.toString("base64") || null,
              fileEncSha256: media.fileEncSha256?.toString("base64") || null,
              thumbnail: media.jpegThumbnail ? media.jpegThumbnail.toString("base64") : null,
              duration: media.seconds || null,
              fileName: media.fileName || null,
              isAnimated: media.isAnimated || false
            }
          }
        }
      
        else if (contentType === "audioMessage") {
          const media = message?.audioMessage as any
          if (media) {
            normalized.media = {
              url: media.url || null,
              directPath: media.directPath || null,
              mediaKey: media.mediaKey?.toString("base64") || null,
              mimetype: media.mimetype || null,
              fileSize: media.fileLength || null,
              fileSha256: media.fileSha256?.toString("base64") || null,
              fileEncSha256: media.fileEncSha256?.toString("base64") || null,
              duration: media.seconds || null
            }
          }
        }
      
        else if (contentType === "reactionMessage") {
          const react = message?.reactionMessage
          normalized.reaction = {
            emoji: react?.text || null,
            targetMsgId: react?.key?.id || null,
            from: react?.key?.participant || null
          }
        } 
        else {
          if (contentType != null && contentType != "protocolMessage") {
            // console.log("got a message of unknown content type",contentType)
          }
        }
      
        return normalized
  }

// --- REWRITTEN FUNCTION TO SAVE A SINGLE MESSAGE ---
export function saveMessage_upsert(msg: NormalizedMessage) {
  // Prepare a statement to create the chat if it doesn't exist.
  // We insert a minimal entry; more details can be filled in later by `chats.update` events.
  const chatUpsertStmt = db.prepare(`
    INSERT INTO Chats (id, name, isGroup)
    VALUES (@id, @name, @isGroup)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name WHERE name IS NULL;
  `);

  const messageUpsertStmt = db.prepare(`
    INSERT INTO Messages (msgId, chatId, fromMe, senderId, timestamp, contentType, textBody, media, quoted, mentions, reaction, status, pushName)
    VALUES (@msgId, @chatId, @fromMe, @senderId, @timestamp, @contentType, @textBody, @media, @quoted, @mentions, @reaction, @status, @pushName)
    ON CONFLICT(msgId) DO UPDATE SET
      status = excluded.status,
      reaction = excluded.reaction;
  `);

  // Use a transaction to ensure both operations succeed or fail together.
  const transaction = db.transaction((message: NormalizedMessage) => {
    // Step 1: Ensure the chat exists. If it does, this does nothing.
    if (message.chatId) {
      chatUpsertStmt.run({
        id: message.chatId,
        name: message.pushName,
        isGroup: message.chatId.endsWith('@g.us') ? 1 : 0
      });
    }
    
    // Step 2: Now it's safe to insert the message.
    messageUpsertStmt.run({
      msgId: message.id,
      chatId: message.chatId,
      fromMe: message.fromMe ? 1 : 0,
      senderId: message.senderId || message.chatId,
      timestamp: message.timestamp,
      contentType: message.type,
      textBody: message.text,
      media: JSON.stringify(message.media),
      quoted: JSON.stringify(message.quoted),
      mentions: JSON.stringify(message.mentions),
      reaction: JSON.stringify(message.reaction),
      status: message.status,
      pushName: message.pushName,
    });
  });

  try {
    if (msg.id && msg.chatId) {
        transaction(msg);
    }
  } catch (error) {
    console.error("Failed to save message to DB:", error);
  }
}

// --- saveHistoryData function remains unchanged ---
// --- REWRITTEN FUNCTION TO SAVE HISTORY DATA IN BULK ---
// --- REWRITTEN FUNCTION TO SAVE HISTORY DATA IN BULK ---
export function saveHistoryData(chats: BaileysChat[], contacts: Contact[], messages: WAMessage[]) {
  const insertChat = db.prepare(`
    INSERT INTO Chats (id, name, isGroup, unreadCount, unreadMentions, pinned, muteEndTime, archived, readOnly)
    VALUES (@id, @name, @isGroup, @unreadCount, @unreadMentions, @pinned, @muteEndTime, @archived, @readOnly)
    ON CONFLICT(id) DO UPDATE SET
      name = COALESCE(excluded.name,name),
      isGroup = excluded.isGroup,
      unreadCount = excluded.unreadCount,
      unreadMentions = excluded.unreadMentions,
      pinned = excluded.pinned,
      muteEndTime = excluded.muteEndTime,
      archived = excluded.archived,
      readOnly = excluded.readOnly
  `);

  const insertContact = db.prepare(`
    INSERT INTO Contacts (id, phoneNumber, name, notifyName, imgUrl, isBusiness, verifiedName)
    VALUES (@id, @phoneNumber, @name, @notifyName, @imgUrl, @isBusiness, @verifiedName)
    ON CONFLICT(id) DO UPDATE SET
      phoneNumber = excluded.phoneNumber,
      name = COALESCE(excluded.name,name),
      notifyName = COALESCE(excluded.notifyName,notifyName),
      imgUrl = excluded.imgUrl,
      isBusiness = excluded.isBusiness,
      verifiedName = excluded.verifiedName
  `);

  const insertMessage = db.prepare(`
    INSERT INTO Messages (msgId, chatId, fromMe, senderId, timestamp, contentType, textBody, media, quoted, mentions, reaction, status, pushName)
    VALUES (@msgId, @chatId, @fromMe, @senderId, @timestamp, @contentType, @textBody, @media, @quoted, @mentions, @reaction, @status, @pushName)
    ON CONFLICT(msgId) DO UPDATE SET
      chatId = excluded.chatId,
      fromMe = excluded.fromMe,
      senderId = excluded.senderId,
      timestamp = excluded.timestamp,
      contentType = excluded.contentType,
      textBody = excluded.textBody,
      media = excluded.media,
      quoted = excluded.quoted,
      mentions = excluded.mentions,
      reaction = excluded.reaction,
      status = excluded.status,
      pushName = excluded.pushName
  `);

  const transaction = db.transaction(() => {
    // Save chats
    for (const chat of chats) {
      insertChat.run({
        id: chat.id,
        name: chat.name || chat.username || null,
        isGroup: chat.id.endsWith('@g.us') ? 1 : 0, // FIX: Convert boolean to integer
        unreadCount: chat.unreadCount || 0,
        unreadMentions: chat.unreadMentionCount || 0,
        pinned: chat.pinned ? 1 : 0,
        muteEndTime: chat.muteEndTime || null,
        archived: chat.archived ? 1 : 0,
        readOnly: chat.readOnly ? 1 : 0
      });
    }

    // Save contacts
    for (const contact of contacts) {
      insertContact.run({
        id: contact.id,
        phoneNumber: !contact.id.endsWith('@g.us') ? contact.id.split('@')[0] : null,
        name: contact.name || null,
        notifyName: contact.notify || null,
        imgUrl: contact.imgUrl || null,
        isBusiness: contact.verifiedName != null ? 1 : 0, // FIX: Convert boolean to integer
        verifiedName: contact.verifiedName || null
      });
    }

    // Save messages
    for (const message of messages) {
      const msg = normalizeMessage(message);
      if (!msg.id) continue; // Skip messages without an ID
      insertMessage.run({
        msgId: msg.id,
        chatId: msg.chatId,
        fromMe: msg.fromMe ? 1 : 0,
        senderId: msg.senderId || msg.chatId,
        timestamp: msg.timestamp,
        contentType: msg.type,
        textBody: msg.text,
        media: JSON.stringify(msg.media),
        quoted: JSON.stringify(msg.quoted),
        mentions: JSON.stringify(msg.mentions),
        reaction: JSON.stringify(msg.reaction),
        status: msg.status || null,
        pushName: msg.pushName || null,
      });
    }
  });

  try {
    transaction();
    console.log(`History sync complete. Saved ${chats.length} chats, ${contacts.length} contacts, and ${messages.length} messages.`);
  } catch (error) {
    console.error("Failed to save history data to DB:", error);
  }

  try {
    let data : any = {
      chats : []   ,
      contacts : [],
      messages : []
    }
    if (fs.existsSync("rawData.json")) {
      data = JSON.parse(fs.readFileSync("rawData.json","utf-8"))
    }
    data.chats.push(...chats)
    data.contacts.push(...contacts)
    data.messages.push(...messages)
    fs.writeFileSync('rawData.json', JSON.stringify(data, null, 2));
    console.log('Successfully rawData.json');
  } catch (error) {
    console.error('Failed to rawData', error);
  }
        
}

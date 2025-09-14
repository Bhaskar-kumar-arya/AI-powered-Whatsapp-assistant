CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    name TEXT,
    participant TEXT,
    unreadCount INTEGER DEFAULT 0
);
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    phoneNumber TEXT,
    notify TEXT,
    imgUrl TEXT
);
| Column        | Type             | Notes                                          |
| ------------- | ---------------- | ---------------------------------------------- |
| id            | TEXT PRIMARY KEY | `msg.key.id`                                   |
| chatId        | TEXT             | FK to `chats.id`                               |
| senderId      | TEXT             | `participant` or `fromMe`                      |
| fromMe        | BOOLEAN          | 0 / 1                                          |
| timestamp     | INTEGER          | UNIX timestamp                                 |
| type          | TEXT             | conversation, imageMessage, audioMessage, etc. |
| text          | TEXT             | Message text / caption                         |
| pushName      | TEXT             | Sender push name                               |
| status        | TEXT             | delivered / read / played                      |
| quotedMsgId   | TEXT             | msgId of quoted message, if any                |
| quotedText    | TEXT             | snippet of quoted message                      |
| mentions      | TEXT             | JSON array of mentioned JIDs                   |
| reaction      | TEXT             | JSON {emoji, targetMsgId, from}                |
| mediaUrl      | TEXT             | Media CDN URL (optional)                       |
| mediaPath     | TEXT             | Local file path (optional)                     |
| mediaKey      | TEXT             | Base64 media key                               |
| mimetype      | TEXT             | image/jpeg, video/mp4, etc.                    |
| fileSize      | INTEGER          | size in bytes                                  |
| fileSha256    | TEXT             | Base64                                         |
| fileEncSha256 | TEXT             | Base64                                         |
| duration      | INTEGER          | seconds for audio/video                        |
| fileName      | TEXT             | filename for document                          |
| isAnimated    | BOOLEAN          | true for animated sticker/video                |
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    senderId TEXT,
    fromMe BOOLEAN,
    timestamp INTEGER,
    type TEXT,
    text TEXT,
    pushName TEXT,
    status TEXT,
    quotedMsgId TEXT,
    quotedText TEXT,
    mentions TEXT,
    reaction TEXT,
    mediaUrl TEXT,
    mediaPath TEXT,
    mediaKey TEXT,
    mimetype TEXT,
    fileSize INTEGER,
    fileSha256 TEXT,
    fileEncSha256 TEXT,
    duration INTEGER,
    fileName TEXT,
    isAnimated BOOLEAN,
    FOREIGN KEY (chatId) REFERENCES chats(id)
);
Notes:

mentions and reaction can be stored as JSON text for simplicity.

mediaPath can store the local file path if you download media.

quotedMsgId links to the message being replied to.

If you want multiple reactions per message instead of JSON:

CREATE TABLE reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    messageId TEXT,
    emoji TEXT,
    fromId TEXT,
    FOREIGN KEY (messageId) REFERENCES messages(id)
);

If you want to manage downloaded media separately:

CREATE TABLE media (
    id TEXT PRIMARY KEY,
    msgId TEXT,
    type TEXT,
    url TEXT,
    localPath TEXT,
    mediaKey TEXT,
    mimetype TEXT,
    fileSize INTEGER,
    fileSha256 TEXT,
    fileEncSha256 TEXT,
    duration INTEGER,
    fileName TEXT,
    isAnimated BOOLEAN,
    FOREIGN KEY (msgId) REFERENCES messages(id)
);
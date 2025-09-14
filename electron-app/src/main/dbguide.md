Baileys History Sync Data Structure

When Baileys performs a history sync (via the sock.ev.on('messaging-history.set', …) event), it delivers three arrays of data: chats, contacts, and messages
baileys.wiki
. Each Chat object (a Baileys Chat/IConversation) contains metadata about a conversation; each Contact object contains user info (JID, name, number, etc.); and each Message (WAMessage/IWebMessageInfo) contains a message’s content and metadata
baileys.wiki
. You should iterate over these arrays and store or update your database accordingly. The arrays are typically sorted in reverse-chronological order (newest chats first), but you can re-sort as needed for display.

Chats (Conversations and Metadata)

Each Chat (Baileys Chat type) represents a WhatsApp conversation (one-on-one or group). Important fields include:

id (string) – the chat’s JID (e.g. "1234@s.whatsapp.net" for individual chats or "5678-xxxx@g.us" for groups)
baileys.wiki
.

name or displayName (string, optional) – the chat title or contact name. For groups this is the group subject; for individual chats it is the saved contact name
baileys.wiki
.

unreadCount (number) – how many unread messages in this chat
baileys.wiki
.

unreadMentionCount (number) – count of unread messages that mention you
baileys.wiki
.

pinned (number or boolean) – if the chat is pinned. (Baileys shows a numeric “pin order” when pinned)
baileys.wiki
.

muteEndTime (timestamp) – when a mute (silence) ends, if the chat is muted
baileys.wiki
.

archived (boolean) – whether the chat is archived (hidden)
baileys.wiki
.

readOnly (boolean) – if you cannot send messages in this chat (e.g. a broadcast)
baileys.wiki
.

participants (array) – for groups, a list of IGroupParticipant objects (admin status, etc.)
baileys.wiki
. (Baileys may supply group metadata via separate events or queries as well.)

These fields come from the WhatsApp-protocol Conversation structure. For example, chat.id and chat.unreadCount appear as shown in the Baileys API docs
baileys.wiki
baileys.wiki
. You should extract and store at least the chat ID, title/name, unread counts, pinned/mute/archived flags, and whether it’s a group or not. In a database, you might model a Chats table like:

Chats (
  id           TEXT PRIMARY KEY,    -- chat JID
  name         TEXT,               -- chat title (group subject or contact name)
  isGroup      BOOL,               -- true if JID is a group
  unreadCount  INTEGER,
  unreadMentions INTEGER,
  pinned       BOOL,
  muteEndTime  INTEGER,            -- timestamp or null
  archived     BOOL,
  readOnly     BOOL,
  -- ... other flags ...
);


You can use chat.id as the primary key. Ensure to normalize the JID format (e.g. use the full JID including device if present). For group chats, you may also store a separate GroupParticipants table, or fetch group metadata via groupMetadata.

Messages (Content, Media, Context)

Each Message in history sync is a WAMessage (IWebMessageInfo). Key parts to extract and store include:

message.key – an object with { id, remoteJid, fromMe, participant }. Here id is the unique message ID, remoteJid is the chat JID, fromMe indicates if it was sent by your account, and (for groups) participant is the actual sender’s JID
baileys.wiki
. These form the message’s identity.

message.messageTimestamp – the Unix timestamp of when WhatsApp received/sent the message
baileys.wiki
.

message.message – the actual content (IMessage), which can be one of many types (text, image, video, document, reaction, etc.)
baileys.wiki
. Inside this field, the specific message body is nested (e.g. extendedTextMessage.text for text, or imageMessage.fileSha256 for an image’s metadata).

message.pushName – the sender’s push (display) name at time of send
baileys.wiki
.

message.status – message status flag (e.g. WAMessageStatus.READ if it’s a “read” receipt)
baileys.wiki
.

message.reactions – an array of reaction objects if people reacted to this message
baileys.wiki
.

Context Info (quoted replies, mentions, etc.) – inside message.message or message.messageContextInfo, WhatsApp includes any quoted reply (the original message ID and snippet) and mentions. For example, an extendedTextMessage may have .contextInfo.quotedMessage and .contextInfo.mentionedJid.

Media fields – if the message is a media type (image, video, audio, document, sticker), message.message will include fields like url, directPath, mediaKey, etc. Baileys provides helper functions (e.g. downloadMediaMessage) to fetch and decrypt the media using these fields
npmjs.com
.

A concise table of important WAMessage fields:

Field	Type	Description
key.id	string	Unique message ID.
key.remoteJid	string	Chat JID (same as chat.id)
baileys.wiki
.
key.fromMe	boolean	true if sent by our account.
key.participant	string (JID)	Sender’s JID (for groups)
baileys.wiki
.
messageTimestamp	number	Message timestamp (server time)
baileys.wiki
.
message	object (IMessage)	Message content (text, media, etc.)
baileys.wiki
.
pushName	string (optional)	Sender’s name shown.
status	enum (WAMessageStatus)	Status such as PENDING, DELIVERED, READ
baileys.wiki
.
reactions	IReaction[] (optional)	List of reactions to the message
baileys.wiki
.
If media:		
– message.xMessage	object	Media metadata (e.g. imageMessage, videoMessage).
– mediaData	IMediaData (optional)	Encrypted media info (URL, key) for downloading.

In your application, you should normalize each message when storing: e.g. extract the text (if text), or note the media type and URL (if media). Use the combination of key.id and key.remoteJid as a unique key to deduplicate messages (history sync may overlap). Always sort messages by messageTimestamp ascending when displaying a chat thread. For media messages, use Baileys’ downloadMediaMessage (or getContentType) to fetch the actual bytes
npmjs.com
; then store or cache the resulting file/URL. For example:

const contentType = getContentType(msg) // e.g. 'imageMessage'
if (contentType === 'imageMessage' || contentType === 'videoMessage') {
  const stream = await downloadMediaMessage(msg, 'stream')
  // save stream to file or buffer
}

Contacts (User Information)

The history sync also includes a Contact[] array with basic info on each participant. Important contact fields (Baileys Contact type) include
baileys.wiki
baileys.wiki
:

id (string) – the user’s JID (possibly in “lid” format, e.g. "1234@s.whatsapp.net")
baileys.wiki
.

phoneNumber (string) – the user’s phone JID (same as id for one-on-one chats)
baileys.wiki
.

name (string) – your saved name for this contact (if any)
baileys.wiki
.

notify (string) – the contact’s own “about” or “notify” name they set for themselves
baileys.wiki
.

imgUrl (string, optional) – status of the profile photo: "changed" if a new photo exists, null for default photo, or an actual URL to fetch
baileys.wiki
.

status (string, optional) – the “about” text shown by user
baileys.wiki
.

verifiedName (string, optional) – any verified business name.

id is usually enough to identify the contact in your DB (you may store their phone number and display name). For example, a Contacts table might look like:

Contacts (
  id           TEXT PRIMARY KEY,   -- contact JID
  phoneNumber  TEXT,               -- numeric phone ID (e.g. "1234@s.whatsapp.net")
  name         TEXT,               -- our saved name
  notifyName   TEXT,               -- contact’s own name/“about”
  imgUrl       TEXT,               -- URL to profile picture
  isBusiness   BOOL,
  verifiedName TEXT,
  -- ... etc ...
);


Update your contacts store on history sync. In addition, Baileys will emit contacts.update events (with partial Contact info) whenever a contact’s profile (name, status, photo) changes. Listen for sock.ev.on('contacts.update', updates => { … }) to keep the database in sync
baileys.wiki
.

Database Schema & Parsing Best Practices

Normalize Message Records: Store each message with its unique key (key.id + chat ID). Use fields like fromMe, senderId, timestamp, type, body/text, mediaInfo, quotedMsgId, status etc. A Messages table example:

Messages (
  msgId        TEXT PRIMARY KEY,  -- message ID (key.id)
  chatId       TEXT,              -- chat JID (FK to Chats.id)
  fromMe       BOOL,
  senderId     TEXT,              -- sender JID (for group or contact)
  timestamp    INTEGER,           -- messageTimestamp
  contentType  TEXT,              -- e.g. 'text', 'image', ...
  textBody     TEXT,              -- text or caption (if any)
  mediaUrl     TEXT,              -- encrypted URL for media (to use with download)
  mediaKey     TEXT,              -- optional key for decryption
  quotedMsgId  TEXT,              -- if this is a reply, the quoted message’s ID
  status       TEXT,              -- e.g. 'delivered', 'read'
  -- foreign key (chatId) references Chats(id), etc.
);


Always check for existing msgId before insert to avoid duplicates. After initial sync, new messages come via messages.upsert events.

Chronological Sorting: Even though Baileys may deliver chats or messages in reverse order, always sort messages by ascending timestamp before display. For group chats, also ensure ordering by timestamp because different participants send at overlapping times.

Deduplication: If history sync or message upserts include the same message twice (e.g. multi-device), ignore duplicates by primary-key constraint (or by checking (msgId, chatId) uniqueness).

Media Handling: Use Baileys helpers to fetch media. When you encounter a media message, call downloadMediaMessage(msg, 'buffer') or stream and save the file. Store local paths or final URLs in your DB so you can display images/videos in your app
npmjs.com
. Update any expired media by using sock.updateMediaMessage(msg) when needed (Baileys can re-request deleted media)
npmjs.com
.

Handling Updates (Status, Presence, Profile Changes)

After the initial sync, WhatsApp updates arrive via Baileys events. Handle these to keep your data fresh:

New Messages: sock.ev.on('messages.upsert', …) provides incoming (or outgoing) messages. Insert new records just like above.

Message Status Updates: Baileys emits messages.update events with WAMessageUpdate[] when a message’s status changes (e.g. sent ➔ delivered ➔ read)
baileys.wiki
. Each update has key (message ID) and a partial update object. For example, a “read” receipt might come with update.status = WAMessageStatus.READ. Apply these to your database (set the message’s status or read timestamp).

Contacts/Profile Changes: sock.ev.on('contacts.update', updates => …) provides Partial<Contact>[]
baileys.wiki
. Update any changed fields (name, notify name, photo status) in your Contacts table. You can also proactively fetch a new profile picture URL using sock.profilePictureUrl(jid, 'image') if imgUrl is "changed".

Presence Updates: sock.ev.on('presence.update', { id: jid, presences, isOnline } => …). This shows if a user is online, typing, etc. (Note: presence events must be subscribed to per chat with sock.presenceSubscribe(jid)). Update a last-seen or online status field in your Contacts or Chats database as needed.

Chat Changes: Similarly, Baileys emits chats.upsert (new chats) and chats.update (metadata changes like archival) if a chat is created or modified. Update your Chats table accordingly.
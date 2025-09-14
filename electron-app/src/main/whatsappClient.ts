import { Boom } from '@hapi/boom'
import { NodeCache } from '@cacheable/node-cache'
import readline from 'readline'
import { makeWASocket, type AnyMessageContent, BinaryInfo, Browsers, type CacheStore, delay, DisconnectReason, downloadAndProcessHistorySyncNotification, encodeWAM, fetchLatestBaileysVersion, getAggregateVotesInPollMessage, getHistoryMsg, isJidNewsletter, jidDecode, makeCacheableSignalKeyStore, normalizeMessageContent, type PatchedMessageWithRecipientJID, proto, useMultiFileAuthState, type WAMessageContent, type WAMessageKey, type Chat as BaileysChat, type Contact, getContentType } from '@whiskeysockets/baileys'
//import MAIN_LOGGER from '../src/Utils/logger'
import fs from 'fs'
import { saveMessage_upsert, saveHistoryData, normalizeMessage, NormalizedMessage } from './messageUtils'
import P from 'pino'
import qrcode from 'qrcode'
import { BrowserWindow } from 'electron'
import { WAMessage } from '@whiskeysockets/baileys'
import {exportDatabaseToJson, exportChatsWithMessagesToJson} from './queryJson'
import { getAllChats, getAllContacts, getAllMessages, getChatsWithMessages } from './dbQueries'

// exportChatsWithMessagesToJson("dbStructuredJson.json")
const logger = P({
  level: "silent",
  transport: {
    targets: [
      {
        target: "pino-pretty", // pretty-print for console
        options: { colorize: true },
        level: "info",
      },
      {
        target: "pino/file", // raw file output
        options: { destination: './wa-logs.txt' },
        level: "info",
      },
    ],
  },
})
logger.level = "silent"

const doReplies = process.argv.includes('--do-reply')
const usePairingCode = process.argv.includes('--use-pairing-code')

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache() as CacheStore

const onDemandMap = new Map<string, string>()

// Read line interface
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))

let globalSock: ReturnType<typeof makeWASocket> | undefined

// start a connection
const startSock = async(mainWindow: BrowserWindow) => {
	const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
	// fetch latest version of WA Web
	const { version, isLatest } = await fetchLatestBaileysVersion()
	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

	const sock = makeWASocket({
		version,
		logger,
		auth: {
			creds: state.creds,
			/** caching makes the store faster to send/recv messages */
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		msgRetryCounterCache,
		generateHighQualityLinkPreview: true,
		// ignore all broadcast messages -- to receive the same
		// comment the line below out
		// shouldIgnoreJid: jid => isJidBroadcast(jid),
		// implement to handle retries & poll updates
		browser: Browsers.macOS("Desktop"),
		syncFullHistory : true,
		getMessage
	})

	globalSock = sock // Assign the sock instance to globalSock

	// Pairing code for Web clients
	if (usePairingCode && !sock.authState.creds.registered) {
		// todo move to QR event
		const phoneNumber = await question('Please enter your phone number:\n')
		const code = await sock.requestPairingCode(phoneNumber)
		console.log(`Pairing code: ${code}`)
	}

	const sendMessageWTyping = async(msg: AnyMessageContent, jid: string) => {
		await sock.presenceSubscribe(jid)
		await delay(500)

		await sock.sendPresenceUpdate('composing', jid)
		await delay(2000)

		await sock.sendPresenceUpdate('paused', jid)

		await sock.sendMessage(jid, msg)
	}

	


	// the process function lets you process all events that just occurred
	// efficiently in a batch
	sock.ev.process(
		// events is a map for event name => event data
		async(events) => {
			// something about the connection changed
			// maybe it closed, or we received all offline message or connection opened
			if(events['connection.update']) {
				const update = events['connection.update']
				const { connection, lastDisconnect, qr } = update
				if(qr) {
					console.log('QR RECEIVED', qr)
					const qrCodeDataUrl = await qrcode.toDataURL(qr)
					mainWindow.webContents.send('qr-code', qrCodeDataUrl)
				}

				if(connection === 'close') {
					// reconnect if not logged out
					const reason = (lastDisconnect?.error as Boom)?.output?.statusCode
					if(reason !== DisconnectReason.loggedOut) {
						startSock(mainWindow)
						mainWindow.webContents.send('whatsapp-disconnected', `Reconnecting: ${reason}`)
					} else {
						console.log('Connection closed. You are logged out.')
						mainWindow.webContents.send('whatsapp-disconnected', 'Logged out')
					}
				} else if (connection === 'open') {
					console.log('WhatsApp client is ready!')
					mainWindow.webContents.send('whatsapp-ready')
					if (sock.authState.creds.registered) {
						mainWindow.webContents.send('whatsapp-authenticated')
					}
				}

				// WARNING: THIS WILL SEND A WAM EXAMPLE AND THIS IS A ****CAPTURED MESSAGE.****
				// DO NOT ACTUALLY ENABLE THIS UNLESS YOU MODIFIED THE FILE.JSON!!!!!
				// THE ANALYTICS IN THE FILE ARE OLD. DO NOT USE THEM.
				// YOUR APP SHOULD HAVE GLOBALS AND ANALYTICS ACCURATE TO TIME, DATE AND THE SESSION
				// THIS FILE.JSON APPROACH IS JUST AN APPROACH I USED, BE FREE TO DO THIS IN ANOTHER WAY.
				// THE FIRST EVENT CONTAINS THE CONSTANT GLOBALS, EXCEPT THE seqenceNumber(in the event) and commitTime
				// THIS INCLUDES STUFF LIKE ocVersion WHICH IS CRUCIAL FOR THE PREVENTION OF THE WARNING
				const sendWAMExample = false;
				if(connection === 'open' && sendWAMExample) {
					/// sending WAM EXAMPLE
					const {
						header: {
							wamVersion,
							eventSequenceNumber,
						},
						events,
					} = JSON.parse(await fs.promises.readFile("./boot_analytics_test.json", "utf-8"))

					const binaryInfo = new BinaryInfo({
						protocolVersion: wamVersion,
						sequence: eventSequenceNumber,
						events: events
					})

					const buffer = encodeWAM(binaryInfo);

					const result = await sock.sendWAMBuffer(buffer)
					console.log(result)
				}

				console.log('connection update', update)
			}

			// credentials updated -- save them
			if(events['creds.update']) {
				await saveCreds()
			}

			if(events['labels.association']) {
				console.log(events['labels.association'])
			}


			if(events['labels.edit']) {
				console.log(events['labels.edit'])
			}

			if(events.call) {
				console.log('recv call event', events.call)
			}

			// history received
			if(events['messaging-history.set']) {
				const { chats, contacts, messages, isLatest, progress } = events['messaging-history.set']
				console.log(`recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest}), progress : ${progress}`);
				saveHistoryData(chats, contacts, messages);
			}

			// received a new message
      if (events['messages.upsert']) {
        const upsert = events['messages.upsert']
        // console.log('recv messages ', JSON.stringify(upsert, undefined, 2))
        // if (!!upsert.requestId) {
        //   console.log("placeholder message received for request of id=" + upsert.requestId, upsert)
        // }

		
        if (upsert.type === 'notify' || upsert.type === "append") {
			for (const msg of upsert.messages) {
				const normalizedmsg: NormalizedMessage = normalizeMessage(msg)  
				const contentType = normalizedmsg.type
				console.log("got upsert message event with content type",contentType)
				if (contentType != null && contentType != "protocolMessage" && contentType != undefined ) {
					saveMessage_upsert(normalizedmsg)
					mainWindow.webContents.send('new-message', normalizedmsg.chatId, normalizedmsg)
				}
				// Emit new-message event to the renderer process
				if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
				console.log(upsert.type === "notify" ? "got new message" : "got older message")
				          	const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
				 	console.log("msg:",text,"from",msg.pushName)
				// save to json

				if (text == "requestPlaceholder" && !upsert.requestId) {
					const messageId = await sock.requestPlaceholderResend(msg.key)
					console.log('requested placeholder resync, id=', messageId)
				}
			  
              // go to an old chat and send this
              	if (text == "onDemandHistSync") {
                // const messageId = await sock.fetchMessageHistory(50, msg.key, msg.messageTimestamp!)
					const messageId = await sock.fetchMessageHistory(50, msg.key, msg.messageTimestamp!)
					console.log('requested on-demand sync, id=', messageId)
				}

              	if (!msg.key.fromMe && doReplies && !isJidNewsletter(msg.key?.remoteJid!)) {

					console.log('replying to', msg.key.remoteJid)
					await sock!.readMessages([msg.key])
					await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid!)
              }
            }
          }
        } 
		
      }

			// messages updated like status delivered, message deleted etc.
			if(events['messages.update']) {
				console.log(
					JSON.stringify(events['messages.update'], undefined, 2)
				)

				for(const { key, update } of events['messages.update']) {
					if(update.pollUpdates) {
						const pollCreation: proto.IMessage = {} // get the poll creation message somehow
						if(pollCreation) {
							console.log(
								'got poll update, aggregation: ',
								getAggregateVotesInPollMessage({
									message: pollCreation,
									pollUpdates: update.pollUpdates,
								})
							)
						}
					}
				}
			}

			if(events['message-receipt.update']) {
				console.log(events['message-receipt.update'])
			}

			if(events['messages.reaction']) {
				console.log(events['messages.reaction'])
			}

			if(events['presence.update']) {
				console.log(events['presence.update'])
			}

			if(events['chats.update']) {
				console.log(events['chats.update'])
			}

			if(events['contacts.update']) {
				for(const contact of events['contacts.update']) {
					if(typeof contact.imgUrl !== 'undefined') {
						const newUrl = contact.imgUrl === null
							? null
							: await sock!.profilePictureUrl(contact.id!).catch(() => null)
						console.log(
							`contact ${contact.id} has a new profile pic: ${newUrl}`,
						)
					}
				}
			}

			if(events['chats.delete']) {
				console.log('chats deleted ', events['chats.delete'])
			}
		}
	)

	return sock

	async function getMessage(key: WAMessageKey): Promise<WAMessageContent | undefined> {
	  // Implement a way to retreive messages that were upserted from messages.upsert
			// up to you

		// only if store is present
		return proto.Message.create({ conversation: 'test' })
	}
}

// fs.writeFileSync("dbData.json",JSON.stringify({chats : getAllChats(1000),contacts : getAllContacts(),messages : getAllMessages()},null,2))

// startSock() -- Removed as per instructions

export async function initializeWhatsappClient(mainWindow: BrowserWindow): Promise<void> {
  await startSock(mainWindow)
}

export function getWhatsappClient(): null {
  return null
}

export async function sendMessage(chatId: string, message: string): Promise<void> {
  if (!globalSock) {
    console.error('WhatsApp client not initialized. Cannot send message.');
    return;
  }
  try {
    await globalSock.sendMessage(chatId, { text: message });
    console.log(`Message sent to ${chatId}: ${message}`);
  } catch (error) {
    console.error(`Failed to send message to ${chatId}:`, error);
    throw error;
  }
}

export async function getChatsForUI(): Promise<any[]> {
  return getChatsWithMessages()
}

export async function downloadMedia(
  message: WAMessage
): Promise<{ mediaUrl: string; mediaMimeType: string } | undefined> {
  return Promise.resolve(undefined)
}

export async function getChatPictureUrl(chatId: string): Promise<string | undefined> {
  return Promise.resolve(undefined)
}
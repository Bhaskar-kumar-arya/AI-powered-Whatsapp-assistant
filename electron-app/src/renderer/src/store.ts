import { create } from 'zustand';
import { Chat as PreloadChat, Message as PreloadMessage } from '../../preload/index.d';

// Define types for your data, extending the preload types with UI-specific properties
export interface Message extends PreloadMessage {
  status?: number | null; // M0:ERROR, 1:PENDING, 2:SERVER_ACK, 3:DELIVERY_ACK, 4:READ, 5:PLAYED
  mediaBlobUrl?: string | null; // To store the object URL for display, can be null
}

export interface Chat extends PreloadChat {
  messages: Message[]; // Override messages to use the extended Message type
  aiActivity?: 'draft' | 'task-pending';
  contactName?: string; // Add contactName
}

interface AppState {
  chats: Chat[];
  activeChatId: string | null;
  theme: 'light' | 'dark';
  aiSummary: string | null; // New state for AI summary
  // Actions
  setActiveChat: (id: string) => void;
  markChatAsRead: (id: string) => void;
  updateMessageStatus: (chatId: string, messageId: string, status: number | null) => void;
  updateMessageMediaBlobUrl: (chatId: string, messageId: string, mediaBlobUrl: string) => void; // New action to update mediaBlobUrl
  toggleTheme: () => void;
  addMessage: (chatId: string, message: Message) => void; // Modified to accept a full Message object
  setAiSummary: (summary: string | null) => void; // New action to set AI summary
  setChats: (chats: Chat[]) => void; // New action to set chats
  fetchChats: () => Promise<void>; // New action to fetch chats
}

const useStore = create<AppState>((set) => ({
  chats: [], // Initial empty array for chats
  activeChatId: null,
  theme: 'light', // Default theme
  aiSummary: null, // Initial state for AI summary

  setActiveChat: (id: string) =>
    set((state) => {
      // Mark the previously active chat as read if it exists
      if (state.activeChatId) {
        const prevActiveChat = state.chats.find(chat => chat.id === state.activeChatId);
        if (prevActiveChat) {
          state.markChatAsRead(prevActiveChat.id);
        }
      }
      // Mark the newly active chat as read
      state.markChatAsRead(id);
      return { activeChatId: id };
    }),
  markChatAsRead: (id: string) =>
    set((state) => {
      const chatToMark = state.chats.find((chat) => chat.id === id);
      if (chatToMark && chatToMark.unreadCount && chatToMark.unreadCount > 0) {
        return {
          chats: state.chats.map((chat) =>
            chat.id === id ? { ...chat, unreadCount: 0 } : chat
          ),
        };
      }
      return state; // No change if chat not found or already read
    }),
  updateMessageStatus: (chatId: string, messageId: string, status: number | null) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId ? { ...message, status } : message
              ),
            }
          : chat
      ),
    })),
  updateMessageMediaBlobUrl: (chatId: string, messageId: string, mediaBlobUrl: string) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId ? { ...message, mediaBlobUrl } : message
              ),
            }
          : chat
      ),
    })),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
  addMessage: (chatId: string, message: Message) =>
    set((state) => {
      const updatedChats = state.chats.map((chat) => {
        if (chat.id === chatId) {
          // Check if the message already exists (e.g., temporary message)
          const existingMessageIndex = chat.messages.findIndex(
            (m) => m.id === message.id || (m.text === message.text && m.fromMe === message.fromMe)
          );

          let newMessages = [...chat.messages];
          if (existingMessageIndex !== -1) {
            // Replace existing message
            newMessages[existingMessageIndex] = { ...message, mediaBlobUrl: message.media?.url };
          } else {
            // Add new message
            newMessages.push({ ...message, mediaBlobUrl: message.media?.url });
          }

          const isCurrentChatActive = state.activeChatId === chatId;
          const newUnreadCount = isCurrentChatActive ? 0 : (chat.unreadCount || 0) + 1;
          return {
            ...chat,
            messages: newMessages,
            lastMessage: { ...message, mediaBlobUrl: message.media?.url },
            timestamp: message.timestamp,
            unreadCount: newUnreadCount,
          };
        }
        return chat;
      });

      const sortedChats = updatedChats.sort((a, b) => {
        const timestampA = a.lastMessage?.timestamp || 0;
        const timestampB = b.lastMessage?.timestamp || 0;
        return timestampB - timestampA;
      });

      return { chats: sortedChats };
    }),
  setAiSummary: (summary: string | null) => set(() => ({ aiSummary: summary })),
  setChats: (chats: Chat[]) => set(() => ({ chats })), // New action to set chats
  fetchChats: async () => {
    const { getChatsForUI } = await import('./api');
    const fetchedChats: PreloadChat[] = await getChatsForUI();
    const chatsWithUiState: Chat[] = fetchedChats.map(chat => ({
      ...chat,
      messages: chat.messages ? chat.messages.map(msg => ({ ...msg, status: 4, mediaBlobUrl: msg.media?.url })) : [], // Set status to 4 (READ) for existing messages
      aiActivity: undefined // Initialize aiActivity as undefined
    }));
    set(() => ({ chats: chatsWithUiState }));
  },
}));

export default useStore;
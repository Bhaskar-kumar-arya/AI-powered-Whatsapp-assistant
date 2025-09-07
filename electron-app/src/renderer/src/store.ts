import { create } from 'zustand';
import { Chat as PreloadChat, Message as PreloadMessage } from '../../preload/index.d';

// Define types for your data, extending the preload types with UI-specific properties
export interface Message extends PreloadMessage {
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'; // Crucial for ticks, now optional and includes pending/failed
}

export interface Chat extends PreloadChat {
  messages: Message[]; // Override messages to use the extended Message type
  aiActivity?: 'draft' | 'task-pending';
}

interface AppState {
  chats: Chat[];
  activeChatId: string | null;
  theme: 'light' | 'dark';
  aiSummary: string | null; // New state for AI summary
  // Actions
  setActiveChat: (id: string) => void;
  markChatAsRead: (id: string) => void;
  updateMessageStatus: (chatId: string, messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed') => void;
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
  updateMessageStatus: (chatId: string, messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed') =>
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
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
  addMessage: (chatId: string, message: Message) =>
    set((state) => {
      const updatedChats = state.chats.map((chat) => {
        if (chat.id === chatId) {
          const isCurrentChatActive = state.activeChatId === chatId;
          const newUnreadCount = isCurrentChatActive ? 0 : (chat.unreadCount || 0) + 1;
          return {
            ...chat,
            messages: [...chat.messages, message],
            lastMessage: message, // Update lastMessage with the new message
            timestamp: message.timestamp, // Update chat timestamp for sorting
            unreadCount: newUnreadCount, // Increment unread count if not active
          };
        }
        return chat;
      });

      // Re-sort chats to place the one with the latest message at the top
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
      messages: chat.messages ? chat.messages.map(msg => ({ ...msg, status: 'read' })) : [], // Initialize status for existing messages, handle undefined messages
      aiActivity: undefined // Initialize aiActivity as undefined
    }));
    set(() => ({ chats: chatsWithUiState }));
  },
}));

export default useStore;
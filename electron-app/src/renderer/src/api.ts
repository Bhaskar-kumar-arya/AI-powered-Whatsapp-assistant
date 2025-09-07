// src/renderer/api.ts

import { Message } from './store'; // Assuming Message type is defined in store.ts

// Define the structure for Chat objects with additional metadata
export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
  lastMessage: {
    id: string;
    body: string;
    timestamp: number;
    fromMe: boolean;
    hasMedia: boolean;
    hasQuotedMsg: boolean;
  } | null;
  profilePicUrl: string | undefined;
  isMuted: boolean;
  pinned: boolean;
  archived: boolean;
}

// Utility to simulate network latency
const simulateLatency = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock AI Responses (can be kept for AI summary mock)
const mockAiSummaries: { [chatId: string]: string } = {
  '1': 'This chat is a short greeting exchange between Alice and you.',
  '2': 'This chat is a brief conversation with Bob about how you are doing.',
  '3': 'This chat is about a project team meeting scheduled for 3 PM.',
};

/**
 * Fetches a list of chats from the main process.
 */
/**
 * Fetches a list of chats for the UI, including detailed metadata, from the main process.
 */
export const getChatsForUI = async (): Promise<Chat[]> => {
  await simulateLatency(); // Keep for consistent UX, remove if not needed
  const chatsWithMetadata = await window.api.whatsapp.getChatsForUI();
  return chatsWithMetadata;
};

export const fetchMoreChatAvatars = async (chatIds: string[]): Promise<{ [chatId: string]: string }> => {
  const avatars: { [chatId: string]: string } = {};
  await Promise.all(
    chatIds.map(async (chatId) => {
      const avatar = await window.api.whatsapp.getChatPictureUrl(chatId);
      if (avatar) {
        avatars[chatId] = avatar;
      }
    })
  );
  return avatars;
};

/**
 * Mocks fetching messages for a specific chat.
 */
export const getMessages = async (chatId: string): Promise<Message[]> => {
  await simulateLatency();
  // In a real scenario, you would fetch messages for the given chatId from the main process
  // For now, we'll return an empty array or a mock if needed.
  return [];
};

/**
 * Mocks an AI summary generation.
 */
export const getAiSummary = async (chatId: string): Promise<string> => {
  await simulateLatency(1500); // Longer latency for AI processing
  return mockAiSummaries[chatId] || 'No summary available for this chat.';
};

/**
 * Mocks sending a message to the Co-pilot AI and simulating tool use.
 */
export const sendCoPilotMessage = async (prompt: string): Promise<{ type: 'text' | 'tool_use', content: string | { tool: string, args: any }[] }> => {
  await simulateLatency(1000);

  if (prompt.toLowerCase().includes('summarize')) {
    // Simulate tool use for summarization
    return {
      type: 'tool_use',
      content: [{ tool: 'summarizeChat', args: { chat: 'current chat' } }]
    };
  } else if (prompt.toLowerCase().includes('task')) {
    // Simulate tool use for creating a task
    return {
      type: 'tool_use',
      content: [{ tool: 'createTask', args: { taskDetails: 'send report' } }]
    };
  } else {
    // Regular AI response
    return {
      type: 'text',
      content: `AI Mock Response to: "${prompt}". I can help with summaries or tasks!`
    };
  }
};

/**
 * Mocks creating a task.
 */
export const createTask = async (taskDetails: string): Promise<string> => {
  await simulateLatency();
  console.log('Mock: Creating task:', taskDetails);
  return `Task "${taskDetails}" created successfully.`;
};

/**
 * Mocks scheduling a message.
 */
export const scheduleMessage = async (chatId: string, message: string, time: string): Promise<string> => {
  await simulateLatency();
  console.log('Mock: Scheduling message:', { chatId, message, time });
  return `Message "${message}" scheduled for ${time} in chat ${chatId}.`;
};

/**
 * Mocks creating a calendar event.
 */
export const createCalendarEvent = async (title: string, date: string, attendees: string[]): Promise<string> => {
  await simulateLatency();
  console.log('Mock: Creating calendar event:', { title, date, attendees });
  return `Calendar event "${title}" created for ${date} with attendees ${attendees.join(', ')}.`;
};
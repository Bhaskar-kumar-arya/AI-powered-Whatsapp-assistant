// src/renderer/api.ts

import { Chat as PreloadChat, Message as PreloadMessage } from '../../preload/index.d';

// Utility to simulate network latency
const simulateLatency = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock AI Responses (can be kept for AI summary mock)
const mockAiSummaries: { [chatId: string]: string } = {
  '1': 'This chat is a short greeting exchange between Alice and you.',
  '2': 'This chat is a brief conversation with Bob about how you are doing.',
  '3': 'This chat is about a project team meeting scheduled for 3 PM.',
};

/**
 * Fetches a list of chats for the UI, including detailed metadata, from the main process.
 */
export const getChatsForUI = async (): Promise<PreloadChat[]> => {
   // Keep for consistent UX, remove if not needed
  const chatsWithMetadata = await window.api.whatsapp.getChatsForUI();
  return chatsWithMetadata;
};

export const sendMessage = async (chatId: string, message: string): Promise<void> => {
  await window.api.whatsapp.sendMessage(chatId, message);
};

export const onNewMessage = (callback: (chatId: string, message: PreloadMessage) => void): (() => void) => {
  return window.api.whatsapp.onNewMessage(callback);
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

export const downloadMedia = async (messageId: string): Promise<{ mediaBlobUrl: string; mediaMimeType: string } | undefined> => {
  const mediaData = await window.api.whatsapp.downloadMedia(messageId);
  if (mediaData && mediaData.mediaUrl) {
    // The main process now returns a data URL directly
    return { mediaBlobUrl: mediaData.mediaUrl, mediaMimeType: mediaData.mediaMimeType };
  }
  return undefined;
};

/**
 * Mocks fetching messages for a specific chat.
 */
export const getMessages = async (chatId: string): Promise<PreloadMessage[]> => {
  
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
  
  console.log('Mock: Creating task:', taskDetails);
  return `Task "${taskDetails}" created successfully.`;
};

/**
 * Mocks scheduling a message.
 */
export const scheduleMessage = async (chatId: string, message: string, time: string): Promise<string> => {
  
  console.log('Mock: Scheduling message:', { chatId, message, time });
  return `Message "${message}" scheduled for ${time} in chat ${chatId}.`;
};

/**
 * Mocks creating a calendar event.
 */
export const createCalendarEvent = async (title: string, date: string, attendees: string[]): Promise<string> => {
  
  console.log('Mock: Creating calendar event:', { title, date, attendees });
  return `Calendar event "${title}" created for ${date} with attendees ${attendees.join(', ')}.`;
};
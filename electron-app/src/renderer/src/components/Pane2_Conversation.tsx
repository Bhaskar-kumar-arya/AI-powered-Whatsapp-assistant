import React, { useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInputBox from './MessageInputBox';
import useStore from '../store';
import { getMessages } from '../api';
import { Chat, Message } from '../store'; // Import Chat and Message interfaces from the store

const Pane2_Conversation: React.FC = () => {
  const { chats, activeChatId, addMessage, setActiveChat } = useStore();
  const activeChat = chats.find((chat: Chat) => chat.id === activeChatId); // Type activeChat

  useEffect(() => {
    const fetchMessagesForActiveChat = async () => {
      if (activeChatId && activeChat && (!activeChat.messages || activeChat.messages.length === 0)) {
        const fetchedPreloadMessages = await getMessages(activeChatId);
        const fetchedMessages: Message[] = fetchedPreloadMessages.map(msg => ({
          ...msg,
          status: 'read' // Default status for fetched messages
        }));
        // Update the active chat's messages in the store
        useStore.setState((state) => ({
          chats: state.chats.map((chatItem: Chat) =>
            chatItem.id === activeChatId ? { ...chatItem, messages: fetchedMessages } : chatItem
          ),
        }));
      }
    };
    fetchMessagesForActiveChat();
  }, [activeChatId, activeChat]); // Re-fetch messages when activeChatId changes or activeChat updates

  const handleSendMessage = (text: string) => {
    if (activeChatId) {
      // The addMessage function in the store needs to be updated to handle the new Message interface
      // For now, we'll assume it can take a simple text and 'me' for sender.
      // This will be addressed in the next step when modifying the store.
      addMessage(activeChatId, text, true); // 'me' is now a boolean 'fromMe'
    }
  };

  return (
    <div className="pane2-conversation">
      <ChatHeader />
      <div className="message-list">
        {activeChat && activeChat.messages ? (
          activeChat.messages.map((message: Message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        ) : (
          <div className="no-chat-selected">Select a chat to start messaging</div>
        )}
      </div>
      <MessageInputBox onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Pane2_Conversation;
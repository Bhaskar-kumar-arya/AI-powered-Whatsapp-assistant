import React from 'react';
import useStore, { Chat } from '../store';

interface ChatListItemProps {
  chat: Chat;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat }) => {
  const activeChatId = useStore((state) => state.activeChatId);
  const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;

  return (
    <div className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}>
      <img src={chat.avatar} alt={`${chat.name}'s avatar`} className="chat-avatar" />
      <div className="chat-info">
        <div className="chat-name">{chat.name}</div>
        {lastMessage && <div className="chat-last-message">{lastMessage.text}</div>}
      </div>
      <div className="chat-meta">
        {lastMessage && <div className="chat-timestamp">{lastMessage.timestamp}</div>}
        {chat.unreadCount > 0 && <div className="chat-unread-count">{chat.unreadCount}</div>}
        {chat.aiActivity && <div className="ai-indicator">✨</div>}
      </div>
    </div>
  );
};

export default ChatListItem;
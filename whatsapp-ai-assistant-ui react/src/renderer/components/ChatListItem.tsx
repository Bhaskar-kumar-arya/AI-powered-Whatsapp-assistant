import React from 'react';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  unread: number;
  aiActivity: string | null;
}

interface ChatListItemProps {
  chat: Chat;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat }) => {
  return (
    <div className="chat-list-item">
      <img src={chat.avatar} alt={`${chat.name}'s avatar`} className="chat-avatar" />
      <div className="chat-info">
        <div className="chat-name">{chat.name}</div>
        <div className="chat-last-message">{chat.lastMessage}</div>
      </div>
      <div className="chat-meta">
        <div className="chat-timestamp">{chat.timestamp}</div>
        {chat.unread > 0 && <div className="chat-unread-count">{chat.unread}</div>}
        {chat.aiActivity && <div className="ai-indicator">✨</div>}
      </div>
    </div>
  );
};

export default ChatListItem;
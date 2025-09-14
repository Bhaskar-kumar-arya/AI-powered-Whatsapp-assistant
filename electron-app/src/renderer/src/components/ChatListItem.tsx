import React from 'react';
import useStore, { Chat } from '../store';

interface ChatListItemProps {
  chat: Chat;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat }) => {
  const activeChatId = useStore((state) => state.activeChatId);
  const { lastMessage } = chat;

  return (
    <div className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}>
      <img src={chat.profilePicUrl} alt={`${chat.name}'s avatar`} className="chat-avatar" />
      <div className="chat-info">
        <div className="chat-name">{chat.contactName || chat.name || chat.id.split('@')[0]}</div>
        {lastMessage && <div className="chat-last-message">{lastMessage.text}</div>}
      </div>
      <div className="chat-meta">
        {lastMessage && <div className="chat-timestamp">{new Date(lastMessage.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
        {chat.unreadCount > 0 && <div className="chat-unread-count">{chat.unreadCount}</div>}
        {chat.aiActivity && <div className="ai-indicator">✨</div>}
      </div>
    </div>
  );
};

export default ChatListItem;
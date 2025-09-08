import React from 'react';
import { Sparkles } from 'lucide-react';
import useStore from '../store';
import { getAiSummary } from '../api';

const ChatHeader: React.FC = () => {
  const activeChatId = useStore((state) => state.activeChatId);
  const chats = useStore((state) => state.chats);
  const setAiSummary = useStore((state) => state.setAiSummary);

  const activeChat = activeChatId ? chats.find((chat) => chat.id === activeChatId) : null;

  const handleSummarizeChat = async () => {
    if (activeChatId) {
      setAiSummary('Generating summary...'); // Set a loading state
      const summary = await getAiSummary(activeChatId);
      setAiSummary(summary);
    }
  };

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        {activeChat?.profilePicUrl && (
          <img src={activeChat.profilePicUrl} alt={`${activeChat.contactName || activeChat.name || activeChat.id}'s avatar`} className="chat-header-avatar" />
        )}
        <h3>{activeChat?.contactName || activeChat?.name || 'Select a Chat'}</h3>
      </div>
    </div>
  );
};

export default ChatHeader;
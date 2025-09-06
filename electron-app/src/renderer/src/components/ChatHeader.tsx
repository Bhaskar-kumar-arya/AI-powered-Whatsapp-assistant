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
      <h3>{activeChat?.name || 'Select a Chat'}</h3>
      <button className="summarize-button" onClick={handleSummarizeChat} disabled={!activeChatId}>
        <Sparkles size={16} /> Summarize Chat
      </button>
    </div>
  );
};

export default ChatHeader;
import React from 'react';
import { Sparkles } from 'lucide-react'; // Import Sparkles icon

const ChatHeader: React.FC = () => {
  return (
    <div className="chat-header">
      <h3>Contact Name</h3>
      <button className="summarize-button">
        <Sparkles size={16} /> Summarize Chat
      </button>
    </div>
  );
};

export default ChatHeader;
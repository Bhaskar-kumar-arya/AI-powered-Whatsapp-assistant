import React from 'react';

const ChatHeader: React.FC = () => {
  return (
    <div className="chat-header">
      <h3>Contact Name</h3>
      <button className="summarize-button">Summarize Chat</button>
    </div>
  );
};

export default ChatHeader;
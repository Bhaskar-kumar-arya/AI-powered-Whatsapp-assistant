import React from 'react';

const CoPilotView: React.FC = () => {
  return (
    <div className="co-pilot-view">
      <div className="message-list-area">
        {/* Placeholder for chat messages */}
        <p className="ai-message">✨ AI Co-pilot messages will appear here.</p>
        <p>User: Hello AI!</p>
        <p className="ai-message">✨ AI: Hello! How can I help you today?</p>
      </div>
      <div className="input-box-area">
        <input type="text" placeholder="Type your message to AI..." />
        <button>Send</button>
      </div>
    </div>
  );
};

export default CoPilotView;
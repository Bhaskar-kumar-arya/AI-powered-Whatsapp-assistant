import React, { useState } from 'react';
import { sendCoPilotMessage } from '../api';

interface CoPilotMessage {
  id: number;
  sender: 'user' | 'ai' | 'tool';
  content: string | { tool: string, args: any }[];
}

const CoPilotView: React.FC = () => {
  const [messages, setMessages] = useState<CoPilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newUserMessage: CoPilotMessage = { id: messages.length + 1, sender: 'user', content: input };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI thinking
    const thinkingMessage: CoPilotMessage = { id: messages.length + 2, sender: 'ai', content: '✨ Thinking...' };
    setMessages((prev) => [...prev, thinkingMessage]);

    const aiResponse = await sendCoPilotMessage(input);

    setMessages((prev) => prev.filter(msg => msg.id !== thinkingMessage.id)); // Remove thinking message

    if (aiResponse.type === 'tool_use') {
      const toolUseMessage: CoPilotMessage = {
        id: messages.length + 3,
        sender: 'tool',
        content: aiResponse.content,
      };
      setMessages((prev) => [...prev, toolUseMessage]);

      // Simulate tool execution and final AI response
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate tool execution time
      const finalAiResponse: CoPilotMessage = {
        id: messages.length + 4,
        sender: 'ai',
        content: `✨ Done! Executed tool(s). Final response to: "${input}".`,
      };
      setMessages((prev) => [...prev, finalAiResponse]);

    } else {
      const newAiMessage: CoPilotMessage = { id: messages.length + 3, sender: 'ai', content: aiResponse.content };
      setMessages((prev) => [...prev, newAiMessage]);
    }

    setIsLoading(false);
  };

  return (
    <div className="co-pilot-view">
      <div className="message-list-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.sender === 'tool' ? (
              <div>
                <p>✨ <strong>Thinking...</strong></p>
                {(msg.content as { tool: string, args: any }[]).map((tool, index) => (
                  <p key={index} className="tool-use-detail">
                    * Using tool: <code>{tool.tool}({JSON.stringify(tool.args)})</code>
                  </p>
                ))}
              </div>
            ) : (
              <p>{msg.sender === 'ai' ? '✨ AI: ' : 'User: '}{msg.content as string}</p>
            )}
          </div>
        ))}
      </div>
      <div className="input-box-area">
        <input
          type="text"
          placeholder="Type your message to AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              handleSendMessage();
            }
          }}
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default CoPilotView;
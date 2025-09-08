import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

// Initialize GoogleGenAI with your API key
// It's recommended to load the API key from a secure environment variable
// or a configuration file, not hardcode it directly.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY }); // Placeholder for API key

interface Message {
  role: "user" | "model";
  text: string;
}

const Pane3_AIPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessage: Message = { role: "model", text: "Hello! How can I assist you today?" };

  useEffect(() => {
    // Initialize chat with a greeting
    if (messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearChat = () => {
    setMessages([initialMessage]); // Reset to initial greeting
  };

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
      });

      const stream = await chat.sendMessageStream({
        message: userMessage.text,
      });

      let aiResponseText = "";
      for await (const chunk of stream) {
        aiResponseText += chunk.text;
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage && lastMessage.role === "model") {
            // Update the last message if it's from the model
            return prevMessages.map((msg, index) =>
              index === prevMessages.length - 1
                ? { ...msg, text: aiResponseText }
                : msg
            );
          } else {
            // Add a new message if the last one was from the user
            return [...prevMessages, { role: "model", text: aiResponseText }];
          }
        });
      }
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "model", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <div className="pane3-ai-panel">
      <div className="ai-panel-header-container">
        <h3 className="ai-panel-header">AI Copilot Chat</h3>
        <button className="clear-chat-button" onClick={clearChat} title="Clear Chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
      </div>
      <div className="ai-message-list">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`ai-message-bubble ${
              msg.role === "user" ? "user-message" : "ai-message"
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "AI"}:</strong> {msg.text}
          </div>
        ))}
        {loading && (
          <div className="ai-message-bubble ai-message">
            <strong>AI:</strong> Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="ai-input-area">
        <input
          type="text"
          className="ai-message-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <button
          className="ai-send-button"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Pane3_AIPanel;
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import useStore from '../store';
import { Chat } from '../store';
 
// Initialize GoogleGenAI with your API key
// It's recommended to load the API key from a secure environment variable
// or a configuration file, not hardcode it directly.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY }); // Placeholder for API key





const sendMessageToChatFunctionDeclaration = {
  name: 'send_message_to_chat',
  description: 'Sends a message to a specified chat ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      chat_id: {
        type: Type.STRING,
        description: 'The ID of the chat to send the message to.',
      },
      message: {
        type: Type.STRING,
        description: 'The content of the message to send.',
      },
    },
    required: ['chat_id', 'message'],
  },
};

function sendMessageToChat(chat_id, message) {
  if (window.api?.whatsapp.sendMessage) {
    window.api.whatsapp.sendMessage(chat_id, message);
    return `Message "${message}" sent to chat ID "${chat_id}".`;
  } else {
    console.error('WhatsApp API is not available to send messages.');
    return 'Error: WhatsApp API is not available.';
  }
}

const _config = {
  tools : [
    {
      functionDeclarations : [sendMessageToChatFunctionDeclaration]
    }
  ]
}
 
interface Message {
  role: "user" | "model";
  text: string;
}
 
const Pane3_AIPanel: React.FC = () => {
  const { chats, activeChatId } = useStore();
  const activeChat = chats.find((chat: Chat) => chat.id === activeChatId);
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
      const chatHistoryInstruction =
        activeChat?.messages
          ?.slice(-50) // Get only the last 50 messages
          .map(
            (msg) =>
              `${new Date(msg.timestamp * 1000).toLocaleString()} - ${
                msg.fromMe ? 'You' : activeChat.name
              }: ${msg.text}` // Assuming 'text' is the correct property for message content
          )
          .join('\n') || '';
 
      const systemInstruction = `You are integrated into WhatsApp. You are supposed to help the user of the account for this whatsapp instance. The current active chat ID is: ${activeChatId}. Here are the active chat messages:\n${chatHistoryInstruction}`;

      const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        history: messages.slice(-50).map((msg) => ({ // Get only the last 50 messages
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
        config: {
          systemInstruction: systemInstruction,
          ..._config
        },
      });
 
      const stream = await chat.sendMessageStream({
        message: userMessage.text,
      });
      
      let aiResponseText = "";
      for await (const chunk of stream) {
        if (chunk.functionCalls) {
          for (const functionCall of chunk.functionCalls) {
            if (functionCall.name === 'send_message_to_chat') {
              const args = functionCall.args as { chat_id: string; message: string };
              const toolResponse = sendMessageToChat(args.chat_id, args.message);
              setMessages((prevMessages) => [
                ...prevMessages,
                { role: "model", text: `Tool call: ${functionCall.name}(chat_id: "${args.chat_id}", message: "${args.message}")\nResult: ${toolResponse}` },
              ]);
            } 
          }
        }
        if (chunk.text) {
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
            <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
            {msg.role === 'model' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
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
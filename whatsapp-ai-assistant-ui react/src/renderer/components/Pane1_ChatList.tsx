import React from 'react';
import { chats } from '../mock-data';
import ChatListItem from './ChatListItem';

const Pane1_ChatList: React.FC = () => {
  return (
    <div className="pane1-chatlist">
      <div className="chat-list-header">
        <input type="text" placeholder="Search or start new chat" className="global-search-bar" />
        <div className="filter-buttons">
          <button className="filter-button">All</button>
          <button className="filter-button">Unread</button>
          <button className="filter-button">Groups</button>
          <button className="filter-button">AI Activity</button>
        </div>
      </div>
      <div className="chat-list-container">
        {chats.map(chat => (
          <ChatListItem key={chat.id} chat={chat} />
        ))}
      </div>
    </div>
  );
};

export default Pane1_ChatList;
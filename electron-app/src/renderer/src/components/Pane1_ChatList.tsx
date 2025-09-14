import React, { useEffect } from 'react';
import ChatListItem from './ChatListItem';
import useStore from '../store';

const Pane1_ChatList: React.FC = () => {
  const { chats, setActiveChat, fetchChats } = useStore();


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
        {chats.map((chat) => (
          <div key={chat.id} onClick={() => setActiveChat(chat.id)}>
            <ChatListItem chat={chat} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pane1_ChatList;
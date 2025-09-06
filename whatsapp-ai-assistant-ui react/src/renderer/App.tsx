import React, { useState, useEffect } from 'react';
import './App.css';
import MainLayout from './components/MainLayout';
import Pane1_ChatList from './components/Pane1_ChatList';
import Pane2_Conversation from './components/Pane2_Conversation';
import Pane3_AIPanel from './components/Pane3_AIPanel';

function App() {
  const [theme] = useState<'light' | 'dark'>('dark'); // Default to dark mode

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // No need to save to localStorage if we always default to dark
  }, [theme]);

  return (
    <div className="app-container">
      <MainLayout>
        <Pane1_ChatList />
        <Pane2_Conversation />
        <Pane3_AIPanel />
      </MainLayout>
    </div>
  );
}

export default App;

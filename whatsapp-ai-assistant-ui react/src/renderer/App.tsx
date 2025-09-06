import './App.css';
import MainLayout from './components/MainLayout';
import Pane1_ChatList from './components/Pane1_ChatList';
import Pane2_Conversation from './components/Pane2_Conversation';
import Pane3_AIPanel from './components/Pane3_AIPanel';

function App() {
  return (
    <MainLayout>
      <Pane1_ChatList />
      <Pane2_Conversation />
      <Pane3_AIPanel />
    </MainLayout>
  );
}

export default App;

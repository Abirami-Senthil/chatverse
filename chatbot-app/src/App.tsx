import React, { useState } from 'react';
import Chatbot from './components/Chatbot';
// import './App.css';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="App">
      <Chatbot isOpen={isChatOpen} toggleChat={toggleChat} />
    </div>
  );
}

export default App;

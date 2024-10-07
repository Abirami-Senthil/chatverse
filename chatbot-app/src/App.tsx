import React, { useState } from 'react';
import Chatbot from './components/Chatbot';

/**
 * App Component
 * Main component of the application that handles the state of the chatbot.
 */
function App() {
  // State to track whether the chatbot is open or closed
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Toggles the state of the chatbot between open and closed.
  const toggleChat = () => {
    try {
      setIsChatOpen((prevIsChatOpen) => !prevIsChatOpen);
    } catch (error) {
      console.error('Error toggling chat window:', error);
    }
  };

  return (
    <div className="App">
      {/* Chatbot component with its state and toggle function passed as props */}
      <Chatbot isOpen={isChatOpen} toggleChat={toggleChat} />
    </div>
  );
}

export default App;

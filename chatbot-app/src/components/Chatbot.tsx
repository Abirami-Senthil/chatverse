import React, { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import ChatWindow from './ChatWindow';

interface ChatbotProps {
  isOpen: boolean;
  toggleChat: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, toggleChat }) => {
  const [chatWindowRendered, setChatWindowRendered] = useState(false);

  /**
   * useEffect hook to handle rendering the chat window.
   * Ensures that the chat window is only rendered once when the chatbot is opened for the first time.
   */
  useEffect(() => {
    try {
      if (isOpen && !chatWindowRendered) {
        setChatWindowRendered(true);
      }
    } catch (error) {
      // Log error to the console for debugging purposes
      console.error('Error rendering chat window:', error);
    }
  }, [isOpen, chatWindowRendered]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Render the button to open the chatbot when it is not open */}
      {!isOpen && (
        <button
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out"
          onClick={() => {
            try {
              toggleChat();
            } catch (error) {
              // Log error to the console for debugging purposes
              console.error('Error toggling chat window:', error);
            }
          }}
          aria-label="Open chat"
        >
          <FiMessageCircle size={24} />
        </button>
      )}

      {/* Render the chat window if it has been rendered once and should be displayed */}
      {chatWindowRendered && (
        <div style={{ display: isOpen ? 'block' : 'none' }}>
          <ChatWindow toggleChat={toggleChat} />
        </div>
      )}

      {/* Main page content */}
      {!isOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Chatverse!</h1>
          <p className="text-lg text-gray-600 mb-8">Discover a new way to interact. Click on the blue chat icon to get started and chat with our AI assistant, Abi!</p>
          <p className="text-lg text-blue-600 font-semibold">Click the chat icon in the bottom-right corner to begin your journey!</p>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
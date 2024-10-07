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
    </div>
  );
};

export default Chatbot;

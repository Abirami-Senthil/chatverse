import React, { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import ChatWindow from './ChatWindow';

interface ChatbotProps {
  isOpen: boolean;
  toggleChat: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, toggleChat }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen && (
        <button
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out"
          onClick={toggleChat}
        >
          <FiMessageCircle size={24} />
        </button>
      )}
      {isOpen && <ChatWindow toggleChat={toggleChat} />}
    </div>
  );
};

export default Chatbot;

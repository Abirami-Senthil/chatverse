import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiEdit2, FiTrash2, FiCheck, FiSend, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { BiDockLeft, BiDockRight } from "react-icons/bi";
import { ChatController } from '../controllers/ChatController';
import AuthForm from './AuthForm';
import './ChatWindow.css';
import { ChatInfo } from '../types/api';

interface ChatWindowProps {
  toggleChat: () => void;
}

const chatController = new ChatController();

const ChatWindow: React.FC<ChatWindowProps> = ({ toggleChat }) => {
  const [messages, setMessages] = useState<
    { sender: string; text: string; interactionId: string, suggestions: string[] }[]
  >([]);
  const [input, setInput] = useState('');
  const [isEditing, setIsEditing] = useState<{ index: number | null; text: string; interactionId: string }>({ index: null, text: '', interactionId: "" });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      const fetchChats = async () => {
        try {
          const chatList = await chatController.listChats();
          if (chatList.length === 0) {
            const newChat = await chatController.createChat("1");
            setChats([{ chat_id: newChat.chat_id, chat_name: newChat.chat_name }]);
            setMessages([{ sender: 'bot', text: newChat.interaction.response, interactionId: newChat.interaction.interaction_id, suggestions: [] }]);
            setSelectedChat(newChat.chat_id);
          } else {
            setChats(chatList);
          }
        } catch (error) {
          console.error('Error fetching chats:', error);
        }
      };
      fetchChats();
    }
  }, [isAuthenticated]);

  const handleChatSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChat(event.target.value);
  };

  useEffect(() => {
    const fetchChatMessages = async () => {
      if (selectedChat) {
        try {
          const interactions = await chatController.loadChat(selectedChat);
          setMessages(interactions.flatMap((interaction: any) => {
            const expandedMessages = [];
            if (interaction.message) {
              expandedMessages.push({
                sender: 'user',
                text: interaction.message,
                interactionId: interaction.interaction_id,
                suggestions: interaction.suggestions,
              });
            }
            expandedMessages.push({
              sender: 'bot',
              text: interaction.response,
              interactionId: interaction.interaction_id,
              suggestions: interaction.suggestions,
            });
            return expandedMessages;
          }));
        } catch (error) {
          console.error('Error fetching chat messages:', error);
        }
      }
    };

    fetchChatMessages();
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthSuccess = (token: string) => {
    setIsAuthenticated(true);
    // Optionally store the token if needed for later use
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;

    // Add the user's message to the list
    setMessages([...messages, { sender: 'user', text: input, interactionId: "", suggestions: [] }]);

    // Get bot response from the server
    setTimeout(async () => {
      const interaction = await chatController.sendMessage(input);
      if (interaction) {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          // Update the user's message to include the interaction ID from the API response
          updatedMessages[updatedMessages.length - 1] = {
            sender: 'user',
            text: input,
            interactionId: interaction.interaction_id,
            suggestions: [],
          };
          // Add the bot's response to the list
          updatedMessages.push({
            sender: 'bot',
            text: interaction.response,
            interactionId: interaction.interaction_id,
            suggestions: interaction.suggestions,
          });
          return updatedMessages;
        });
      }
    }, 100);

    setInput('');
  };

  const handleEditClick = (index: number, interactionId: string) => {
    setIsEditing({ index, text: messages[index].text, interactionId });
    setTimeout(() => {
      const inputField = document.getElementById('chat-input-field') as HTMLTextAreaElement;
      if (inputField) {
        inputField.focus();
        inputField.setSelectionRange(inputField.value.length, inputField.value.length);
      }
    }, 0);
  };

  const handleEditSave = async () => {
    if (isEditing.index === null || !isEditing.interactionId) return;

    const remainingInteractions = await chatController.editMessage(isEditing.interactionId, isEditing.text);
    if (remainingInteractions) {
      setMessages(remainingInteractions.flatMap((interaction: any) => {
        const expandedMessages = [];
        if (interaction.message) {
          expandedMessages.push({
            sender: 'user',
            text: interaction.message,
            interactionId: interaction.interaction_id,
            suggestions: [],
          });
        }
        expandedMessages.push({
          sender: 'bot',
          text: interaction.response,
          interactionId: interaction.interaction_id,
          suggestions: interaction.suggestions,
        });
        return expandedMessages;
      }));
    }

    setIsEditing({ index: null, text: '', interactionId: "" });
  };

  const handleDeleteClick = async (interactionId: string) => {
    const remainingInteractions = await chatController.deleteMessage(interactionId);
    if (remainingInteractions) {
      setMessages(remainingInteractions.flatMap((interaction: any) => {
        const expandedMessages = [];
        if (interaction.message) {
          expandedMessages.push({
            sender: 'user',
            text: interaction.message,
            interactionId: interaction.interaction_id,
            suggestions: [],
          });
        }
        expandedMessages.push({
          sender: 'bot',
          text: interaction.response,
          interactionId: interaction.interaction_id,
          suggestions: interaction.suggestions,
        });
        return expandedMessages;
      }));
    }
  };

  const toggleResize = () => {
    setIsExpanded(!isExpanded);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className={`${isExpanded ? 'w-[600px] h-[800px]' : 'w-96 h-[600px]'} ${isPinned ? 'fixed bottom-20 left-5' : 'fixed bottom-20 right-5'} bg-white rounded-lg shadow-2xl flex flex-col`}>
      <div className="flex flex-col items-center justify-center p-4 mt-3 mr-2 ml-2 bg-white rounded-t-lg relative">
        <img
          src="/images/abi.jpg"
          alt="avatar"
          className="w-10 h-10 rounded-full mb-2"
        />
        <div className="text-center">
          <h4 className="text-sm font-bold">Hey 👋, I'm Abi</h4>
          <p className="text-xs text-gray-500">Ask me anything or pick a place to start</p>
        </div>
        <div className="absolute top-2 left-2 flex space-x-2">
          <button onClick={toggleResize} className="text-gray-500 hover:text-gray-800">
            {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
          <button onClick={togglePin} className="text-gray-500 hover:text-gray-800">
            {isPinned ? <BiDockRight size={16} /> : <BiDockLeft size={16} />}
          </button>
        </div>
        <button className="text-gray-500 absolute top-2 right-2" onClick={toggleChat}>
          <FiX size={20} />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index: number) => (
          <div key={index} className={`mb-2 flex items-start ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}>
            {message.sender === 'bot' && (
              <img
                src="/images/abi.jpg"
                alt="avatar"
                className="w-10 h-10 rounded-full mr-2"
              />
            )}
            {message.sender === 'user' && message.interactionId && (
              <div className={`flex space-x-1 mr-2 mt-2 ${isEditing.index !== null ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                  onClick={() => handleEditClick(index, message.interactionId)}
                  className="text-black hover:text-gray-800 rounded-full px-0.5"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteClick(message.interactionId)}
                  className="text-red-500 hover:text-red-800 rounded-full px-0.5"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            )}
            <div
              className={`inline-block px-4 py-3 relative ${message.sender === 'user' ? 'max-w-[75%] text-left' : 'max-w-full'} break-words ${message.sender === 'user' ? (isEditing.index === index ? 'bg-purple-300 text-white rounded-b-3xl rounded-tl-3xl' : 'bg-custom-purple text-white rounded-b-3xl rounded-tl-3xl') : 'bg-gray-50'}`}
            >
              {isEditing.index === index ? (
                <p className="break-words text-sm">{isEditing.text}</p>
              ) : (
                <p className="pr-8 break-words text-sm">{message.text}</p>
              )}
            </div>
            <div className="flex space-x-2 mt-2">
              {index === messages.length - 1 && message.suggestions && message.suggestions.map((suggestion, suggestionIndex) => (
                <button
                  key={suggestionIndex}
                  onClick={() => { setInput(suggestion); setTimeout(sendMessage, 0); }}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 mx-4"></div>
      <div className="p-4">
        <div className="relative flex items-center">
          <img
            src="/images/userIcon.jpg"
            alt="avatar"
            className="w-6 h-6 rounded-full mr-2"
          />
          <textarea
            id="chat-input-field"
            value={isEditing.index !== null ? isEditing.text : input}
            onChange={(e) => (isEditing.index !== null ? setIsEditing({ ...isEditing, text: e.target.value }) : setInput(e.target.value))}
            placeholder="Your question"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isEditing.index !== null) {
                  handleEditSave();
                } else {
                  sendMessage();
                }
              }
            }}
            className="w-full px-3 py-2 pr-14 border border-transparent rounded-md focus:outline-none resize-none overflow-auto"
            rows={2}
          />
          <select
            value={selectedChat}
            onChange={handleChatSelect}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
          >
            <option value="" disabled>Select a chat</option>
            {chats.map((chat) => (
              <option key={chat.chat_id} value={chat.chat_id}>
                {chat.chat_name}
              </option>
            ))}
          </select>
        </div>
        {isEditing.index !== null ? (
          <div className="flex justify-end mt-2 space-x-2 pr-4 pb-4">
            <button
              onClick={() => setIsEditing({ index: null, text: '', interactionId: '' })}
              className="text-red-600 text-xs"
            >
              <FiX size={24} />
            </button>
            <button
              onClick={handleEditSave}
              className="text-green-600 text-xs"
            >
              <FiCheck size={24} />
            </button>
          </div>
        ) : (
          <div className="flex justify-end mt-2 pr-4 pb-4">
            <button
              onClick={sendMessage}
              className="text-gray-500 text-xs rotate-45"
            >
              <FiSend size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
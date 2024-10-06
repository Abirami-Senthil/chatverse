import React, { useState, useEffect, useRef } from 'react';
import { ChatController } from '../controllers/ChatController';
import AuthForm from './AuthForm';
import './ChatWindow.css';
import { ChatInfo } from '../types/api';
import { ApiService } from '../services/ApiService';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInputArea } from './ChatInputArea';

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
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
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
    } else {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        ApiService.initialize(authToken);
        setIsAuthenticated(true);
      }
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
    localStorage.setItem('authToken', token);
  };

  const sendMessage = async (str?: string) => {
    const messageText = str || input;
    if (messageText.trim() === '') return;

    // Add the user's message to the list
    setMessages([...messages, { sender: 'user', text: messageText, interactionId: "", suggestions: [] }]);

    // Get bot response from the server
    setTimeout(async () => {
      const interaction = await chatController.sendMessage(messageText);
      if (interaction) {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          // Update the user's message to include the interaction ID from the API response
          updatedMessages[updatedMessages.length - 1] = {
            sender: 'user',
            text: messageText,
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

  const handleCreateChat = async () => {
    if (newChatName.trim() === '') {
      return;
    }
    try {
      const newChat = await chatController.createChat(newChatName);
      setChats([...chats, { chat_id: newChat.chat_id, chat_name: newChat.chat_name }]);
      setSelectedChat(newChat.chat_id);
      setNewChatName('');
      setShowCreateChat(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }

  const cancelCreateChat = () => {
    setShowCreateChat(false);
    setNewChatName('');
  }

  return (
    <div className={`${isExpanded ? 'w-[600px] h-[800px]' : 'w-96 h-[600px]'} ${isPinned ? 'fixed bottom-20 left-5' : 'fixed bottom-20 right-5'} bg-white rounded-lg shadow-2xl flex flex-col`}>
      <ChatHeader
        isExpanded={isExpanded}
        toggleResize={toggleResize}
        isPinned={isPinned}
        togglePin={togglePin}
        toggleChat={toggleChat}
      />
      <ChatMessages
        messages={messages}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        setInput={setInput}
        sendMessage={sendMessage}
        messagesEndRef={messagesEndRef}
      />
      <div className="border-t border-gray-200 mx-4"></div>
      <ChatInputArea
        input={input}
        setInput={setInput}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        handleEditSave={handleEditSave}
        sendMessage={sendMessage}
        showCreateChat={showCreateChat}
        setShowCreateChat={setShowCreateChat}
        chats={chats}
        selectedChat={selectedChat}
        handleChatSelect={handleChatSelect}
        newChatName={newChatName}
        setNewChatName={setNewChatName}
        handleCreateChat={handleCreateChat}
        cancelCreateChat={cancelCreateChat}
      />
    </div>
  );
};

export default ChatWindow;

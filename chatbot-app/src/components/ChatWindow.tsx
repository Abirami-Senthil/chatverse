import React, { useState, useEffect, useRef } from 'react';
import { ChatController } from '../controllers/ChatController';
import AuthForm from './AuthForm';
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

  /**
   * useEffect to fetch chats once the user is authenticated.
   * If no chats exist, create a default chat.
   */
  useEffect(() => {
    if (isAuthenticated) {
      const fetchChats = async () => {
        try {
          const chatList = await chatController.listChats();
          if (chatList.length === 0) {
            const newChat = await chatController.createChat("Welcome");
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

  /**
   * Handles chat selection from the dropdown.
   * @param event - The change event from the dropdown.
   */
  const handleChatSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChat(event.target.value);
  };

  /**
   * useEffect to fetch messages for the selected chat.
   * This runs every time a new chat is selected.
   */
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

  /**
   * useEffect to automatically scroll to the bottom of the chat when new messages are added.
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Scrolls to the bottom of the chat window.
   */
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Handles successful authentication by storing the token and setting the authentication state.
   * @param token - The authentication token.
   */
  const handleAuthSuccess = (token: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('authToken', token);
  };

  /**
   * Sends a message and handles bot response.
   * @param str - Optional message text to send (defaults to input state).
   */
  const sendMessage = async (str?: string) => {
    const messageText = str || input;
    if (messageText.trim() === '') return;

    try {
      // Add the user's message to the list
      setMessages([...messages, { sender: 'user', text: messageText, interactionId: "", suggestions: [] }]);

      // Get bot response from the server
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
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setInput('');
    }
  };

  /**
   * Initiates editing of a user message.
   * @param index - Index of the message in the messages array.
   * @param interactionId - Interaction ID of the message to be edited.
   */
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

  /**
   * Saves the edited message and updates the chat.
   */
  const handleEditSave = async () => {
    if (isEditing.index === null || !isEditing.interactionId) return;

    try {
      const remainingInteractions = await chatController.editMessage(isEditing.interactionId, isEditing.text);
      // Temporarily remove all messages after the edited one to give the feel of deletion
      setMessages((prevMessages) => prevMessages.slice(0, isEditing.index! + 1));
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
    } catch (error) {
      console.error('Error saving edited message:', error);
    } finally {
      setIsEditing({ index: null, text: '', interactionId: "" });
    }
  };

  /**
   * Deletes a user message.
   * @param interactionId - Interaction ID of the message to delete.
   */
  const handleDeleteClick = async (interactionId: string) => {
    try {
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
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  /**
   * Toggles the resizing state of the chat window.
   */
  const toggleResize = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * Toggles the pinning state of the chat window.
   */
  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  /**
   * Handles the creation of a new chat.
   */
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
  };

  /**
   * Cancels the creation of a new chat.
   */
  const cancelCreateChat = () => {
    setShowCreateChat(false);
    setNewChatName('');
  };

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

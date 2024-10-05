import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { ChatController } from '../controllers/ChatController';

interface ChatWindowProps {
    toggleChat: () => void;
}

const chatController = new ChatController();

const ChatWindow: React.FC<ChatWindowProps> = ({ toggleChat }) => {
    const [messages, setMessages] = useState<
        { sender: string; text: string; interactionId: string }[]
    >([]);
    const [input, setInput] = useState('');
    const [isEditing, setIsEditing] = useState<{ index: number | null; text: string; interactionId: string }>({ index: null, text: '', interactionId: "" });
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Create chat when the chatbot is opened
        const createChat = async () => {
            const firstInteraction = await chatController.createChat();
            setMessages([{ sender: 'bot', text: firstInteraction.response, interactionId: firstInteraction.interaction_id }]);
        };
        createChat();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const sendMessage = async () => {
        if (input.trim() === '') return;

        // Add the user's message to the list
        setMessages([...messages, { sender: 'user', text: input, interactionId: "" }]);

        // Get bot response from the server
        setTimeout(async () => {
            const botResponse = await chatController.sendMessage(input);
            if (botResponse) {
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    // Update the user's message to include the interaction ID from the API response
                    updatedMessages[updatedMessages.length - 1] = {
                        sender: 'user',
                        text: input,
                        interactionId: botResponse.interaction.interaction_id,
                    };
                    // Add the bot's response to the list
                    updatedMessages.push({
                        sender: 'bot',
                        text: botResponse.interaction.response,
                        interactionId: botResponse.interaction.interaction_id,
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

        const updatedInteraction = await chatController.editMessage(isEditing.interactionId, isEditing.text);
        console.log(updatedInteraction)
        if (updatedInteraction) {
            setMessages((prevMessages) => {
                debugger;
                const updatedMessages = [...prevMessages];
                updatedMessages[isEditing.index!] = { sender: 'user', text: isEditing.text, interactionId: isEditing.interactionId };
                updatedMessages[isEditing.index! + 1] = { sender: 'bot', text: updatedInteraction.interaction.response, interactionId: updatedInteraction.interaction.interaction_id };

                // Remove all messages after the new bot response
                return updatedMessages.slice(0, isEditing.index! + 2);
            });
        }

        setIsEditing({ index: null, text: '', interactionId: "" });
    };

    const handleDeleteClick = async (interactionId: string) => {
        const remainingInteractions = await chatController.deleteMessage(interactionId);
        if (remainingInteractions) {
          setMessages(remainingInteractions.remaining_interactions.flatMap((interaction: any) => {
            const expandedMessages = [];
            if (interaction.message) {
              expandedMessages.push({
                sender: 'user',
                text: interaction.message,
                interactionId: interaction.interaction_id,
              });
            }
            expandedMessages.push({
              sender: 'bot',
              text: interaction.response,
              interactionId: interaction.interaction_id,
            });
            return expandedMessages;
          }));
        }
      };
      

    return (
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-2xl fixed bottom-20 right-5 flex flex-col">
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-t-lg">
                <img
                    src="https://via.placeholder.com/40"
                    alt="avatar"
                    className="w-10 h-10 rounded-full mb-2"
                />
                <div className="text-center">
                    <h4 className="text-sm font-bold">Hey 👋, I'm Ava</h4>
                    <p className="text-xs text-gray-500">Ask me anything or pick a place to start</p>
                </div>
                <button className="text-gray-500 absolute top-2 right-2" onClick={toggleChat}>
                    <FiX size={20} />
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message, index) => (
                    <div key={index} className={`mb-2 ${message.sender === 'user' ? 'text-right text-white' : 'text-left text-black'}`}>
                        <div className={`inline-block px-4 py-3 rounded-lg relative ${message.sender === 'user' ? 'max-w-[75%] text-left' : 'max-w-full'} break-words ${message.sender === 'user' ? 'bg-purple-600' : 'bg-gray-50'}`}>
                            {isEditing.index === index ? (
                                <textarea
                                    value={isEditing.text}
                                    onChange={(e) => setIsEditing({ ...isEditing, text: e.target.value })}
                                    className="w-full break-words p-1 border rounded text-sm"
                                    disabled
                                />
                            ) : (
                                <p className="pr-8 break-words text-sm">{message.text}</p>
                            )}
                            {message.sender === 'user' && message.interactionId && (
                                <div className="absolute top-0 right-0 mt-1 flex space-x-0.5 z-10">
                                    <button onClick={() => handleEditClick(index, message.interactionId)} className="text-black hover:text-gray-800 rounded-full px-0.5">
                                        <FiEdit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteClick(message.interactionId)} className="text-red-500 hover:text-red-800 rounded-full px-0.5">
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200">
                <div className="relative">
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
                        className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        rows={2}
                    />
                    {isEditing.index !== null && (
                        <button
                            onClick={() => setIsEditing({ index: null, text: '', interactionId: '' })}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 text-xs"
                        >
                            Cancel
                        </button>
                    )}
                </div>
                {isEditing.index !== null ? (
                    <button
                        onClick={handleEditSave}
                        className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
                    >
                        Save
                    </button>
                ) : (
                    <button
                        onClick={sendMessage}
                        className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
                    >
                        Send
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;
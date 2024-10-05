import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Create chat when the chatbot is opened
        const createChat = async () => {
            const firstInteraction = await chatController.createChat();
            setMessages([{ sender: 'bot', text: firstInteraction.response, interactionId: firstInteraction.interaction_id }]);
        };
        createChat();
    }, []);

    const sendMessage = async () => {
        if (input.trim() === '') return;

        // Add the user's message to the list
        setMessages([...messages, { sender: 'user', text: input, interactionId: "" }]);

        // Get bot response from the server
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

        setInput('');
    };

    const handleEditClick = (index: number, interactionId: string) => {
        setIsEditing({ index, text: messages[index].text, interactionId });
        setTimeout(() => {
            const inputField = document.getElementById('chat-input-field') as HTMLInputElement;
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
        <div className="w-80 h-[500px] bg-white rounded-lg shadow-lg fixed bottom-20 right-5 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
                <div className="flex items-center">
                    <img
                        src="https://via.placeholder.com/40"
                        alt="avatar"
                        className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                        <h4 className="text-sm font-bold">Hey 👋, I'm Ava</h4>
                        <p className="text-xs">Ask me anything or pick a place to start</p>
                    </div>
                </div>
                <button className="text-white" onClick={toggleChat}>
                    <FiX size={20} />
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message, index) => (
                    <div key={index} className={`mb-2 ${message.sender === 'user' ? 'text-right text-gray-800' : 'text-left text-blue-600'}`}>
                        <div className="inline-block px-3 py-2 rounded-lg bg-gray-100 relative">
                            {isEditing.index === index ? (
                                <input
                                    type="text"
                                    value={isEditing.text}
                                    onChange={(e) => setIsEditing({ ...isEditing, text: e.target.value })}
                                    className="w-full p-1 border rounded"
                                    disabled
                                />
                            ) : (
                                <p>{message.text}</p>
                            )}
                            {message.sender === 'user' && message.interactionId && (
                                <div className="absolute top-0 right-0 mt-1 mr-1 flex space-x-1">
                                    <button onClick={() => handleEditClick(index, message.interactionId)} className="text-gray-500 hover:text-gray-800">
                                        <FiEdit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteClick(message.interactionId)} className="text-red-500 hover:text-red-800">
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-200">
                <input
                    id="chat-input-field"
                    type="text"
                    value={isEditing.index !== null ? isEditing.text : input}
                    onChange={(e) => (isEditing.index !== null ? setIsEditing({ ...isEditing, text: e.target.value }) : setInput(e.target.value))}
                    placeholder="Your question"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (isEditing.index !== null) {
                            handleEditSave();
                          } else {
                            sendMessage();
                          }
                        }
                      }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
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

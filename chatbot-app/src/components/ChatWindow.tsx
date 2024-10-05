import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiEdit2, FiTrash2, FiCheck, FiSend } from 'react-icons/fi';
import { ChatController } from '../controllers/ChatController';
import './ChatWindow.css';

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
                    src="/images/abi.jpg"
                    alt="avatar"
                    className="w-10 h-10 rounded-full mb-2"
                />
                <div className="text-center">
                    <h4 className="text-sm font-bold">Hey 👋, I'm Abi</h4>
                    <p className="text-xs text-gray-500">Ask me anything or pick a place to start</p>
                </div>
                <button className="text-gray-500 absolute top-2 right-2" onClick={toggleChat}>
                    <FiX size={20} />
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`mb-2 flex items-start ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
                    >
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

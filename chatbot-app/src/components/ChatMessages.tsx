import { FiEdit2, FiTrash2 } from "react-icons/fi";

export const ChatMessages: React.FC<{
    messages: { sender: string; text: string; interactionId: string, suggestions: string[] }[];
    handleEditClick: (index: number, interactionId: string) => void;
    handleDeleteClick: (interactionId: string) => void;
    isEditing: { index: number | null; text: string; interactionId: string };
    setIsEditing: (isEditing: { index: number | null; text: string; interactionId: string }) => void;
    setInput: (input: string) => void;
    sendMessage: (str?: string) => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}> = ({ messages, handleEditClick, handleDeleteClick, isEditing, setIsEditing, setInput, sendMessage, messagesEndRef }) => (
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
                    {message.sender === 'bot' && index === messages.length - 1 && message.suggestions.length > 0 && (
                        <div className="mt-2">
                            {message.suggestions.map((suggestion, suggestionIndex) => (
                                <button
                                    key={suggestionIndex}
                                    onClick={() => {
                                        setInput(suggestion);
                                        sendMessage(suggestion);
                                    }}
                                    className="bg-white border border-custom-purple text-custom-purple px-4 py-1 rounded-3xl mb-2 max-w-[90%] block text-left text-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
    </div>
);



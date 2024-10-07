import { FiEdit2, FiTrash2 } from "react-icons/fi";

/**
 * ChatMessages Component
 * Handles the display of chat messages, editing and deleting user messages, and rendering suggestions for bot messages.
 */
export const ChatMessages: React.FC<{
    messages: { sender: string; text: string; interactionId: string, suggestions: string[] }[]; // List of messages to be displayed
    handleEditClick: (index: number, interactionId: string) => void; // Function to handle editing a message
    handleDeleteClick: (interactionId: string) => void; // Function to handle deleting a message
    isEditing: { index: number | null; text: string; interactionId: string }; // State to track if a message is being edited
    setIsEditing: (isEditing: { index: number | null; text: string; interactionId: string }) => void; // Function to set editing state
    setInput: (input: string) => void; // Function to set input text
    sendMessage: (str?: string) => void; // Function to send a message
    messagesEndRef: React.RefObject<HTMLDivElement>; // Reference to the end of the messages list for auto-scrolling
}> = ({ messages, handleEditClick, handleDeleteClick, isEditing, setIsEditing, setInput, sendMessage, messagesEndRef }) => (
    <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index: number) => (
            <div key={index} className={`mb-2 flex items-start ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}>
                {/* Bot avatar image */}
                {message.sender === 'bot' && (
                    <img
                        src="/images/abi.jpg"
                        alt="avatar"
                        className="w-10 h-10 rounded-full mr-2"
                    />
                )}
                {/* Edit and delete buttons for user messages */}
                {message.sender === 'user' && message.interactionId && (
                    <div className={`flex space-x-1 mr-2 mt-2 ${isEditing.index !== null ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}>
                        {/* Button to edit a message */}
                        <button
                            onClick={() => {
                                try {
                                    handleEditClick(index, message.interactionId);
                                } catch (error) {
                                    console.error('Error initiating edit:', error);
                                }
                            }}
                            className="text-black hover:text-gray-800 rounded-full px-0.5"
                            aria-label="Edit message"
                        >
                            <FiEdit2 size={16} />
                        </button>
                        {/* Button to delete a message */}
                        <button
                            onClick={() => {
                                try {
                                    handleDeleteClick(message.interactionId);
                                } catch (error) {
                                    console.error('Error deleting message:', error);
                                }
                            }}
                            className="text-red-500 hover:text-red-800 rounded-full px-0.5"
                            aria-label="Delete message"
                        >
                            <FiTrash2 size={16} />
                        </button>
                    </div>
                )}
                {/* Message bubble */}
                <div
                    className={`inline-block px-4 py-3 relative ${message.sender === 'user' ? 'max-w-[75%] text-left' : 'max-w-full'} break-words ${message.sender === 'user' ? (isEditing.index === index ? 'bg-purple-300 text-white rounded-b-3xl rounded-tl-3xl' : 'bg-custom-purple text-white rounded-b-3xl rounded-tl-3xl') : 'bg-gray-50'}`}
                >
                    {/* Display message text or editable text input */}
                    {isEditing.index === index ? (
                        <p className="break-words text-sm">{isEditing.text}</p>
                    ) : (
                        <p className="pr-8 break-words text-sm">{message.text}</p>
                    )}
                    {/* Display suggestions for the last bot message */}
                    {message.sender === 'bot' && index === messages.length - 1 && message.suggestions.length > 0 && (
                        <div className="mt-2">
                            {message.suggestions.map((suggestion, suggestionIndex) => (
                                <button
                                    key={suggestionIndex}
                                    onClick={() => {
                                        try {
                                            setInput(suggestion);
                                            sendMessage(suggestion);
                                        } catch (error) {
                                            console.error('Error sending suggestion:', error);
                                        }
                                    }}
                                    className="bg-white border border-custom-purple text-custom-purple px-4 py-1 rounded-3xl mb-2 max-w-[90%] block text-left text-sm"
                                    aria-label="Send suggestion"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        ))}
        {/* Reference for auto-scrolling to the latest message */}
        <div ref={messagesEndRef} />
    </div>
);

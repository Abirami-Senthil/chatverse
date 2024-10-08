import { BiDockLeft, BiDockRight } from "react-icons/bi";
import { FiMaximize2, FiMinimize2, FiX } from "react-icons/fi";
import { TbLogout2 } from "react-icons/tb";

/**
 * ChatHeader Component
 * Displays the header of the chat window including avatar, greeting text, and control buttons for resizing, pinning, and closing the chat.
 */
export const ChatHeader: React.FC<{
    isExpanded: boolean; // Determines if the chat window is expanded or minimized
    toggleResize: () => void; // Function to handle resizing of the chat window
    isPinned: boolean; // Determines if the chat window is pinned to a specific side
    togglePin: () => void; // Function to handle pinning/unpinning the chat window
    toggleChat: () => void; // Function to handle opening/closing the chat window
    handleLogout: () => void; // Function to handle logout
}> = ({ isExpanded, toggleResize, isPinned, togglePin, toggleChat, handleLogout }) => (
    <div className="flex flex-col items-center justify-center p-4 mt-3 mr-2 ml-2 bg-white rounded-t-lg relative">
        {/* Avatar image */}
        <img
            src="/images/abi.jpg"
            alt="avatar"
            className="w-10 h-10 rounded-full mb-2"
        />

        {/* Greeting text */}
        <div className="text-center">
            <h4 className="text-sm font-bold">Hey 👋, I'm Abi</h4>
            <p className="text-xs text-gray-500">Ask me anything or pick a place to start</p>
        </div>

        {/* Control buttons for resizing and pinning the chat */}
        <div className="absolute top-2 left-2 flex space-x-2">
            <button onClick={toggleResize} className="text-gray-500 hover:text-gray-800" aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}>
                {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            </button>
            <button onClick={togglePin} className="text-gray-500 hover:text-gray-800" aria-label={isPinned ? 'Unpin chat' : 'Pin chat'}>
                {isPinned ? <BiDockRight size={16} /> : <BiDockLeft size={16} />}
            </button>
        </div>

        {/* Control buttons for logout and close the chat window */}
        <div className="absolute top-2 right-2 flex space-x-2">
            <button className="text-gray-500 hover:text-gray-800" onClick={handleLogout} aria-label="Logout">
                <TbLogout2 size={20} />
            </button>
            <button className="text-gray-500 hover:text-gray-800" onClick={toggleChat} aria-label="Close chat">
                <FiX size={20} />
            </button>
        </div>
    </div>
);

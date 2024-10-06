import { BiDockLeft, BiDockRight } from "react-icons/bi";
import { FiMaximize2, FiMinimize2, FiX } from "react-icons/fi";

export const ChatHeader: React.FC<{
    isExpanded: boolean;
    toggleResize: () => void;
    isPinned: boolean;
    togglePin: () => void;
    toggleChat: () => void;
}> = ({ isExpanded, toggleResize, isPinned, togglePin, toggleChat }) => (
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
);

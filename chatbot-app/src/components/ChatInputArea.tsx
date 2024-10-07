import { FiCheck, FiSend, FiX } from "react-icons/fi";
import { ChatInfo } from "../types/api";
import { RiChatNewLine } from "react-icons/ri";

export const ChatInputArea: React.FC<{
    input: string;
    setInput: (input: string) => void;
    isEditing: { index: number | null; text: string; interactionId: string };
    setIsEditing: (isEditing: { index: number | null; text: string; interactionId: string }) => void;
    handleEditSave: () => void;
    sendMessage: (str?: string) => void;
    showCreateChat: boolean;
    setShowCreateChat: (show: boolean) => void;
    chats: ChatInfo[];
    selectedChat: string;
    handleChatSelect: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    newChatName: string;
    setNewChatName: (name: string) => void;
    handleCreateChat: () => void;
    cancelCreateChat: () => void;
}> = ({
    input,
    setInput,
    isEditing,
    setIsEditing,
    handleEditSave,
    sendMessage,
    showCreateChat,
    setShowCreateChat,
    chats,
    selectedChat,
    handleChatSelect,
    newChatName,
    setNewChatName,
    handleCreateChat,
    cancelCreateChat,
}) => (
        <div className="p-4">
            {!showCreateChat && (
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
                        placeholder={selectedChat === '' ? "Select or create a new chat" : "Your question"}
                        disabled={selectedChat === ''}
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
            )}
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
                <div className="flex mt-2 pr-4 pb-4">
                    {!showCreateChat && (
                        <>
                            <span className="mt-2 text-sm text-gray-500 flex items-center pr-2">Context</span>
                            <select
                                value={selectedChat}
                                onChange={handleChatSelect}
                                className="mt-2 px-1 py-1 border border-gray-200 rounded-md focus:outline-none text-sm bg-gray-50"
                            >
                                <option value="" className="text-sm" disabled>Select a chat</option>
                                {chats.map((chat) => (
                                    <option key={chat.chat_id} value={chat.chat_id} className="text-sm">
                                        {chat.chat_name.length > 20 ? `${chat.chat_name.substring(0, 20)}...` : chat.chat_name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowCreateChat(true)}
                                className="text-blue-600 text-xs ml-4 mt-2"
                            >
                                <RiChatNewLine size={24} />
                            </button>
                            <button
                                onClick={() => sendMessage()}
                                className="mt-2 text-gray-500 text-xs rotate-45 ml-auto"
                            >
                                <FiSend size={24} />
                            </button>
                        </>
                    )}
                    {showCreateChat && (
                        <div className="w-full flex flex-row mt-2">
                            <input
                                type="text"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateChat();
                                    }
                                    if (e.key === 'Escape') {
                                        e.preventDefault();
                                        cancelCreateChat();
                                    }
                                }}
                                placeholder="Enter chat name"
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none w-full"
                            />
                            <div className="flex flex-row justify-end">
                                <button
                                    onClick={cancelCreateChat}
                                    className="text-red-600 text-xs p-2"
                                >
                                    <FiX size={24} />
                                </button>
                                <button
                                    onClick={handleCreateChat}
                                    className="text-green-600 text-xs p-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                                    disabled={newChatName.trim() === ''}
                                >
                                    <FiCheck size={24} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

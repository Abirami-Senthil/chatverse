import { ChatModel } from '../models/ChatModel';
import { CreateChatResponse } from '../types/api';
import ChatInfo from '../types/api/ChatInfo';
import Interaction from '../types/api/Interaction';

/**
 * Controller class for managing chat operations.
 */
export class ChatController {
  private readonly chatModel: ChatModel;

  /**
   * Initializes a new instance of the ChatController.
   * Sets up the ChatModel instance to interact with the backend.
   */
  constructor() {
    this.chatModel = new ChatModel();
  }

  /**
   * Creates a new chat.
   * @param {string} chatName - The name of the chat to be created.
   * @returns {Promise<CreateChatResponse>} The created chat interaction.
   * @throws Will throw an error if chat creation fails.
   */
  async createChat(chatName: string): Promise<CreateChatResponse> {
    if (!chatName.trim()) {
      throw new Error('Chat name cannot be empty');
    }
    try {
      return await this.chatModel.createChat(chatName);
    } catch (error) {
      console.error('Error creating chat:', error);
      throw new Error('Failed to create chat');
    }
  }

  /**
   * Sends a message in the chat.
   * @param {string} message - The message to send.
   * @returns {Promise<Interaction>} The result of sending the message.
   * @throws Will throw an error if sending the message fails or if the message is empty.
   */
  async sendMessage(message: string): Promise<Interaction> {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }
    try {
      return await this.chatModel.addMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Edits an existing message in the chat.
   * @param {string} interactionId - The ID of the interaction to edit.
   * @param {string} message - The new message content.
   * @returns {Promise<Interaction[]>} The updated list of interactions.
   * @throws Will throw an error if editing the message fails or if parameters are invalid.
   */
  async editMessage(interactionId: string, message: string): Promise<Interaction[]> {
    if (!interactionId.trim() || !message.trim()) {
      throw new Error('Interaction ID and message cannot be empty');
    }
    try {
      return await this.chatModel.editMessage(interactionId, message);
    } catch (error) {
      console.error('Error editing message:', error);
      throw new Error('Failed to edit message');
    }
  }

  /**
   * Deletes a message from the chat.
   * @param {string} interactionId - The ID of the interaction to delete.
   * @returns {Promise<Interaction[]>} The updated list of interactions.
   * @throws Will throw an error if deleting the message fails or if the interaction ID is invalid.
   */
  async deleteMessage(interactionId: string): Promise<Interaction[]> {
    if (!interactionId.trim()) {
      throw new Error('Interaction ID cannot be empty');
    }
    try {
      return await this.chatModel.deleteMessage(interactionId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Lists all chats.
   * @returns {Promise<ChatInfo[]>} The list of all available chats.
   * @throws Will throw an error if listing the chats fails.
   */
  async listChats(): Promise<ChatInfo[]> {
    try {
      return await ChatModel.listAllChats();
    } catch (error) {
      console.error('Error listing chats:', error);
      throw new Error('Failed to list chats');
    }
  }

  /**
   * Loads a chat by its ID.
   * @param {string} chatId - The ID of the chat to load.
   * @returns {Promise<Interaction[]>} The interactions of the loaded chat.
   * @throws Will throw an error if loading the chat fails or if the chat ID is invalid.
   */
  async loadChat(chatId: string): Promise<Interaction[]> {
    if (!chatId.trim()) {
      throw new Error('Chat ID cannot be empty');
    }
    try {
      return await this.chatModel.loadChat(chatId);
    } catch (error) {
      console.error('Error loading chat:', error);
      throw new Error('Failed to load chat');
    }
  }
}

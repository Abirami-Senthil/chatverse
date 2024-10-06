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
   */
  constructor() {
    this.chatModel = new ChatModel();
  }

  /**
   * Creates a new chat.
   * @returns {Promise<any>} The created chat interaction or undefined if an error occurs.
   */
  async createChat(chatName: string): Promise<CreateChatResponse> {
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
   * @returns {Promise<any>} The result of sending the message or undefined if an error occurs.
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
   * @returns {Promise<any>} The result of editing the message or undefined if an error occurs.
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
   * @returns {Promise<any>} The result of deleting the message or undefined if an error occurs.
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
   * @returns {Promise<any>} The result of listing the chats or undefined if an error occurs.
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
   * @returns {Promise<any>} The result of loading the chat or undefined if an error occurs.
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

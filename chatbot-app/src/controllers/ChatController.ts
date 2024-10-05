import { ChatModel } from '../models/ChatModel';
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
  async createChat(): Promise<Interaction> {
    try {
      return await this.chatModel.createChat();
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
  async editMessage(interactionId: string, message: string): Promise<Interaction> {
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
}

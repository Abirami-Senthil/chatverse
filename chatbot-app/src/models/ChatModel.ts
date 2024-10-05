import { ApiService } from '../services/ApiService';
import Interaction from '../types/api/Interaction';
import ChatIteraction from '../types/chat/Chat';

/**
 * Represents a chat model that interacts with the API service.
 */
export class ChatModel {
  private chatId: string | null = null;

  /**
   * Creates a new chat.
   * @returns {Promise<Interaction>} The created chat data.
   * @throws {Error} If chat creation fails.
   */
  async createChat(): Promise<Interaction> {
    try {
      const data = await ApiService.createChat();
      if (!data) {
        throw new Error('No data returned from API');
      }
      this.chatId = data.chat_id;
      return data.interaction;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw new Error('Failed to create chat');
    }
  }

  /**
   * Adds a message to the current chat.
   * @param {string} message - The message to add.
   * @returns {Promise<Interaction>} The result of adding the message.
   * @throws {Error} If the chat hasn't been created or if adding the message fails.
   */
  async addMessage(message: string): Promise<Interaction> {
    this.ensureChatCreated();
    try {
      const data = await ApiService.addMessage(this.chatId!, message);
      if (!data) {
        throw new Error('No data returned from API');
      }
      return data.interaction;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw new Error('Failed to add message');
    }
  }

  /**
   * Edits a message in the current chat.
   * @param {string} interactionId - The ID of the interaction to edit.
   * @param {string} message - The new message content.
   * @returns {Promise<Interaction>} The result of editing the message.
   * @throws {Error} If the chat hasn't been created or if editing the message fails.
   */
  async editMessage(interactionId: string, message: string): Promise<Interaction> {
    this.ensureChatCreated();
    try {
      const data = await ApiService.editMessage(this.chatId!, interactionId, message);
      if (!data) {
        throw new Error('No data returned from API');
      }
      return data.interaction;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw new Error('Failed to edit message');
    }
  }

  /**
   * Deletes a message from the current chat.
   * @param {string} interactionId - The ID of the interaction to delete.
   * @returns {Promise<Interaction[]>} The result of deleting the message.
   * @throws {Error} If the chat hasn't been created or if deleting the message fails.
   */
  async deleteMessage(interactionId: string): Promise<Interaction[]> {
    this.ensureChatCreated();
    try {
      const data = await ApiService.deleteMessage(this.chatId!, interactionId);
      if (!data) {
        throw new Error('No data returned from API');
      }
      return data.remaining_interactions;
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Ensures that a chat has been created before performing operations.
   * @throws {Error} If the chat hasn't been created.
   */
  private ensureChatCreated(): void {
    if (!this.chatId) {
      throw new Error("Chat hasn't been created yet.");
    }
  }
}

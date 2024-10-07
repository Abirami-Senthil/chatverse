import { ApiService } from '../services/ApiService';
import { CreateChatResponse } from '../types/api';
import ChatInfo from '../types/api/ChatInfo';
import Interaction from '../types/api/Interaction';

/**
 * Represents a chat model that interacts with the API service.
 * Handles CRUD operations for chats and messages.
 */
export class ChatModel {
  private chatId: string | null = null;

  /**
   * Creates a new chat.
   * @param {string} chatName - The name of the chat to create.
   * @returns {Promise<CreateChatResponse>} The created chat response.
   * @throws {Error} If chat creation fails.
   */
  async createChat(chatName: string): Promise<CreateChatResponse> {
    if (!chatName.trim()) {
      throw new Error('Chat name cannot be empty');
    }
    try {
      const data = await ApiService.createChat(chatName);
      if (!data) {
        throw new Error('No data returned from API');
      }
      this.chatId = data.chat_id;
      return data;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw new Error('Failed to create chat');
    }
  }

  /**
   * Loads an existing chat using the chat ID.
   * @param {string} chatId - The ID of the chat to load.
   * @returns {Promise<Interaction[]>} The interactions of the loaded chat.
   * @throws {Error} If loading the chat fails or if the chat ID is invalid.
   */
  async loadChat(chatId: string): Promise<Interaction[]> {
    if (!chatId.trim()) {
      throw new Error('Chat ID cannot be empty');
    }
    try {
      const data = await ApiService.loadChat(chatId);
      if (!data) {
        throw new Error('No data returned from API');
      }
      this.chatId = chatId;
      return data.interactions;
    } catch (error) {
      console.error('Failed to load chat:', error);
      throw new Error('Failed to load chat');
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
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }
    try {
      const data = await ApiService.addMessage(this.chatId!, message);
      if (!data) {
        throw new Error('No data returned from API');
      }
      return data;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw new Error('Failed to add message');
    }
  }

  /**
   * Edits a message in the current chat.
   * @param {string} interactionId - The ID of the interaction to edit.
   * @param {string} message - The new message content.
   * @returns {Promise<Interaction[]>} The result of editing the message.
   * @throws {Error} If the chat hasn't been created or if editing the message fails.
   */
  async editMessage(interactionId: string, message: string): Promise<Interaction[]> {
    this.ensureChatCreated();
    if (!interactionId.trim() || !message.trim()) {
      throw new Error('Interaction ID and message cannot be empty');
    }
    try {
      const data = await ApiService.editMessage(this.chatId!, interactionId, message);
      if (!data) {
        throw new Error('No data returned from API');
      }
      return data;
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
    if (!interactionId.trim()) {
      throw new Error('Interaction ID cannot be empty');
    }
    try {
      const data = await ApiService.deleteMessage(this.chatId!, interactionId);
      if (!data) {
        throw new Error('No data returned from API');
      }
      return data;
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Lists all available chats.
   * @returns {Promise<ChatInfo[]>} The list of available chats.
   * @throws {Error} If loading the chats fails.
   */
  static async listAllChats(): Promise<ChatInfo[]> {
    try {
      const data = await ApiService.listChats();
      if (!data) {
        throw new Error('No data returned from API');
      }
      return data;
    } catch (error) {
      console.error('Failed to load chats:', error);
      throw new Error('Failed to load chats');
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

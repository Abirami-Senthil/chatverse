import { ChatModel } from '../models/ChatModel';

export class ChatController {
  private chatModel: ChatModel;

  constructor() {
    this.chatModel = new ChatModel();
  }

  async createChat() {
    try {
      const data = await this.chatModel.createChat();
      return data.interaction;
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }

  async sendMessage(message: string) {
    try {
      return await this.chatModel.addMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async editMessage(interactionId: string, message: string) {
    try {
      return await this.chatModel.editMessage(interactionId, message);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }

  async deleteMessage(interactionId: string) {
    try {
      return await this.chatModel.deleteMessage(interactionId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }
}

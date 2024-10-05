import { ApiService } from '../services/ApiService';

export class ChatModel {
  private chatId: string | null = null;

  async createChat() {
    const data = await ApiService.createChat();
    this.chatId = data.chat_id;
    return data;
  }

  async addMessage(message: string) {
    if (!this.chatId) throw new Error("Chat hasn't been created yet.");
    return await ApiService.addMessage(this.chatId, message);
  }

  async editMessage(interactionId: string, message: string) {
    if (!this.chatId) throw new Error("Chat hasn't been created yet.");
    return await ApiService.editMessage(this.chatId, interactionId, message);
  }

  async deleteMessage(interactionId: string) {
    if (!this.chatId) throw new Error("Chat hasn't been created yet.");
    return await ApiService.deleteMessage(this.chatId, interactionId);
  }
}

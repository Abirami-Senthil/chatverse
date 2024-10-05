// src/services/ApiService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const ApiService = {
  createChat: async () => {
    const response = await axios.get(`${API_BASE_URL}/chat/init`);
    return response.data;
  },

  addMessage: async (chatId: string, message: string) => {
    const response = await axios.post(`${API_BASE_URL}/chat/${chatId}/message`, {
      message: message,
    });
    return response.data;
  },

  editMessage: async (chatId: string, interactionId: string, message: string) => {
    const response = await axios.patch(`${API_BASE_URL}/chat/${chatId}/message/${interactionId}`, {
      message: message,
    });
    return response.data;
  },

  deleteMessage: async (chatId: string, interactionId: string) => {
    const response = await axios.delete(`${API_BASE_URL}/chat/${chatId}/message/${interactionId}`);
    return response.data;
  },
};
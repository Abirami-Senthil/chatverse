import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthResponse, ChatInitResponse, ChatMessageResponse, EditMessageResponse, DeleteMessageResponse } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

let axiosInstance: AxiosInstance | null = null;

type ApiResponse<T> = T | undefined;

/**
 * Creates an Axios instance with the given token for authentication.
 * @param token - The authentication token.
 * @returns An Axios instance configured with the base URL and authentication header.
 */
const createAxiosInstance = (token: string): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};


const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    throw new Error(`API Error: ${axiosError.response?.status} - ${axiosError.message}`);
  }
  throw error;
};

/**
 * Checks if the user is authenticated and throws an error if not.
 * @throws An error if the user is not authenticated.
 */
const checkAuthentication = (): void => {
  if (!axiosInstance) throw new Error('Not authenticated. Please log in.');
};

export const ApiService = {
  register: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/register`, { username, password });
      axiosInstance = createAxiosInstance(response.data.access_token);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/login`, { username, password });
      axiosInstance = createAxiosInstance(response.data.access_token);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  createChat: async (): Promise<ApiResponse<ChatInitResponse>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.get<ChatInitResponse>('/chat/init');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  addMessage: async (chatId: string, message: string): Promise<ApiResponse<ChatMessageResponse>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.post<ChatMessageResponse>(`/chat/${chatId}/message`, { message });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  editMessage: async (chatId: string, interactionId: string, message: string): Promise<ApiResponse<EditMessageResponse>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.patch<EditMessageResponse>(`/chat/${chatId}/message/${interactionId}`, { message });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteMessage: async (chatId: string, interactionId: string): Promise<ApiResponse<DeleteMessageResponse>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.delete<DeleteMessageResponse>(`/chat/${chatId}/message/${interactionId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
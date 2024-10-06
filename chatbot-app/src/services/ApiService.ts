import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthResponse, AuthError, CreateChatResponse, ChatMessageResponse, Interaction, ChatInfo, GetChatResponse, } from '../types/api';

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
  register: async (username: string, password: string): Promise<ApiResponse<AuthResponse | AuthError>> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/register`, { username, password });
      axiosInstance = createAxiosInstance(response.data.access_token);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (Array.isArray(errorDetail)) {
          const errorMessage = errorDetail.map((err: any) => `${err.loc[-1]}: ${err.msg}`).join(', ');
          throw new Error(errorMessage);
        } else {
          throw new Error(errorDetail);
        }
      }
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

  createChat: async (chatName: string): Promise<ApiResponse<CreateChatResponse>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.get<CreateChatResponse>(`/chat/init`, {
        params: { chat_name: chatName }
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  addMessage: async (chatId: string, message: string): Promise<ApiResponse<Interaction>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.post<Interaction>(`/chat/${chatId}/message`, { message });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  editMessage: async (chatId: string, interactionId: string, message: string): Promise<ApiResponse<Interaction[]>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.patch<Interaction[]>(`/chat/${chatId}/message/${interactionId}`, { message });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteMessage: async (chatId: string, interactionId: string): Promise<ApiResponse<Interaction[]>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.delete<Interaction[]>(`/chat/${chatId}/message/${interactionId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  loadChat: async (chatId: string): Promise<ApiResponse<GetChatResponse>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.get<GetChatResponse>(`/chat/${chatId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  listChats: async (): Promise<ApiResponse<ChatInfo[]>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.get<ChatInfo[]>('/chats');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
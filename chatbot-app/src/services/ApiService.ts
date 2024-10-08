import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthResponse, AuthError, CreateChatResponse, Interaction, ChatInfo, GetChatResponse, FieldError, } from '../types/api';

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

/**
 * Handles API errors and throws a descriptive error message.
 * @param error - The error object to handle.
 * @throws An error containing the status code and message if it's an Axios error.
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    console.error(`API Error: ${axiosError.response?.status} - ${axiosError.message}`);
    throw new Error(`API Error: ${axiosError.response?.status} - ${axiosError.message}`);
  }
  console.error('Unexpected error:', error);
  throw new Error('Unexpected error occurred');
};

/**
 * Checks if the user is authenticated and throws an error if not.
 * @throws An error if the user is not authenticated.
 */
const checkAuthentication = (): void => {
  if (!axiosInstance) throw new Error('Not authenticated. Please log in.');
};

/**
 * Capitalizes the first letter of a string.
 * @param s - The string to capitalize.
 * @returns The string with the first letter capitalized.
 */
const capitaliseFirstLetter = (s: string): string => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Handles authentication errors and throws a descriptive error message.
 * @param error - The error object to handle.
 * @throws An error containing detailed authentication errors if available.
 */
const handleAuthErrors = (error: any): void => {
  if (axios.isAxiosError(error) && error.response?.data?.detail) {
    const errorDetail = error.response.data.detail;
    if (Array.isArray(errorDetail)) {
      const errors: FieldError[] = errorDetail.map((err: any) => {
        return {
          name: err.loc[err.loc.length - 1],
          errorMessage: `${err.msg.replace("String", capitaliseFirstLetter(err.loc[err.loc.length - 1]))}`
        };
      });
      const authError: AuthError = { errors };
      console.error('Authentication error:', authError);
      throw new Error(JSON.stringify(authError));
    } else {
      const authError: AuthError = { errors: [{ errorMessage: error.response.data.detail }] };
      console.error('Authentication error:', authError);
      throw new Error(JSON.stringify(authError));
    }
  }
  console.error('Unexpected authentication error:', error);
  throw new Error('Unexpected authentication error');
};

export const ApiService = {
  /**
   * Registers a new user.
   * @param username - The username of the user.
   * @param password - The password of the user.
   * @returns The authentication response containing the access token.
   * @throws An error if registration fails.
   */
  register: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, { username, password });
      axiosInstance = createAxiosInstance(response.data.access_token);
      return response.data;
    } catch (error) {
      handleAuthErrors(error);
    }
  },

  /**
   * Logs in an existing user.
   * @param username - The username of the user.
   * @param password - The password of the user.
   * @returns The authentication response containing the access token.
   * @throws An error if login fails.
   */
  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, { username, password });
      axiosInstance = createAxiosInstance(response.data.access_token);
      return response.data;
    } catch (error) {
      handleAuthErrors(error);
    }
  },

  /**
   * Initializes an axios instance using the provided token.
   * @param token - The token to be used for authentication.
   */
  initialize: (token: string): void => {
    axiosInstance = createAxiosInstance(token);
  },

  /**
   * Creates a new chat.
   * @param chatName - The name of the chat to create.
   * @returns The created chat response.
   * @throws An error if chat creation fails.
   */
  createChat: async (chatName: string): Promise<ApiResponse<CreateChatResponse>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.get<CreateChatResponse>(`/chats/init`, {
        params: { chat_name: chatName }
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Adds a message to the specified chat.
   * @param chatId - The ID of the chat.
   * @param message - The message to add.
   * @returns The added interaction.
   * @throws An error if adding the message fails.
   */
  addMessage: async (chatId: string, message: string): Promise<ApiResponse<Interaction>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.post<Interaction>(`/chats/${chatId}/messages`, { message });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Edits an existing message in the specified chat.
   * @param chatId - The ID of the chat.
   * @param interactionId - The ID of the interaction to edit.
   * @param message - The new message content.
   * @returns The updated list of interactions.
   * @throws An error if editing the message fails.
   */
  editMessage: async (chatId: string, interactionId: string, message: string): Promise<ApiResponse<Interaction[]>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.patch<Interaction[]>(`/chats/${chatId}/messages/${interactionId}`, { message });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Deletes a message from the specified chat.
   * @param chatId - The ID of the chat.
   * @param interactionId - The ID of the interaction to delete.
   * @returns The updated list of interactions.
   * @throws An error if deleting the message fails.
   */
  deleteMessage: async (chatId: string, interactionId: string): Promise<ApiResponse<Interaction[]>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.delete<Interaction[]>(`/chats/${chatId}/messages/${interactionId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Loads a chat by its ID.
   * @param chatId - The ID of the chat to load.
   * @returns The chat data including interactions.
   * @throws An error if loading the chat fails.
   */
  loadChat: async (chatId: string): Promise<ApiResponse<GetChatResponse>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.get<GetChatResponse>(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Lists all available chats.
   * @returns A list of all chats.
   * @throws An error if listing the chats fails.
   */
  listChats: async (): Promise<ApiResponse<ChatInfo[]>> => {
    try {
      checkAuthentication();
      const response = await axiosInstance!.get<ChatInfo[]>('/chats/');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

import Interaction from "./Interaction";

export default interface CreateChatResponse {
  chat_id: string;
  chat_name: string;
  interaction: Interaction;
}
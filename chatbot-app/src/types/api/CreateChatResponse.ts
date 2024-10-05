import Interaction from "./Interaction";

export default interface CreateChatResponse {
  chat_id: string;
  interaction: Interaction;
}
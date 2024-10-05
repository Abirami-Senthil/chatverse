import Interaction from "./Interaction";

export default interface ChatMessageResponse {
  chat_id: string;
  interaction: Interaction;
}
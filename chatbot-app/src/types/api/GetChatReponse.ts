import Interaction from "./Interaction";

export default interface GetChatResponse {
    chat_id: string;
    chat_name: string;
    interactions: Interaction[];
}
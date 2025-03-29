import { User } from "./User";
import { Airline } from "./Airline";

export interface ChatParticipant {
  id: string;
  name: string;
  imageUrl: string;
  type: "User" | "Airline"; // Distinguish between User and Airline
}

export interface Chat {
    id: string;
    participants: ChatParticipant[]; // Array of User/Airline IDs
    lastMessage: string;
    timestamp: number;
}

export default Chat;
import React, { useEffect, useState } from 'react';
import { FlatList, TextInputProps } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import { User } from "../../models/User";
import { Airline } from "../../models/Airline";
import { Chat } from "../../models/Chat";
import { ChatParticipant } from "../../models/Chat";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { collection, query, getDocs, getDoc, doc, onSnapshot, where } from 'firebase/firestore';
import { db } from "../../../FirebaseConfig"; // Ensure you have Firebase setup

const Messages = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  // Example data for the chat list

  useEffect(() => {
    console.log("Inside Home's useEffect");
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("Stored User: ", storedUser);
      if (storedUser) {
        setUser(storedUser);
        fetchChats(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

  const fetchChats = async (user: User) => {
    console.log("Inside fetchChats");
    if (!user) return;
  
    try {
      setLoading(true);
      console.log("Querying Chats");
  
      // 🔍 Query Firestore for chats where the user is a participant
      const q = query(collection(db, "Chats"), where("participants", "array-contains", user.id));
      const chatSnapshot = await getDocs(q);
  
      if (chatSnapshot.empty) {
        console.log("No chats found.");
        setChats([]);
        return;
      }
  
      // Process all chat documents in parallel
      const chats = await Promise.all(
        chatSnapshot.docs.map(async (docSnap) => {
          const chatData = docSnap.data() as Chat;
  
          const participantsArray: string[] = Array.isArray(chatData.participants) 
            ? chatData.participants.map(String)  // Ensure all values are strings
            : [];
  
          // 🔍 Fetch all participants in parallel to optimize Firestore queries
          const participantsWithDetails: ChatParticipant[] = (
            await Promise.all(
              participantsArray.map(async (participantId) => {
                console.log("Fetching participant details for ID:", participantId);
  
                const userRef = doc(db, "Users", participantId);
                const userDoc = await getDoc(userRef);
  
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  return {
                    id: participantId,
                    name: `${userData.name || ""} ${userData.surName || ""}`.trim(),
                    imageUrl: userData.profileImage
                      ? await UtilFunctions.fetchLogoUrl(userData.profileImage)
                      : "https://via.placeholder.com/60",
                    type: "User",
                  };
                }
  
                const airlineRef = doc(db, "Airlines", participantId);
                const airlineDoc = await getDoc(airlineRef);
  
                if (airlineDoc.exists()) {
                  const airlineData = airlineDoc.data();
                  return {
                    id: participantId,
                    name: airlineData.name || "",
                    imageUrl: airlineData.logoImage
                      ? await UtilFunctions.fetchLogoUrl(airlineData.logoImage)
                      : "https://via.placeholder.com/60",
                    type: "Airline",
                  };
                }
  
                return null; // If no user/airline found
              })
            )
          ).filter((p): p is ChatParticipant => p !== null);
  
          return { ...chatData, id: docSnap.id, participants: participantsWithDetails };
        })
      );
  
      console.log("Fetched Chats:", chats);
  
      // ✅ **Set state after fetching**
      setChats(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render each chat row
  const renderChatItem = ({ item }: { item: Chat }) => {
    // Find the other participant (exclude the logged-in user)
    if (!user) return null; // Ensure user is defined before proceeding
    // Find the other participant (exclude the logged-in user)
    const otherParticipant = item.participants.find((p) => p.id !== user.id);
    if (!otherParticipant) return null; // Ensure we never return undefined

    return (
      <ChatItem>
        <ChatImage source={{ uri: otherParticipant.imageUrl }} />
        <ChatDetails>
          <ChatName>{otherParticipant.name}</ChatName>
          <ChatMessage>{item.lastMessage}</ChatMessage>
        </ChatDetails>
      </ChatItem>
    );
  };

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <SearchBar placeholder="Search" placeholderTextColor="#aaa" />
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Messages;

// Styled-components
const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
  padding: 10px;
`;

const SearchBar = styled.TextInput<TextInputProps>`
  height: 50px;
  background-color: #fff;
  border-radius: 25px;
  padding: 0 20px;
  font-size: 16px;
  margin-bottom: 10px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const ChatItem = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 10px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const ChatImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 15px;
`;

const ChatDetails = styled.View`
  flex: 1;
  justify-content: center;
`;

const ChatName = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const ChatMessage = styled.Text`
  font-size: 14px;
  color: #666;
  margin-top: 2px;
`;

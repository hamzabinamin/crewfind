import React, { useEffect, useState } from "react";
import { FlatList, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native";
import styled from "styled-components/native";
import { useLocalSearchParams } from "expo-router";
import { sendMessage, getOrCreateChat } from "../services/chatService";
import { User } from "../models/User";
import { Message } from "../models/Message";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const ChatScreen = () => {
  const { chatId: chatIdParam, recipientId } = useLocalSearchParams();
  const [chatId, setChatId] = useState<string | null>(Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");

  const chatIdStr = Array.isArray(chatId) ? chatId[0] : chatId;
  const recipientIdStr = Array.isArray(recipientId) ? recipientId[0] : recipientId;

  console.log("Chat ID: ", chatIdStr);
  console.log("Recipient ID: ", recipientIdStr);

  // Fetch the current user
  useEffect(() => {
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      if (storedUser) {
        setUser(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

  // Listen for real-time messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "Chats", chatId as string, "Messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
    });

    return () => unsubscribe(); // Cleanup the listener when unmounting
  }, [chatId]);

  // Send message handler
  const handleSendMessage = async () => {
    try {
      console.log("Inside handleSendMessage");
      console.log("User: ", user);
      console.log("Message Text: ", messageText);
  
      if (!user || messageText.trim() === "") return;
  
      console.log("Checking if chatId exists...");
      
      let chatIdToUse = chatId as string;
  
      // If chatId is missing, create a new chat first
      if (!chatIdToUse) {
        if (!recipientIdStr) return;
        console.log("Creating a new chat...");
        
        const newChat = await getOrCreateChat(user.id, recipientIdStr);
        
        if (!newChat) {
          console.error("Failed to create a new chat");
          return;
        }
  
        chatIdToUse = newChat.id;
        setChatId(chatIdToUse); 
        console.log("New chat created with ID:", chatIdToUse);
      }
  
      console.log("Calling sendMessage");
      await sendMessage(chatIdToUse, user.id, messageText);
      setMessageText(""); // Clear input after sending
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Container>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              user ? (
                <MessageContainer isOwnMessage={item.senderId === user.id}>
                  <MessageText isOwnMessage={item.senderId === user.id}>
                    {item.text}
                  </MessageText>
                </MessageContainer>
              ) : null
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingTop: 10 }}
            inverted // Newest messages appear at the bottom
          />

          <InputContainer>
            <TextInputStyled
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
            />
            <SendButton onPress={handleSendMessage}>
              <SendButtonText>Send</SendButtonText>
            </SendButton>
          </InputContainer>
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
`;

const MessageContainer = styled.View<{ isOwnMessage: boolean }>`
  align-self: ${({ isOwnMessage }) => (isOwnMessage ? "flex-end" : "flex-start")};
  background-color: ${({ isOwnMessage }) => (isOwnMessage ? "#0084FF" : "#E5E5EA")};
  padding: 10px;
  margin: 5px;
  border-radius: 10px;
  max-width: 75%;
`;

const MessageText = styled.Text<{ isOwnMessage: boolean }>`
  color: ${({ isOwnMessage }) => (isOwnMessage ? "white" : "black")};
`;

const InputContainer = styled.View`
  flex-direction: row;
  padding: 10px;
  background-color: white;
  border-top-width: 1px;
  border-top-color: #ddd;
`;

const TextInputStyled = styled.TextInput`
  flex: 1;
  padding: 10px;
  border-radius: 20px;
  background-color: #f0f0f0;
`;

const SendButton = styled.TouchableOpacity`
  padding: 10px;
`;

const SendButtonText = styled.Text`
  color: blue;
  font-weight: bold;
`;

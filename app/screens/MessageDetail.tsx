import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, Platform, KeyboardAvoidingView, ActivityIndicator } from "react-native";
import { GiftedChat, IMessage, Bubble, InputToolbar, Send, Time } from "react-native-gifted-chat";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { sendMessage, getOrCreateChat } from "../services/chatService";
import { User } from "../models/User";
import { Message } from "../models/Message";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import FastImage from "react-native-fast-image";
import { setCurrentOpenChatId } from "../../hooks/usePushNotifications";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const MessageDetail = () => {
  const navigation = useNavigation();
  const {
    chatId: chatIdParam,
    recipientId,
    otherParticipantName,
    otherParticipantImage,
  } = useLocalSearchParams();

  const [chatId, setChatId] = useState<string | null>(
    Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam
  );
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [avatarsLoaded, setAvatarsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const chatIdStr = Array.isArray(chatId) ? chatId[0] : chatId;
  const recipientIdStr = Array.isArray(recipientId)
    ? recipientId[0]
    : recipientId;
  const otherParticipantNameStr = Array.isArray(otherParticipantName)
    ? otherParticipantName[0]
    : otherParticipantName;
  let otherParticipantImageStr = Array.isArray(otherParticipantImage)
    ? otherParticipantImage[0]
    : otherParticipantImage;

  // Memoize avatar URLs to prevent regeneration
  const avatarUrls = useMemo(() => ({
    currentUser: user?.profileImage || "https://ui-avatars.com/api/?name=You&background=1c1c88&color=fff",
    otherUser: otherParticipantImageStr || "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png",
  }), [user?.profileImage, otherParticipantImageStr]);

  // Set custom header with avatar
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <FastImage
            source={{
              uri: avatarUrls.otherUser,
              priority: FastImage.priority.normal,
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#1c1c88",
              marginRight: 8,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#000" }}>
            {otherParticipantNameStr || "Messages"}
          </Text>
        </View>
      ),
    });
  }, [otherParticipantNameStr, avatarUrls.otherUser, navigation]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await UtilFunctions.getUser();
      if (storedUser) setUser(storedUser);
    };
    fetchUser();
  }, []);

  // Preload avatars BEFORE rendering chat
  useEffect(() => {
    const preloadAvatars = async () => {
      if (!user) return;

      const urlsToPreload = [
        avatarUrls.currentUser,
        avatarUrls.otherUser,
      ].filter(Boolean);

      if (urlsToPreload.length > 0) {
        try {
          await FastImage.preload(
            urlsToPreload.map((uri) => ({
              uri: uri || "",
              priority: FastImage.priority.high,
            }))
          );
          // Add small delay to ensure images are in cache
          setTimeout(() => setAvatarsLoaded(true), 100);
        } catch (error) {
          console.log("Avatar preload error:", error);
          setAvatarsLoaded(true);
        }
      } else {
        setAvatarsLoaded(true);
      }
    };

    preloadAvatars();
  }, [user, avatarUrls]);

  // Listen for Firebase messages and convert to Gifted Chat format
  useEffect(() => {
    if (!chatIdStr || !user || !avatarsLoaded) return;

    setCurrentOpenChatId(chatIdStr);

    const q = query(
      collection(db, "Chats", chatIdStr, "Messages"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Convert timestamp
        let messageDate: Date;
        if (typeof data.timestamp === "number") {
          messageDate = new Date(data.timestamp);
        } else if (data.timestamp?.toDate) {
          messageDate = data.timestamp.toDate();
        } else {
          messageDate = new Date();
        }

        // Use memoized avatar URLs
        const isCurrentUser = data.senderId === user?.id;
        
        const giftedMessage: IMessage = {
          _id: doc.id,
          text: data.text || "",
          createdAt: messageDate,
          user: {
            _id: data.senderId || "",
            name: isCurrentUser ? "You" : otherParticipantNameStr || "User",
            avatar: isCurrentUser ? avatarUrls.currentUser : avatarUrls.otherUser,
          },
        };

        return giftedMessage;
      });

      setMessages(fetched);
    });

    return () => {
      unsubscribe();
      setCurrentOpenChatId(null);
    };
  }, [chatIdStr, user, otherParticipantNameStr, avatarUrls, avatarsLoaded]);

  // Handle sending messages
  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      try {
        if (!user || newMessages.length === 0) return;

        const messageText = newMessages[0].text;
        if (messageText.trim() === "") return;

        let chatIdToUse = chatId as string;

        if (!chatIdToUse) {
          if (!recipientIdStr) return;
          const newChat = await getOrCreateChat(user.id ?? "", recipientIdStr);
          if (!newChat) return;

          chatIdToUse = newChat.id;
          setChatId(chatIdToUse);
        }

        await sendMessage(chatIdToUse, user.id ?? "", messageText.trim());
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [user, chatId, recipientIdStr]
  );

  // Custom bubble styling
  const renderBubble = useCallback((props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#1c1c88",
            marginRight: 8,
            marginVertical: 4,
          },
          left: {
            backgroundColor: "#E5E5EA",
            marginLeft: 8,
            marginVertical: 4,
          },
        }}
        textStyle={{
          right: {
            color: "#fff",
          },
          left: {
            color: "#000",
          },
        }}
      />
    );
  }, []);

  // Custom avatar rendering with FastImage
  const renderAvatar = useCallback((props: any) => {
    return (
      <View style={{ marginBottom: 4, marginHorizontal: 8 }}>
        <FastImage
          source={{
            uri: props.currentMessage.user.avatar,
            priority: FastImage.priority.high,
            cache: FastImage.cacheControl.immutable,
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#1c1c88",
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
      </View>
    );
  }, []);

  // Custom input toolbar
  const renderInputToolbar = useCallback((props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#ddd",
          paddingVertical: 4,
          paddingHorizontal: 8,
        }}
        primaryStyle={{
          alignItems: "center",
        }}
      />
    );
  }, []);

  // Custom send button
  const renderSend = useCallback((props: any) => {
    return (
      <Send
        {...props}
        containerStyle={{
          justifyContent: "center",
          alignItems: "center",
          marginRight: 4,
          marginBottom: 5,
        }}
      >
        <View
          style={{
            backgroundColor: "#1c1c88",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            minWidth: 60,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>
            Send
          </Text>
        </View>
      </Send>
    );
  }, []);

  // Custom time display
  const renderTime = useCallback((props: any) => {
    return (
      <Time
        {...props}
        timeTextStyle={{
          left: { color: "#999", fontSize: 10 },
          right: { color: "#ccc", fontSize: 10 },
        }}
      />
    );
  }, []);

  // Show loading until user and avatars are ready
  if (!user || !avatarsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
        <ActivityIndicator size="large" color="#1c1c88" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: user.id ?? "",
          name: "You",
          avatar: avatarUrls.currentUser,
        }}
        renderBubble={renderBubble}
        renderAvatar={renderAvatar}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        renderTime={renderTime}
        placeholder="Type a message..."
        alwaysShowSend
        showUserAvatar
        renderUsernameOnMessage={false}
        renderAvatarOnTop
        infiniteScroll
        messagesContainerStyle={{
          paddingBottom: 10,
        }}
        minInputToolbarHeight={44}
      />
      {Platform.OS === "android" && <KeyboardAvoidingView behavior="padding" />}
    </View>
  );
};

export default MessageDetail;
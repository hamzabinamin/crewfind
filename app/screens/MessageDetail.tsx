import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Platform, KeyboardAvoidingView } from "react-native";
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

  // Set custom header with avatar
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <FastImage
            source={{
              uri:
                otherParticipantImageStr ||
                "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png",
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
  }, [otherParticipantNameStr, otherParticipantImageStr, navigation]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await UtilFunctions.getUser();
      if (storedUser) setUser(storedUser);
    };
    fetchUser();
  }, []);

  // Preload avatars for faster display
  useEffect(() => {
    const preloadAvatars = async () => {
      const avatarUrls = [
        otherParticipantImageStr,
        user?.profileImage,
      ].filter(Boolean);

      if (avatarUrls.length > 0) {
        try {
          await FastImage.preload(
            avatarUrls.map((uri) => ({
              uri: uri || "",
              priority: FastImage.priority.high,
            }))
          );
          setAvatarsLoaded(true);
        } catch (error) {
          console.log("Avatar preload error:", error);
          setAvatarsLoaded(true); // Still proceed even if preload fails
        }
      } else {
        setAvatarsLoaded(true);
      }
    };

    if (user) {
      preloadAvatars();
    }
  }, [user, otherParticipantImageStr]);

  // Listen for Firebase messages and convert to Gifted Chat format
  useEffect(() => {
    if (!chatIdStr) return;

    setCurrentOpenChatId(chatIdStr);

    const q = query(
      collection(db, "Chats", chatIdStr, "Messages"),
      orderBy("timestamp", "desc") // Gifted Chat expects newest first
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

        // Convert to Gifted Chat IMessage format
        const giftedMessage: IMessage = {
          _id: doc.id,
          text: data.text || "",
          createdAt: messageDate,
          user: {
            _id: data.senderId || "",
            name: data.senderId === user?.id ? "You" : otherParticipantNameStr || "User",
            avatar:
              data.senderId === user?.id
                ? user?.profileImage || "https://ui-avatars.com/api/?name=You&background=1c1c88&color=fff"
                : otherParticipantImageStr ||
                  "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png",
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
  }, [chatIdStr, user, otherParticipantNameStr, otherParticipantImageStr]);

  // Handle sending messages
  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      try {
        if (!user || newMessages.length === 0) return;

        const messageText = newMessages[0].text;
        if (messageText.trim() === "") return;

        let chatIdToUse = chatId as string;

        // Create chat if it doesn't exist
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

  // Custom bubble styling to match your original design
  const renderBubble = (props: any) => {
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
  };

  // Custom avatar rendering with FastImage for better caching
  const renderAvatar = (props: any) => {
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
  };

  // Custom input toolbar
  const renderInputToolbar = (props: any) => {
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
  };

  // Custom send button
  const renderSend = (props: any) => {
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
  };

  // Custom time display
  const renderTime = (props: any) => {
    return (
      <Time
        {...props}
        timeTextStyle={{
          left: { color: "#999", fontSize: 10 },
          right: { color: "#ccc", fontSize: 10 },
        }}
      />
    );
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
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
          avatar: user.profileImage || "https://ui-avatars.com/api/?name=You&background=1c1c88&color=fff",
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
      />
      {Platform.OS === "android" && <KeyboardAvoidingView behavior="padding" />}
    </View>
  );
};

export default MessageDetail;
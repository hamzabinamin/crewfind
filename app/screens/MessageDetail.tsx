import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, Platform, KeyboardAvoidingView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GiftedChat, IMessage, Bubble, InputToolbar, Send, Time } from "react-native-gifted-chat";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { sendMessage, getOrCreateChat } from "../../services/chatService";
import Icon2 from 'react-native-vector-icons/Ionicons';
import { User } from "../../models/User";
import { Message } from "../../models/Message";
import eventEmitter from "../../utilities/eventEmitter";
import UtilFunctions from "@/utilities/UtilFunctions";
import { Image } from "expo-image";
import { setCurrentOpenChatId } from "../../hooks/usePushNotifications";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

export interface ChatMessage extends IMessage {
  isReported?: boolean;
}

const MessageDetail = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
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

   // Fetch current user
  useEffect(() => {
    console.log("useEffect: fetching user");
    const fetchUser = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("storedUser:", storedUser);
      if (storedUser) {
        console.log("Setting user");
        setUser(storedUser);
        console.log("After setting: ", user);
      }
      else {
        console.log("No stored user found");
      }
    };
    fetchUser();
  }, []); 

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // User logged out - clear state immediately
        setUser(null);
        setMessages([]);
        messagesRef.current = [];
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Preload avatars BEFORE rendering chat
/*  useEffect(() => {
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
  }, [user, avatarUrls]); */

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
          // expo-image uses Image.prefetch
          await Image.prefetch(urlsToPreload);
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

  // Set custom header with avatar
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{
              uri: avatarUrls.otherUser
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#1c1c88",
              marginRight: 8,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#000",
            }}
          >
            {otherParticipantNameStr || "Messages"}
          </Text>
        </View>
      ),

      headerRight: () => (
        <TouchableOpacity
          onPress={openChatOptions}
          style={{ marginRight: 12 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon2
            name="ellipsis-vertical"
            size={20}
            color="#000"
          />
        </TouchableOpacity>
      ),
    });
  }, [user, otherParticipantNameStr, avatarUrls.otherUser, navigation]);

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
        console.log("Message data:", data);
        console.log("Message text:", data.text);
        
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
        
        const giftedMessage: ChatMessage = {
          _id: doc.id,
          text: data.isReported ? "This message has been reported" : data.text || "",
          createdAt: messageDate,
          user: {
            _id: data.senderId || "",
            name: isCurrentUser ? "You" : otherParticipantNameStr || "User",
            avatar: isCurrentUser ? avatarUrls.currentUser : avatarUrls.otherUser,
          },
          isReported: data.isReported || false,
        };
        return giftedMessage;
      });

      console.log("✅ Fetched messages array:", fetched);
      console.log("📊 Messages count:", fetched.length);
      if (fetched.length > 0) {
        console.log("🔍 First message (most recent):", fetched[0]);
        console.log("💬 First message text:", fetched[0].text);
      } 

      setMessages(fetched);
      messagesRef.current = fetched;
    },
    (error) => { // ← Add error handler here
      // Silently ignore permission errors (happens during logout)
      console.log("Error: ", error);
      if (error.code !== 'permission-denied') {
        console.error("Messages snapshot error:", error);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe(); // ← Better cleanup
      setCurrentOpenChatId(null);
    };
  }, [chatIdStr, user, otherParticipantNameStr, avatarUrls, avatarsLoaded]);

  const openChatOptions = () => {
    // Capture user state at the time of opening the alert
    
    if (!user) {
      Alert.alert("Please wait", "User information is loading");
      return;
    }

    console.log("Opening chat options");
    console.log("Messages from ref:", messagesRef.current);
    console.log("Messages length:", messagesRef.current.length);
  
    const lastMessage = messagesRef.current.length > 0 ? messagesRef.current[0] : undefined;
    const lastMessageText = lastMessage?.text ?? "";
    const lastMeesageId = lastMessage?._id?.toString() ?? "";

    console.log("Last message text:", lastMessageText);

    Alert.alert(
      "Chat Options",
      "Choose an action",
      [
        {
          text: "Report User",
          onPress: () => {
            reportUser(user, recipientIdStr, otherParticipantNameStr || "Unknown User", "USER_REPORTED", lastMeesageId, "Abusive Messages", lastMessageText);
          }
        },
        {
          text: "Block User",
          style: "destructive",
          onPress: () => {
            blockUser(user, recipientIdStr);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

 const reportUser = async (
  currentUser: User,
  reportedUserId: string,
  reportedUserName: string,
  type: string,
  messageId: string,
  reason: string,
  lastMessage?: string
  ) => {
    try {
      console.log("Inside reportUser");
      if (type != "MESSAGE_REPORTED") {
        await blockUser(currentUser, reportedUserId, false);
      }
     
      console.log("Inside reportUser: Blocked user, now reporting them");
  
      const reportPayload: any = {
        type,
        chatId: chatIdStr,
        messageId,
        reportedUserId,
        reportedUserName,
        reportedBy: currentUser.id,
        reportedByName: `${currentUser.name} ${currentUser.surName}`,
        reason,
        timestamp: Date.now(),
        status: "PENDING",
      };

      if (type == "MESSAGE_REPORTED") {
        reportPayload.reportedMessage = lastMessage || null;

        const messageRef = doc(db, "Chats",
          chatIdStr,
          "Messages",
          messageId
        );

        await updateDoc(messageRef, {
          isReported: true,
          reportedAt: Date.now(),
        });
      }
      else {
        reportPayload.lastMessage = lastMessage || null;
      }

      await addDoc(collection(db, "UserReports"), reportPayload);

      if (type !== "MESSAGE_REPORTED") {
        Alert.alert(
          "Report submitted",
          "The user has been blocked and our team has been notified.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(), 
            }
          ]
        );
      }

    } catch (error) {
      console.error("Error reporting user:", error);
    }
  };

  const blockUser = async (currentUser: User, otherUserId: string, showAlert: boolean = true) => {
    console.log("Blocking user (currentUser.id):", currentUser.id);
    console.log("Blocking user:", otherUserId);

    try {
      setLoading(true);

      if (!currentUser?.id || !otherUserId) return;

      const userRef = doc(db, "Users", currentUser.id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const userData = userSnap.data();

      const blockedList: string[] = userData.blocked || [];
      const friendsList: string[] = userData.friends || [];

      const isAlreadyBlocked = blockedList.includes(otherUserId);

      if (!isAlreadyBlocked) {
        await updateDoc(userRef, {
          blocked: arrayUnion(otherUserId),
          friends: friendsList.includes(otherUserId)
            ? arrayRemove(otherUserId)
            : friendsList,
        });

        const updatedBlocked = [...blockedList, otherUserId];
        const updatedFriends = friendsList.filter(id => id !== otherUserId);

        const updatedUser = {
          ...currentUser,
          blocked: updatedBlocked,
          friends: updatedFriends,
        };

        setUser(updatedUser);
        console.log("Blocked List after update (MessageDetail): ", updatedUser.blocked);
        UtilFunctions.saveUser(updatedUser);
        eventEmitter.emit("blockedChanged");
            

        if (showAlert) {
            Alert.alert(
              "User Blocked",
              "This user has been blocked successfully.",
              [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                }
              ]
          );
        }
      }

    } catch (error) {
      console.error("Error blocking user:", error);
    } finally {
      setLoading(false);
    }
  };

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
    const isReported = props.currentMessage?.isReported;
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: isReported ? "#FFD6D6" : "#1c1c88",
            marginRight: 8,
            marginVertical: 4,
          },
          left: {
            backgroundColor: isReported ? "#EEE" : "#E5E5EA",
            marginLeft: 8,
            marginVertical: 4,
          },
        }}
        textStyle={{
          right: {
            color: isReported ? "#B00020" : "#fff",
            fontStyle: isReported ? "italic" : "normal",
          },
          left: {
            color: isReported ? "#B00020" : "#000",
            fontStyle: isReported ? "italic" : "normal",
          },
        }}
      />
    );
  }, []);

  const openMessageOptions = (message: IMessage) => {
    if (!user) {
      Alert.alert("Please wait", "User information is loading");
      return;
    }

    const messageId = message._id?.toString() ?? "";
    const messageText = message.text ?? "";

    Alert.alert(
      "Message Options",
      "Choose an action",
      [
        {
          text: "Report Message",
          style: "destructive",
          onPress: () => reportUser(user, recipientIdStr, otherParticipantNameStr || "Unknown User", "MESSAGE_REPORTED", messageId, "Abusive Messages", messageText),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  // Custom avatar rendering with FastImage
  const renderAvatar = useCallback((props: any) => {
    return (
      <View style={{ marginBottom: 4, marginHorizontal: 8 }}>
        <Image
          source={{
            uri: props.currentMessage.user.avatar
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#1c1c88",
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
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
        bottomOffset={Platform.OS === 'android' ? insets.bottom : 0}
        messagesContainerStyle={{
          paddingBottom: 10,
        }}
        minInputToolbarHeight={44}
        onLongPress={(context, message) => {
          if (message.user._id === user?.id || (message as any).isReported) {
            return;
          }
          openMessageOptions(message);
        }}
      />
     {/* {Platform.OS === "android" && <KeyboardAvoidingView behavior="padding" />} */}
    </View>
  );
};

export default MessageDetail;
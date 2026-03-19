import React, { useEffect, useState } from 'react';
import { Alert, FlatList, TextInputProps, TouchableOpacity, Animated, Platform } from 'react-native';
import { useFocusEffect } from "@react-navigation/native";
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { User } from "../../models/User";
import { Chat } from "../../models/Chat";
import { ChatParticipant } from "../../models/Chat";
import eventEmitter from "../../utilities/eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import FastImage from "react-native-fast-image";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {  QueryDocumentSnapshot, DocumentData, collection, query, getDocs, getDoc, updateDoc, doc, deleteDoc, where, limit, orderBy, onSnapshot, arrayRemove } from 'firebase/firestore';
import { db } from "../../../FirebaseConfig";
import { MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

// ✅ Helper to process chats snapshot
const processChatsSnapshot = async (snapshot: any, userId: string) => {
  // Fetch the last message of each chat in parallel
  const lastMessages = await Promise.all(
    snapshot.docs.map(async (docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const messagesRef = collection(db, "Chats", docSnap.id, "Messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
      const messagesSnapshot = await getDocs(messagesQuery);

      const lastMessageDoc = messagesSnapshot.docs[0];
      return lastMessageDoc
      ? { ...lastMessageDoc.data(), timestamp: lastMessageDoc.data().timestamp }
      : null;
    })
  );

  const allChats: Chat[] = await Promise.all(
    snapshot.docs.map(async (docSnap: QueryDocumentSnapshot<DocumentData>, index: number) => {
      const chatData = docSnap.data() as Chat;
      const participantsArray: string[] = Array.isArray(chatData.participants)
        ? chatData.participants.map(String)
        : [];

      const participantsWithDetails: ChatParticipant[] = (
        await Promise.all(
          participantsArray.map(async (participantId) => {
            // Try Users collection first
            const userRef = doc(db, "Users", participantId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();

              let profileImageUrl = "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png";
              if (userData.profileImage) {
                if (UtilFunctions.isExternalUrl(userData.profileImage)) {
                  profileImageUrl = userData.profileImage;
                } else {
                  try {
                    profileImageUrl = await UtilFunctions.fetchLogoUrl(userData.profileImage);
                  } catch (error) {
                    console.error("Error fetching profile image from Firebase Storage:", error);
                  }
                }
              }

              return {
                id: participantId,
                name: `${userData.name || ""} ${userData.surName || ""}`.trim(),
                imageUrl: profileImageUrl,
                type: "User",
              };
            }

            // Try Airlines collection if not found in Users
            const airlineRef = doc(db, "Airlines", participantId);
            const airlineDoc = await getDoc(airlineRef);
            if (airlineDoc.exists()) {
              const airlineData = airlineDoc.data();
              return {
                id: participantId,
                name: airlineData.name || "",
                imageUrl: airlineData.logoImage
                  ? await UtilFunctions.fetchLogoUrl(airlineData.logoImage)
                  : "https://dummyimage.com/300/fff/fff",
                type: "Airline",
              };
            }

            // If participant not found in either collection
            return null;
          })
        )
      ).filter((p): p is ChatParticipant => p !== null);

      const lastMessage = lastMessages[index];

      return {
        ...chatData,
        id: docSnap.id,
        participants: participantsWithDetails,
        lastMessageSenderId: lastMessage?.senderId || null,
        lastMessageTimestamp: lastMessage?.timestamp?.toMillis?.() || lastMessage?.timestamp || 0

      };
    })
  );

  // Split chats by type of the other participant
  const crew: Chat[] = [];
  const airlines: Chat[] = [];

  for (const chat of allChats) {
    const other = chat.participants.find((p) => p.id !== userId);
    if (!other) continue;

    if (other.type === "User") crew.push(chat);
    else if (other.type === "Airline") airlines.push(chat);
  }

  return { crew, airlines };
};

const Messages = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [crewChats, setCrewChats] = useState<Chat[]>([]);
  const [airlineChats, setAirlineChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'crew' | 'airlines'>('crew');

  useEffect(() => {
    fetchUserFromStorage();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      // User logged out - clear state immediately
      setUser(null);
      setCrewChats([]);
      setAirlineChats([]);
    }
  });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;

    const q = query(collection(db, "Chats"), where("participants", "array-contains", user.id));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const { crew, airlines } = await processChatsSnapshot(snapshot, user.id ?? "");
        setCrewChats(crew);
        setAirlineChats(airlines);
      } catch (error) {
        console.error("Error processing chat snapshot:", error);
      }
    },
    (error) => { // ← Add error handler here
      console.log("Error: ", error);
      // Silently ignore permission errors (happens during logout)
      if (error.code !== 'permission-denied') {
        console.error("Firestore snapshot error:", error);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe(); // ← Better cleanup
    };
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      console.log("useFocusEffect got called");
      fetchUserFromStorage();
    }, [])
  );

  const fetchUserFromStorage = async () => {
    const storedUser = await UtilFunctions.getUser();
    setUser(storedUser);
    if (storedUser) {
      fetchChats(storedUser);
    } else {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchChats(user);
    setRefreshing(false);
  };

  const fetchChats = async (user: User) => {
    try {
      setLoading(true);
      const q = query(collection(db, "Chats"), where("participants", "array-contains", user.id));
      const chatSnapshot = await getDocs(q);
      const { crew, airlines } = await processChatsSnapshot(chatSnapshot, user.id ?? "");
      setCrewChats(crew);
      setAirlineChats(airlines);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmChatDelete = (chatId: string) => {
    Alert.alert("Delete Chat", "Are you sure you want to delete this chat?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const chatRef = doc(db, "Chats", chatId);
            await deleteDoc(chatRef);
            setCrewChats(prev => prev.filter(chat => chat.id !== chatId));
            setAirlineChats(prev => prev.filter(chat => chat.id !== chatId));
          } catch (error) {
            console.error("Error deleting chat:", error);
            Alert.alert("Error", "There was an issue deleting the chat.");
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const updateReadTimestamp = async (chatId: string, userId: string) => {
    const chatRef = doc(db, 'Chats', chatId);
  
    await updateDoc(chatRef, {
      [`readTimestamps.${userId}`]: Date.now(),
    });
  };

  const navigateToChat = (chatId: string, otherParticipant: ChatParticipant) => {
    router.push({ pathname: "../../screens/MessageDetail", params: { chatId, recipientId: otherParticipant.id, otherParticipantName: otherParticipant.name, otherParticipantImage: encodeURIComponent(otherParticipant.imageUrl ?? "") } });
  };

  const isUserBlocked = (participantId: string): boolean => {
    console.log("Blocked List (Messages): ", user?.blocked);
    return user?.blocked?.includes(participantId) || false;
  };

  const handleUnblock = async (userId: string, userName: string) => {
    if (!user || !user.id) return; 

    const currentUserId = user.id

    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              setLoading(true);
              const userRef = doc(db, "Users", currentUserId);
              
              await updateDoc(userRef, {
                blocked: arrayRemove(userId),
              });

              const updatedBlocked = (user.blocked || []).filter(id => id !== userId);
              const updatedUser = {
                ...user,
                blocked: updatedBlocked,
              };

              setUser(updatedUser);
              await UtilFunctions.saveUser(updatedUser);
              eventEmitter.emit("blockedChanged");
              
              Alert.alert("Success", `${userName} has been unblocked.`);
            } catch (error) {
              console.error("Error unblocking user:", error);
              Alert.alert("Error", "Failed to unblock user. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleChatPress = async (chatId: string, userId: string, otherParticipant: ChatParticipant) => {
    try {
      await updateReadTimestamp(chatId, userId); 
      navigateToChat(chatId, otherParticipant);                    
    } catch (error) {
      console.error("Error marking chat as read:", error);
      navigateToChat(chatId, otherParticipant);
    }
  };

  const handleLoginPress = () => {
    if (Platform.OS === 'ios') {
        router.replace("../../screens/auth/Login"); 
    } else {
        router.push("../../screens/auth/Login"); 
    }
  };

  const renderRightActions = (chatId: string, progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <HiddenContainer>
        <Animated.View style={{ transform: [{ scale }] }}>
          <DeleteButton onPress={() => confirmChatDelete(chatId)}>
            <MaterialIcons name="delete" size={24} color="#fff" />
            <DeleteText>Delete</DeleteText>
          </DeleteButton>
        </Animated.View>
      </HiddenContainer>
    );
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const other = item.participants.find(p => p.id !== user?.id);
    if (!other || !user) return null;

    const userId = user?.id ?? '';
    const userLastRead = item.readTimestamps?.[userId] ?? 0;
    const hasUnread = (item.lastMessageTimestamp || 0) > userLastRead && item.lastMessageSenderId !== userId;
    const isBlocked = isUserBlocked(other.id);

    console.log({
      chatId: item.id,
      lastMessageTimestamp: item.lastMessageTimestamp,
      userLastRead,
      lastMessageSenderId: item.lastMessageSenderId,
      userId,
      hasUnread,
      isUserBlocked: isBlocked
    });

    return (
        <Swipeable
          renderRightActions={(progress) => renderRightActions(item.id, progress)}
          overshootRight={false}
        >
          <TouchableOpacity 
            onPress={() => {
              if (!isBlocked) {
                handleChatPress(item.id, user?.id || "", other);
              }
            }}
            disabled={isBlocked}
          >
            <ChatItem blocked={isBlocked}>
              <ChatImage
                source={{
                  uri: other.imageUrl,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                resizeMode={FastImage.resizeMode.cover}
                style={{ opacity: isBlocked ? 0.5 : 1 }}
              />
              <ChatDetails>
                <ChatHeader>
                  <ChatName style={{ color: isBlocked ? '#999' : '#333' }}>
                    {other.name}
                  </ChatName>
                  {hasUnread && !isBlocked && <UnreadDot />}
                  {isBlocked && (
                    <BlockedBadge>
                      <Icon name="ban" size={12} color="#fff" />
                      <BlockedText>Blocked</BlockedText>
                    </BlockedBadge>
                  )}
                </ChatHeader>
                <ChatMessage numberOfLines={1} style={{ color: isBlocked ? '#999' : '#666' }}>
                  {isBlocked ? "You have blocked this user" : item.lastMessage}
                </ChatMessage>
                {isBlocked && (
                  <UnblockButton onPress={() => handleUnblock(other.id, other.name)}>
                    <UnblockButtonText>Unblock</UnblockButtonText>
                  </UnblockButton>
                )}
              </ChatDetails>
            </ChatItem>
          </TouchableOpacity>
        </Swipeable>
      );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredCrewChats = crewChats.filter(chat =>
    chat.participants.some(participant =>
      participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredAirlineChats = airlineChats.filter(chat =>
    chat.participants.some(participant =>
      participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const currentChats = activeTab === 'crew' ? filteredCrewChats : filteredAirlineChats;

  // Show login required screen if user is not logged in
  if (!user && !loading) {
    return (
      <Container>
        <LoginRequiredContainer>
          <LoginIconContainer>
            <Icon name="lock-closed-outline" size={80} color="#1c1c88" />
          </LoginIconContainer>
          <LoginTitle>Login Required</LoginTitle>
          <LoginMessage>
            Please log in to view your messages and start conversations with crew members and airlines.
          </LoginMessage>
          <LoginButton onPress={handleLoginPress}>
            <LoginButtonText>Go to Login</LoginButtonText>
          </LoginButton>
        </LoginRequiredContainer>
      </Container>
    );
  }

  return (
    <Container>
      {loading && <LoadingIndicator />}
      
      {/* Tab Navigation */}
      <TabContainer>
        <TabButton 
          active={activeTab === 'crew'} 
          onPress={() => setActiveTab('crew')}
        >
          <Icon 
            name="people-outline" 
            size={20} 
            color={activeTab === 'crew' ? '#1c1c88' : '#999'} 
            style={{ marginRight: 8 }}
          />
          <TabText active={activeTab === 'crew'}>Crew</TabText>
          {activeTab === 'crew' && <ActiveIndicator />}
        </TabButton>
        
        <TabButton 
          active={activeTab === 'airlines'} 
          onPress={() => setActiveTab('airlines')}
        >
          <Icon 
            name="airplane-outline" 
            size={20} 
            color={activeTab === 'airlines' ? '#1c1c88' : '#999'} 
            style={{ marginRight: 8 }}
          />
          <TabText active={activeTab === 'airlines'}>Airlines</TabText>
          {activeTab === 'airlines' && <ActiveIndicator />}
        </TabButton>
      </TabContainer>

      {/* Search Bar */}
      <SearchContainer>
        <SearchBarContainer>
          <Icon name="search" size={18} color="#999" style={{ marginRight: 10 }} />
          <SearchInput
            placeholder="Search for messages..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </SearchBarContainer>
      </SearchContainer>

      {/* Chat List */}
      <FlatList
        data={currentChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyWrapper>
              <EmptyContainer>
                <EmptyIconContainer>
                  <Icon 
                    name={activeTab === 'crew' ? 'people-outline' : 'airplane-outline'} 
                    size={80} 
                    color="#ccc" 
                  />
                </EmptyIconContainer>
                <EmptyTitle>No {activeTab === 'crew' ? 'crew' : 'airline'} chats</EmptyTitle>
                <EmptyMessage>
                  Start conversations to see them here
                </EmptyMessage>
              </EmptyContainer>
            </EmptyWrapper>
          ) : null
        }
      />
    </Container>
  );
};

export default Messages;

// ✅ Styled Components

const Container = styled.View`
  flex: 1;
  background-color: #F2F3F5;
  padding: 20px;
`;

const TabContainer = styled.View`
  flex-direction: row;
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 15px;
  padding: 8px;
`;

const TabButton = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 10px;
  position: relative;
  background-color: ${({ active }) => (active ? '#f0f0f0' : 'transparent')};
`;

const TabText = styled.Text<{ active: boolean }>`
  font-size: 16px;
  font-weight: ${({ active }) => (active ? '600' : '400')};
  color: ${({ active }) => (active ? '#1c1c88' : '#999')};
`;

const ActiveIndicator = styled.View`
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-10px);
  width: 20px;
  height: 3px;
  background-color: #1c1c88;
  border-radius: 2px;
`;

const SearchContainer = styled.View`
  background-color: #fff;
  padding: 15px;
  border-radius: 15px;
  margin-bottom: 15px;
`;

const SearchBarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #F2F3F5;
  border-radius: 10px;
  padding: 10px 15px;
`;

const SearchInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
`;

const ChatItem = styled.View<{ blocked?: boolean }>`
  flex-direction: row;
  align-items: center;
  background-color: ${({ blocked }) => (blocked ? '#f8f8f8' : '#fff')};
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  ${({ blocked }) => blocked && `
    border-left-width: 3px;
    border-left-color: #ff3b30;
  `}
`;

const BlockedBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #ff3b30;
  padding: 4px 8px;
  border-radius: 12px;
  gap: 4px;
`;

const BlockedText = styled.Text`
  color: #fff;
  font-size: 11px;
  font-weight: 600;
`;

const UnblockButton = styled.TouchableOpacity`
  margin-top: 8px;
  background-color: #1c1c88;
  padding: 8px 16px;
  border-radius: 8px;
  align-self: flex-start;
`;

const UnblockButtonText = styled.Text`
  color: #fff;
  font-size: 13px;
  font-weight: 600;
`;

const ChatImage = styled(FastImage)`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 15px;
  border-radius: 8px;
  background-color: #1c1c88;
  border-width: 1px;
  border-color: #1c1c88;
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

const ChatHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const UnreadDot = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: #007aff;
`;

const HiddenContainer = styled.View`
  justify-content: center;
  align-items: flex-end;
  flex: 1;
`;

const DeleteButton = styled.TouchableOpacity`
  background-color: red;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 100%;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
`;

const DeleteText = styled.Text`
  color: white;
  font-size: 12px;
  margin-top: 4px;
`;

const EmptyWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const EmptyContainer = styled.View`
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 12px;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
  width: 100%;
  max-width: 320px;
  max-height: 350px;
`;

const EmptyIconContainer = styled.View`
  margin-bottom: 20px;
`;

const EmptyTitle = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
`;

const EmptyMessage = styled.Text`
  text-align: center;
  font-size: 16px;
  color: #666;
  line-height: 24px;
  max-width: 280px;
`;

// Login Required Styled Components
const LoginRequiredContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 12px;
  margin: 20px;
`;

const LoginIconContainer = styled.View`
  margin-bottom: 30px;
  background-color: #f0f0ff;
  padding: 30px;
  border-radius: 50px;
`;

const LoginTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #1c1c88;
  margin-bottom: 15px;
  text-align: center;
`;

const LoginMessage = styled.Text`
  text-align: center;
  font-size: 16px;
  color: #666;
  line-height: 24px;
  margin-bottom: 30px;
  max-width: 300px;
`;

const LoginButton = styled.TouchableOpacity`
  background-color: #1c1c88;
  padding: 16px 40px;
  border-radius: 12px;
  shadow-color: #1c1c88;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 4;
`;

const LoginButtonText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
`;
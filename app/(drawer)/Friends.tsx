import React, { useState, useEffect } from 'react';
import { FlatList, Alert, TouchableOpacity, View } from 'react-native';
import { useRouter } from "expo-router";
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { User } from "../models/User";
import eventEmitter from "../utilities/eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { Image } from "expo-image";
import LoadingIndicator from "../utilities/LoadingIndicator";
import { collection, doc, getDocs, getDoc, updateDoc, arrayRemove, arrayUnion, query, where } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const Friends = () => {
  const [friends, setFriends] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatIds, setChatIds] = useState<{ [key: string]: string | null }>({});
  const router = useRouter();

  useEffect(() => {
    console.log("Inside Home's useEffect");
    fetchUserFromStorage();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }
  }, [user]); // Runs when `user` changes

  const fetchUserFromStorage = async () => {
    const storedUser = await UtilFunctions.getUser();
    console.log("Stored User: ", storedUser);
    if (storedUser) {
      setUser(storedUser);
    }
  };

  const fetchFriends = async () => {
    console.log("Inside fetchFriends");
    try {
      setRefreshing(true);
      setLoading(true);
      if (user) {
        const userRef = doc(db, "Users", user.id ?? "");
        const userSnap = await getDoc(userRef);
  
        if (!userSnap.exists()) {
          console.error("User document not found!");
          return;
        }
  
        const userData = userSnap.data();
        console.log("Fetched User: ", userData);
  
        let friendsDetails: User[] = [];
  
        if (userData.friends && Array.isArray(userData.friends)) {
          const chatIdsStore: { [key: string]: string | null } = {};
          const fetchedFriends = await Promise.all(
            userData.friends.map(async (friendId: string) => {
              const friendRef = doc(db, "Users", friendId);
              const friendSnap = await getDoc(friendRef);
  
              if (friendSnap.exists()) {
                const friendData = friendSnap.data();

                let profileImageUrl = "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png";
                if (friendData.profileImage) {
                  if (UtilFunctions.isExternalUrl(friendData.profileImage)) {
                    profileImageUrl = friendData.profileImage;
                  } else {
                    try {
                      profileImageUrl = await UtilFunctions.fetchLogoUrl(friendData.profileImage);
                    } catch (error) {
                      console.error("Error fetching profile image from Firebase Storage:", error);
                    }
                  }
                }

                let backgroundImageUrl = "https://dummyimage.com/300/fff/fff";
                if (friendData.backgroundImage) {
                  if (UtilFunctions.isExternalUrl(friendData.backgroundImage)) {
                    backgroundImageUrl = friendData.backgroundImage;
                  } else {
                    try {
                      backgroundImageUrl = await UtilFunctions.fetchLogoUrl(friendData.backgroundImage);
                    } catch (error) {
                      console.error("Error fetching background image from Firebase Storage:", error);
                    }
                  }
                }

                const crewId = friendSnap.id;

                if (user) {
                  const chatQuery = query(
                    collection(db, "Chats"),
                    where("participants", "array-contains", user.id)
                  );
      
                  const chatSnapshot = await getDocs(chatQuery);
                  chatIdsStore[crewId] = null;
        
                  for (const chatDoc of chatSnapshot.docs) {
                    const chatData = chatDoc.data();
                    if (Array.isArray(chatData.participants) && chatData.participants.includes(crewId)) {
                      chatIdsStore[crewId] = chatDoc.id;
                      console.log("chatIdsStore: ", chatIdsStore);
                      break;
                    }
                  }
                  setChatIds(chatIdsStore);
                }

                return {
                  id: friendSnap.id,
                  name: friendData.name || "",
                  surName: friendData.surName || "",
                  email: friendData.email || "",
                  isVerified: friendData.isVerified || "false",
                  base: friendData.base || "",
                  nationality: friendData.nationality || "",
                  position: friendData.position || "",
                  companyName: friendData.companyName || "",
                  age: friendData.age || 0,
                  sex: friendData.sex || "",
                  relationshipStatus: friendData.relationshipStatus || "",
                  hobbies: friendData.hobbies || [],
                  profileImage: profileImageUrl,
                  backgroundImage: backgroundImageUrl,
                  licenses: friendData.licenses || [],
                  licenseType: friendData.licenseType || "",
                  experiences: friendData.experiences || [],
                  flyingHoursPIC: friendData.flyingHoursPIC,
                  flyingHoursTotal: friendData.flyingHoursTotal,
                  yearsOfExperience: friendData.yearsOfExperience,
                  friends: friendData.friends || [],
                  blocked: friendData.blocked || [],
                  lastSeen: friendData.lastSeen ? friendData.lastSeen.toDate?.() ?? new Date(friendData.lastSeen) : null,
                  createdAt: friendData.createdAt ? new Date(friendData.createdAt) : new Date(),
                  updatedAt: friendData.updatedAt ? new Date(friendData.updatedAt) : new Date(),
                } as User;
              }
              return null;
            })
          );
  
          // Remove `null` values by filtering them out
          friendsDetails = fetchedFriends.filter((friend): friend is User => friend !== null);
        }
        setFriends(friendsDetails);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleFriendsChanged = () => {
      console.log("handleFriendsChanged got called inside Friends");
      fetchUserFromStorage();
      fetchFriends();
    };

    eventEmitter.on("friendsChanged", handleFriendsChanged);

    return () => {
      eventEmitter.off("friendsChanged", handleFriendsChanged);
    };
  }, [fetchFriends]);

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleFriend = async (user: User, crewMemberId: string) => {
    console.log("Got inside toggleFriend (Friends)");
    try {
      setLoading(true);
      const userRef = doc(db, "Users", user.id ?? "");
      console.log("Before getDoc");
      const userSnap = await getDoc(userRef);
      console.log("After getDoc");
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let friendsList = userData.friends || []; // Ensure friends exist
  
        if (friendsList.includes(crewMemberId)) {
          // Remove friend
          friendsList = friendsList.filter((id: string) => id !== crewMemberId);
          console.log("Before updateDoc");
          await updateDoc(userRef, {
            friends: arrayRemove(crewMemberId),
          });
          console.log("After updateDoc");
         // setIsFriend(false);
        } else {
          // Add friend
          friendsList.push(crewMemberId);
          console.log("Before updateDoc");
          await updateDoc(userRef, {
            friends: arrayUnion(crewMemberId),
          });
          console.log("After updateDoc");
         // setIsFriend(true);
        }
        const updatedUser = { ...user, friends: friendsList };
        setUser(updatedUser); 
        UtilFunctions.saveUser(updatedUser);
        eventEmitter.emit("friendsChanged", { updatedFriends: friendsList });
      }
    } catch (error) {
      console.error("Error updating friends list:", error);
    }
    finally {
      setLoading(false);
    } 
  };

  const blockUser = async (user: User, crewMemberId: string) => {
    console.log("Got inside blockUser");
    try {
      setLoading(true);
      const userRef = doc(db, "Users", user.id ?? "");
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let blockedList = userData.blocked || []; // Ensure blocked list exists
        let friendsList = userData.friends || []; // Ensure friends list exists
  
        if (blockedList.includes(crewMemberId)) {
          // Unblock user
          blockedList = blockedList.filter((id: string) => id !== crewMemberId);
          await updateDoc(userRef, {
            blocked: arrayRemove(crewMemberId),
          });
         // setIsBlocked(false);
        } else {
          // Block user
          blockedList.push(crewMemberId);
          await updateDoc(userRef, {
            blocked: arrayUnion(crewMemberId),
          });
         // setIsBlocked(true);
  
          // Remove from friends list if they were friends
          if (friendsList.includes(crewMemberId)) {
            friendsList = friendsList.filter((id: string) => id !== crewMemberId);
            await updateDoc(userRef, {
              friends: arrayRemove(crewMemberId),
            });
          }
        }
        // Update local state and storage
        const updatedUser = { 
          ...user, 
          blocked: blockedList,
          friends: friendsList,  // 🔥 Ensure local friends list is updated
        };
  
        setUser(updatedUser);
        UtilFunctions.saveUser(updatedUser);
        eventEmitter.emit("blockedChanged", { updatedBlocked: blockedList });
      }
    } catch (error) {
      console.error("Error updating blocked list:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = (recipientId: string, chatId: string) => {    
    router.push({
      pathname: "../../screens/MessageDetail",
      params: { recipientId, chatId }
    });
  };
  
  // Toggle status
  const toggleStatus = async (friendId: string) => {
    console.log("Got inside toggleStatus");
    try {
      setLoading(true);
      if (!user || !user.id) {
        return;
      }
      const userRef = doc(db, "Users", user.id);
      console.log("Before getDoc");
      const userSnap = await getDoc(userRef);
      console.log("After getDoc");
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let friendsList = userData.friends || []; // Ensure friends exist
  
        if (friendsList.includes(friendId)) {
          // Remove friend
          friendsList = friendsList.filter((id: string) => id !== friendId);
          console.log("Before updateDoc");
          await updateDoc(userRef, {
            friends: arrayRemove(friendId),
          });
          console.log("After updateDoc");
        } 
        const updatedUser = { ...user, friends: friendsList };
        setUser(updatedUser); 
        UtilFunctions.saveUser(updatedUser);
        console.log("After friends update: ", updatedUser.friends);
        eventEmitter.emit("friendsChanged");
      }
    } catch (error) {
      console.error("Error updating friends list:", error);
    }
    finally {
      setLoading(false);
    } 
  };

  const filteredFriends = friends.filter(friend =>
    `${friend.name} ${friend.surName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show confirmation dialog
  const showConfirmationDialog = (id: string) => {
    const action = 'unfriend';
    Alert.alert(
      `Are you sure?`,
      `Are you sure you want to ${action} this person?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => toggleStatus(id),
        },
      ]
    );
  };

  // Render each user row
  const renderUser = ({ item }: { item: User }) => {
    const isExpanded = expandedId === item.id;
    const isFriend = user?.friends?.includes(item.id ?? "") ?? false;
    const isBlocked = user?.blocked?.includes(item.id ?? "") ?? false;

    console.log("item.id (Friends): ", item.id);
    console.log("Friends List (Friends): ", user?.friends);
    console.log("isFriend (Friends): ", isFriend);
    console.log("isBlocked (Friends): ", isBlocked);
     console.log("isVerified (Friends): ", item.isVerified);
    
    return (
      <TouchableOpacity onPress={() => handleExpand(item.id ?? "")}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: isExpanded ? 0 : 12,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          marginVertical: 8,
        }}>
          {/* Main compact view - always visible */}
          <UserRow>
            <ProfileImageWrapper>
              <ProfileImage
                source={{
                  uri: item.profileImage
                }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </ProfileImageWrapper>
            
            <InfoContainer>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <UserName>
                  {item.name} {item.surName}
                </UserName>
                {(item.isVerified === "true") && <VerifiedBadge />}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Icon
                  name={UtilFunctions.getPositionIcon(item.position)}
                  size={14}
                  color="#777"
                  style={{ marginRight: 5 }}
                />
                <PositionText>{item.position}</PositionText> 
                <SeparatorText> • </SeparatorText> 
                <SubText>{item.age}</SubText>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 0 }}>
                <SubText>{item.companyName}</SubText>
                <Icon
                  name="map-marker-alt"
                  size={14}
                  color="#777"
                  style={{ marginHorizontal: 5 }}
                />
                <SubText>{item.base}</SubText>
              </View>
            </InfoContainer>

            <View style={{ alignItems: "center" }}>
              <BlockButton onPress={() => showConfirmationDialog(item.id ?? "")}>
                <Icon name="users" size={14} color="#666" style={{ marginRight: 5 }} />
                <ButtonText>Friends</ButtonText>
              </BlockButton>
              
              {/* Expand/Collapse arrow */}
              <Icon 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#1c1c88"
                style={{ marginTop: 5, marginRight: -85 }}
              />
            </View>
          </UserRow>

          {/* Expanded content - only shows when expanded */}
          {isExpanded && (
            <ExpandedContent>
              {/* Separator line with proper spacing */}
              <View style={{
                height: 1,
                backgroundColor: "#e0e0e0",
                marginHorizontal: 4, 
                marginTop: -10,
                marginBottom: 15
              }} />
              
              {/* Background image section */}
              <BackgroundImageSection>
                <BackgroundImage
                  source={{
                    uri: item.backgroundImage
                  }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </BackgroundImageSection>

              {/* Detail Section */}
              <DetailSection>
                <DetailRow>
                  <DetailIcon name="building" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Airline</DetailLabel>
                    <DetailValue>{item.companyName}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>

                <DetailRow>
                  <DetailIcon name="flag" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Nationality</DetailLabel>
                    <DetailValue>{item.nationality}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>

                <DetailRow>
                  <DetailIcon name="heart" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Relationship Status</DetailLabel>
                    <DetailValue>{item.relationshipStatus}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>

                <DetailRow>
                  <DetailIcon name="user" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Sex</DetailLabel>
                    <DetailValue>{item.sex}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>

                <DetailRow>
                  <DetailIcon name="calendar" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Age</DetailLabel>
                    <DetailValue>{item.age}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>
              </DetailSection>

              {/* Hobbies Section */}
              <HobbySection>
                <HobbyTitle>Interests & Hobbies</HobbyTitle>
                <HobbyList>
                  {item.hobbies?.map((hobby, index) => (
                    <HobbyChip key={index}>{hobby}</HobbyChip>
                  ))}
                </HobbyList>
              </HobbySection>

              {/* Action Buttons - Modified for Friends screen */}
              {user && (
                <ActionRow>
                  <ActionButton onPress={() => navigateToChat(item.id ?? "", chatIds[item.id ?? ""] ?? "")} disabled={isBlocked}>
                    <Icon name="comment" size={16} color="#fff" />
                    <ActionText>Message</ActionText>
                  </ActionButton>
                  <ActionButton outline onPress={() => toggleFriend(user, item.id ?? "")} disabled={isBlocked}>
                    <Icon name={isFriend ? "user-times" : "user-plus"} size={16} color="#1c1c88" />
                    <ActionTextOutline>{isFriend ? "Remove Friend" : "Add Friend"}</ActionTextOutline>
                  </ActionButton>
                  <ActionButton outline onPress={() => blockUser(user, item.id ?? "")}>
                    <Icon name={isBlocked ? "user" : "user-times"} size={16} color="#1c1c88" />
                    <ActionTextOutline>{isBlocked ? "Unblock" : "Block"}</ActionTextOutline>
                  </ActionButton>
                </ActionRow>
              )}
            </ExpandedContent>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <Container>
      {loading && <LoadingIndicator />}  
      <SearchContainer>
        <SearchBarContainer>
          <Icon name="search" size={18} color="#999" style={{ marginRight: 10 }} />
          <SearchInput
            placeholder="Search for friends..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </SearchBarContainer>
      </SearchContainer>

      <FlatList
        data={filteredFriends}
        renderItem={renderUser}
        keyExtractor={(item) => item.id ?? ""}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        refreshing={refreshing}
        onRefresh={fetchFriends}
        ListEmptyComponent={() => (
          <EmptyWrapper>
            <EmptyContainer>
              <EmptyIconContainer>
                <Icon name="users" size={80} color="#ccc" />
              </EmptyIconContainer>
              <EmptyTitle>No friends yet</EmptyTitle>
              <EmptyMessage>Go to CrewFind and add friends to see them here</EmptyMessage>
            </EmptyContainer>
          </EmptyWrapper>
        )}
      />
    </Container>
  );
};

export default Friends;

// Styled-components
const Container = styled.View`
  flex: 1;
  background-color: #F2F3F5;
  padding: 20px;
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

const UserRow = styled.View`
  background-color: #fff;
  flex-direction: row;
  align-items: center;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 10px;
  elevation: 2;
`;

const UserName = styled.Text`
  font-weight: bold;
  font-size: 16px;
  color: #000;
`;

const BlockButton = styled.TouchableOpacity`
  background-color: #fff;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1.5px solid #ddd;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-width: 90px;
`;

const ButtonText = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: #666;
`;

const EmptyWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const EmptyContainer = styled.View`
  flex: 1;
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

const ProfileImageWrapper = styled.View`
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 12px;
`;

const ProfileImage = styled(Image)`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background-color: #1c1c88;
  border-width: 1px;
  border-color: #1c1c88;
  margin-right: 12px;
  margin-top: -5px;
`;

const VerifiedBadge = styled(Image).attrs({
  contentFit: "contain",
  source: require("../../assets/images/verified-badge.png"),
})`
  width: 20px;
  height: 20px;
  margin-left: 2px;
`;

const InfoContainer = styled.View`
  flex: 1;
`;

const PositionText = styled.Text`
  color: #1c1c88;
  font-weight: 500;
`;

const SeparatorText = styled.Text`
  color: #777;
  font-size: 13px;
`;

const SubText = styled.Text`
  font-size: 14px;
  color: #555;
`;

// Expanded content styles
const ExpandedContent = styled.View`
  padding: 15px;
  padding-top: 0;
`;

const BackgroundImageSection = styled.View`
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
  height: 120px;
`;

const BackgroundImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

const DetailSection = styled.View`
  margin-bottom: 15px;
`;

const DetailRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 18px;
`;

const DetailIcon = styled(Icon)`
  width: 24px;
  margin-right: 12px;
`;

const DetailTextContainer = styled.View`
  flex-direction: column;
`;

const DetailLabel = styled.Text`
  font-weight: 600;
  font-size: 15px;
  color: #000;
`;

const DetailValue = styled.Text`
  font-size: 14px;
  color: #777;
`;

const HobbySection = styled.View`
  margin-bottom: 12px;
`;

const HobbyTitle = styled.Text`
  font-weight: bold;
  margin-bottom: 5px;
`;

const HobbyList = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
`;

const HobbyChip = styled.Text`
  background-color: #E1E4F0;
  color: #3E4784;
  padding: 6px 10px;
  border-radius: 15px;
  margin-right: 6px;
  margin-bottom: 6px;
  font-size: 12px;
`;

const ActionRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 10px;
`;

const ActionButton = styled.TouchableOpacity<{ outline?: boolean; disabled?: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  background-color: ${({ outline, disabled }) => {
    if (disabled) return '#ccc'; // grey background when disabled
    return outline ? '#fff' : '#1c1c88';
  }};
  border: ${({ outline }) => (outline ? '1px solid #1c1c88' : 'none')};
`;

const ActionText = styled.Text`
  color: #fff;
  margin-left: 6px;
`;

const ActionTextOutline = styled.Text`
  color: #1c1c88;
  margin-left: 6px;
`;
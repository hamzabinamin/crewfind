import React, { useState, useEffect } from 'react';
import { FlatList, Alert, TouchableOpacity, View } from 'react-native';
import { useRouter } from "expo-router";
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { User } from "../models/User";
import eventEmitter from "../utilities/eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import FastImage from "react-native-fast-image";
import LoadingIndicator from "../utilities/LoadingIndicator";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const Blocked = () => {
  const [blocked, setBlocked] = useState<User[]>([]);
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
      fetchBlocked();
    }
  }, [user]); // Runs when `user` changes

  const fetchUserFromStorage = async () => {
    const storedUser = await UtilFunctions.getUser();
    console.log("Stored User: ", storedUser);
    if (storedUser) {
      setUser(storedUser);
    }
  };

  const fetchBlocked = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      if (user) {
        if (!user || !user.id) {
          return;
        }
        const userRef = doc(db, "Users", user.id);
        const userSnap = await getDoc(userRef);
  
        if (!userSnap.exists()) {
          console.error("User document not found!");
          return;
        }
  
        const userData = userSnap.data();
        console.log("Fetched User: ", userData);
  
        let blockedDetails: User[] = [];
  
        if (userData.blocked && Array.isArray(userData.blocked)) {
          const chatIdsStore: { [key: string]: string | null } = {};
          const fetchedBlocked = await Promise.all(
            userData.blocked.map(async (blockedId: string) => {
              const blockedRef = doc(db, "Users", blockedId);
              const blockedSnap = await getDoc(blockedRef);
  
              if (blockedSnap.exists()) {
                const blockedData = blockedSnap.data();

                let profileImageUrl = "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png";
                if (blockedData.profileImage) {
                  if (UtilFunctions.isExternalUrl(blockedData.profileImage)) {
                    profileImageUrl = blockedData.profileImage;
                  } else {
                    try {
                      profileImageUrl = await UtilFunctions.fetchLogoUrl(blockedData.profileImage);
                    } catch (error) {
                      console.error("Error fetching profile image from Firebase Storage:", error);
                    }
                  }
                }

                let backgroundImageUrl = "https://dummyimage.com/300/fff/fff";
                if (blockedData.backgroundImage) {
                  if (UtilFunctions.isExternalUrl(blockedData.backgroundImage)) {
                    backgroundImageUrl = blockedData.backgroundImage;
                  } else {
                    try {
                      backgroundImageUrl = await UtilFunctions.fetchLogoUrl(blockedData.backgroundImage);
                    } catch (error) {
                      console.error("Error fetching background image from Firebase Storage:", error);
                    }
                  }
                }

                const crewId = blockedSnap.id;

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
                  id: blockedSnap.id,
                  name: blockedData.name || "",
                  surName: blockedData.surName || "",
                  email: blockedData.email || "",
                  isVerified: blockedData.isVerified || "false",
                  base: blockedData.base || "",
                  nationality: blockedData.nationality || "",
                  position: blockedData.position || "",
                  companyName: blockedData.companyName || "",
                  age: blockedData.age || 0,
                  sex: blockedData.sex || "",
                  relationshipStatus: blockedData.relationshipStatus || "",
                  hobbies: blockedData.hobbies || [],
                  profileImage: profileImageUrl,
                  backgroundImage: backgroundImageUrl,
                  licenses: blockedData.licenses || [],
                  licenseType: blockedData.licenseType || "",
                  experiences: blockedData.experiences || [],
                  flyingHoursPIC: blockedData.flyingHoursPIC,
                  flyingHoursTotal: blockedData.flyingHoursTotal,
                  yearsOfExperience: blockedData.yearsOfExperience,
                  friends: blockedData.friends || [],
                  blocked: blockedData.blocked || [],
                  lastSeen: blockedData.lastSeen ? blockedData.lastSeen.toDate?.() ?? new Date(blockedData.lastSeen) : null,
                  createdAt: blockedData.createdAt ? new Date(blockedData.createdAt) : new Date(),
                  updatedAt: blockedData.updatedAt ? new Date(blockedData.updatedAt) : new Date(),
                } as User;
              }
              return null;
            })
          );
  
          // Remove `null` values by filtering them out
          blockedDetails = fetchedBlocked.filter((blocked): blocked is User => blocked !== null);
        }
        setBlocked(blockedDetails);
      }
    } catch (error) {
      console.error("Error fetching blocked:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleBlockedChanged = () => {
      console.log("handleBlockedChanged got called inside Blocked");
      fetchUserFromStorage();
      fetchBlocked();
    };

    eventEmitter.on("blockedChanged", handleBlockedChanged);

    return () => {
      eventEmitter.off("blockedChanged", handleBlockedChanged);
    };
  }, [fetchBlocked]);

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

  const navigateToChat = (recipientId: string, chatId: string) => {    
    router.push({
      pathname: "../../screens/MessageDetail",
      params: { recipientId, chatId }
    });
  };

  // Toggle block/unblock status
  const toggleBlockStatus = async (user: User, id: string) => {
    if (user) {
      try {
        setLoading(true);
        if (!user || !user.id) {
          return;
        }
        const userRef = doc(db, "Users", user.id);
        const userSnap = await getDoc(userRef);
    
        if (userSnap.exists()) {
          const userData = userSnap.data();
          let blockedList = userData.blocked || []; // Ensure the blocked array exists
    
          if (blockedList.includes(id)) {
            // Unblock user
            blockedList = blockedList.filter((blockedId: string) => blockedId !== id);
            await updateDoc(userRef, {
              blocked: arrayRemove(id),
            });
          } else {
            // Block user
            blockedList.push(id);
            await updateDoc(userRef, {
              blocked: arrayUnion(id),
            });
          }

          // Update local user object
          const updatedUser = { ...user, blocked: blockedList };
          setUser(updatedUser);
          UtilFunctions.saveUser(updatedUser);
          console.log("After blocked update: ", updatedUser.blocked);
          eventEmitter.emit("blockedChanged");
    
          // Update blocked list in UI
          setBlocked(blockedList.map((blockedId: string) => ({ id: blockedId }))); // Assuming `blocked` is an array of objects
        }
      } catch (error) {
        console.error("Error updating block status:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredBlocked = blocked.filter(user =>
    `${user.name} ${user.surName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Show confirmation dialog
  const showConfirmationDialog = (id: string) => {
    if (user) {
      const action = 'unblock';
      Alert.alert(
        `Are you sure?`,
        `Are you sure you want to ${action} this person?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => toggleBlockStatus(user, id),
          },
        ]
      );
    }
  };

  // Render each blocked user row
  const renderBlockedUser = ({ item }: { item: User }) => {
    const isExpanded = expandedId === item.id;
    const isFriend = user?.friends?.includes(item.id ?? "") ?? false;
    const isBlocked = user?.blocked?.includes(item.id ?? "") ?? false;

    console.log("item.id (Blocked): ", item.id);
    console.log("Blocked List (Blocked): ", user?.blocked);
    console.log("isBlocked (Blocked): ", isBlocked);
    
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
                  uri: item.profileImage,
                  priority: FastImage.priority.normal,
                }}
                resizeMode={FastImage.resizeMode.cover}
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
                <Icon name="unlock" size={14} color="#666" style={{ marginRight: 5 }} />
                <ButtonText>Unblock</ButtonText>
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
                    uri: item.backgroundImage,
                    priority: FastImage.priority.normal,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
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

              {/* Action Buttons - Modified for Blocked screen */}
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
                  <ActionButton outline onPress={() => toggleBlockStatus(user, item.id ?? "")}>
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
            placeholder="Search blocked users..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </SearchBarContainer>
      </SearchContainer>

      <FlatList
        data={filteredBlocked}
        renderItem={renderBlockedUser}
        keyExtractor={(item) => item.id ?? ""}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        refreshing={refreshing}
        onRefresh={fetchBlocked}
        ListEmptyComponent={() => (
          <EmptyWrapper>
            <EmptyContainer>
              <EmptyIconContainer>
                <Icon name="ban" size={80} color="#ccc" />
              </EmptyIconContainer>
              <EmptyTitle>No blocked users</EmptyTitle>
              <EmptyMessage>Users you block will appear here for easy management</EmptyMessage>
            </EmptyContainer>
          </EmptyWrapper>
        )}
      />
    </Container>
  );
};

export default Blocked;

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
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
`;

const UserImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background-color: #1c1c88;
  border-width: 1px;
  border-color: #1c1c88;
  margin-right: 15px;
`;

const UserName = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
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

const ProfileImage = styled(FastImage)`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background-color: #1c1c88;
  border-width: 1px;
  border-color: #1c1c88;
  margin-right: 12px;
  margin-top: -5px;
`;

const VerifiedBadge = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
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

const BackgroundImage = styled(FastImage)`
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
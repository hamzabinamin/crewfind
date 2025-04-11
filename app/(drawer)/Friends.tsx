import React, { useState, useEffect } from 'react';
import { FlatList, Alert } from 'react-native';
import styled from 'styled-components/native';
import { User } from "../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import LoadingIndicator from "../utilities/LoadingIndicator";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const Friends = () => {
  const [friends, setFriends] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [blockedUsers, setUsers] = useState([
    { id: '1', name: 'John Doe', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s', isBlocked: true },
    { id: '2', name: 'Jane Smith', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s', isBlocked: true },
    { id: '3', name: 'Bob Johnson', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s', isBlocked: true },
  ]);

  useEffect(() => {
    console.log("Inside Home's useEffect");
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("Stored User: ", storedUser);
      if (storedUser) {
        setUser(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        if (user) {
          const userRef = doc(db, "Users", user.id);
          const userSnap = await getDoc(userRef);
    
          if (!userSnap.exists()) {
            console.error("User document not found!");
            return;
          }
    
          const userData = userSnap.data();
          console.log("Fetched User: ", userData);
    
          let friendsDetails: User[] = [];
    
          if (userData.friends && Array.isArray(userData.friends)) {
            const fetchedFriends = await Promise.all(
              userData.friends.map(async (friendId: string) => {
                const friendRef = doc(db, "Users", friendId);
                const friendSnap = await getDoc(friendRef);
    
                if (friendSnap.exists()) {
                  const friendData = friendSnap.data();
                  return {
                    id: friendSnap.id,
                    name: friendData.name || "",
                    surName: friendData.surName || "",
                    email: friendData.email || "",
                    base: friendData.base || "",
                    nationality: friendData.nationality || "",
                    position: friendData.position || "",
                    companyName: friendData.companyName || "",
                    age: friendData.age || 0,
                    sex: friendData.sex || "",
                    relationshipStatus: friendData.relationshipStatus || "",
                    hobbies: friendData.hobbies || [],
                    profileImageUrl: friendData.profileImage
                      ? await UtilFunctions.fetchLogoUrl(friendData.profileImage)
                      : "https://via.placeholder.com/60",
                    backgroundImageUrl: friendData.backgroundImage
                      ? await UtilFunctions.fetchLogoUrl(friendData.backgroundImage)
                      : "https://via.placeholder.com/60",
                    licenses: friendData.licenses || [],
                    licenseType: friendData.licenseType || "",
                    experiences: friendData.experiences || [],
                    flyingHours: friendData.flyingHours || 0,
                    friends: friendData.friends || [],
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
        setLoading(false);
      }
    };
  
    if (user?.id) {
      fetchFriends();
    }
  }, [user]); // Runs when `user` changes
  
  const filteredFriends = friends.filter(friend =>
    `${friend.name} ${friend.surName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle status
  const toggleStatus = (id: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, isBlocked: !user.isBlocked } : user
      )
    );
  };

  // Show confirmation dialog
  const showConfirmationDialog = (id: string, isBlocked: boolean) => {
    const action = isBlocked ? 'friend' : 'unfriend';
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
    const isBlocked = blockedUsers.some((blockedUser) => blockedUser.id === item.id); // Assume blockedUsers is a state or list
  
    return (
      <UserRow>
        <UserImage source={{ uri: item.profileImageUrl }} />
        <UserName>{item.name} {item.surName}</UserName>
        <BlockButton onPress={() => showConfirmationDialog(item.id, isBlocked)} isBlocked={isBlocked}>
          <ButtonText>{isBlocked ? "UnFriended" : "Friends"}</ButtonText>
        </BlockButton>
      </UserRow>
    );
  };

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <Heading>Friends List</Heading>
      <SearchBar
        placeholder="Search Friends"
        placeholderTextColor="#aaa"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {filteredFriends.length === 0 ? (
        <EmptyContainer>
          <EmptyMessage>No friends to show</EmptyMessage>
        </EmptyContainer>
      ) : (
      <FlatList
        data={filteredFriends}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    )}
    </Container>
  );
};

export default Friends;

// Styled-components
const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
  padding: 10px;
`;

const Heading = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #5DCBCF;
  margin-bottom: 15px;
`;

const UserRow = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const UserImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 15px;
`;

const UserName = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const BlockButton = styled.TouchableOpacity<{ isBlocked: boolean }>`
  background-color: ${({ isBlocked }) => (isBlocked ? '#ff4d4d' : '#4caf50')};
  padding: 10px 20px;
  border-radius: 25px;
`;

const ButtonText = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: #fff;
`;

const SearchBar = styled.TextInput`
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

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const EmptyMessage = styled.Text`
  text-align: center;
  font-size: 18px;
  color: #999;
  margin-top: 0px;
`;

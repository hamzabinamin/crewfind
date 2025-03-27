import React, { useState, useEffect } from 'react';
import { FlatList, Alert } from 'react-native';
import styled from 'styled-components/native';
import { User } from "../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import LoadingIndicator from "../utilities/LoadingIndicator";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const Blocked = () => {
  const [blocked, setBlocked] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Example data for blocked users
  const [blockedUsers, setBlockedUsers] = useState([
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
    
          let blockedDetails: User[] = [];
    
          if (userData.blocked && Array.isArray(userData.blocked)) {
            const fetchedBlocked = await Promise.all(
              userData.blocked.map(async (blockedId: string) => {
                const blockedRef = doc(db, "Users", blockedId);
                const blockedSnap = await getDoc(blockedRef);
    
                if (blockedSnap.exists()) {
                  const blockedData = blockedSnap.data();
                  return {
                    id: blockedSnap.id,
                    name: blockedData.name || "",
                    surName: blockedData.surName || "",
                    email: blockedData.email || "",
                    base: blockedData.base || "",
                    nationality: blockedData.nationality || "",
                    position: blockedData.position || "",
                    companyName: blockedData.companyName || "",
                    age: blockedData.age || 0,
                    sex: blockedData.sex || "",
                    relationshipStatus: blockedData.relationshipStatus || "",
                    hobbies: blockedData.hobbies || [],
                    profileImageUrl: blockedData.profileImage
                      ? await UtilFunctions.fetchLogoUrl(blockedData.profileImage)
                      : "https://via.placeholder.com/60",
                    backgroundImageUrl: blockedData.backgroundImage
                      ? await UtilFunctions.fetchLogoUrl(blockedData.backgroundImage)
                      : "https://via.placeholder.com/60",
                    licenses: blockedData.licenses || [],
                    licenseType: blockedData.licenseType || "",
                    experiences: blockedData.experiences || [],
                    flyingHours: blockedData.flyingHours || 0,
                    friends: blockedData.friends || [],
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
        setLoading(false);
      }
    };
  
    if (user?.id) {
      fetchFriends();
    }
  }, [user]); // Runs when `user` changes
  

  // Toggle block/unblock status
  const toggleBlockStatus = (id: string) => {
    setBlockedUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, isBlocked: !user.isBlocked } : user
      )
    );
  };

  // Show confirmation dialog
  const showConfirmationDialog = (id: string, isBlocked: boolean) => {
    const action = isBlocked ? 'unblock' : 'block';
    Alert.alert(
      `Are you sure?`,
      `Are you sure you want to ${action} this person?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => toggleBlockStatus(id),
        },
      ]
    );
  };

  // Render each blocked user row
  const renderBlockedUser = ({ item }: { item: User }) => {
    const isBlocked = blocked.some((blockedUser) => blockedUser.id === item.id);
  
    return (
      <UserRow>
        <UserImage source={{ uri: item.profileImageUrl }} />
        <UserName>{item.name} {item.surName}</UserName>
        <BlockButton onPress={() => showConfirmationDialog(item.id, isBlocked)} isBlocked={isBlocked}>
          <ButtonText>{isBlocked ? "Blocked" : "Unblocked"}</ButtonText>
        </BlockButton>
      </UserRow>
    );
  };

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <Heading>Blocked List</Heading>
      <FlatList
        data={blocked}
        renderItem={renderBlockedUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Blocked;

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

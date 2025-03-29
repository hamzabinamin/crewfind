import React, { useEffect, useState, useRef } from "react";
import { FlatList, Dimensions, Text, View, Image, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";
import styled from "styled-components/native";
import { Menu, Provider as PaperProvider, Portal} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { collection, doc, getDocs, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";

const screenWidth = Dimensions.get("window").width;

const Home = () => {
  const [crew, setCrew] = useState<User[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuButtonRef = useRef<View>(null); // ✅ Explicitly type the ref
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const router = useRouter();
 
  const openModal = (crew: User) => {
    setSelectedCrew(crew);
    if (user && user.friends) {
      setIsFriend(user.friends.includes(crew.id));
    }
    if (user && user.blocked) {
      setIsBlocked(user.blocked.includes(crew.id));
    }
    console.log("Is Friend: ", isFriend);
    console.log("Is Blocked: ", isBlocked);
    setModalVisible(true);
  };
    
  const closeModal = () => {
    setModalVisible(false);
  };

  const openMenu = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({ top: pageY + height, left: pageX });
        console.log("Menu is visible now at", pageX, pageY);
        setMenuVisible(true);
      });
    } else {
      console.log("Got in else - menuButtonRef is null");
    }
  };

  const closeMenu = () => setMenuVisible(false);

  const toggleFriend = async (user: User, crewMemberId: string) => {
    console.log("Got inside toggleFriend");
    try {
      setLoading(true);
      const userRef = doc(db, "Users", user.id);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let friendsList = userData.friends || []; // Ensure friends exist
  
        if (friendsList.includes(crewMemberId)) {
          // Remove friend
          friendsList = friendsList.filter((id: string) => id !== crewMemberId);
          await updateDoc(userRef, {
            friends: arrayRemove(crewMemberId),
          });
          setIsFriend(false);
        } else {
          // Add friend
          friendsList.push(crewMemberId);
          await updateDoc(userRef, {
            friends: arrayUnion(crewMemberId),
          });
          setIsFriend(true);
        }
        const updatedUser = { ...user, friends: friendsList };
        setUser(updatedUser); 
        UtilFunctions.saveUser(updatedUser);
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
      const userRef = doc(db, "Users", user.id);
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
          setIsBlocked(false);
        } else {
          // Block user
          blockedList.push(crewMemberId);
          await updateDoc(userRef, {
            blocked: arrayUnion(crewMemberId),
          });
          setIsBlocked(true);
  
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
      }
    } catch (error) {
      console.error("Error updating blocked list:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = (recipientId: string) => {    
    closeModal();
    router.push({
      pathname: "../../screens/MessageDetail",
      params: { recipientId }
    });
  };

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
    const fetchCrew = async () => {
      try {
        setLoading(true);
        const crewSnapshot = await getDocs(collection(db, "Users"));
        const crewData: User[] = await Promise.all(
          crewSnapshot.docs.map(async (crewDoc) => {
            const crewData = crewDoc.data();
            console.log("Fetched Crew: ", crewData);
            const profileImageUrl = crewData.profileImage ? await UtilFunctions.fetchLogoUrl(crewData.profileImage) : "https://via.placeholder.com/60";
            const backgroundImageUrl = crewData.backgroundImage ? await UtilFunctions.fetchLogoUrl(crewData.backgroundImage) : "https://via.placeholder.com/60";
  
            return {
              id: crewDoc.id,
              name: crewData.name,
              surName: crewData.surName,
              email: crewData.email,
              password: "",
              base: crewData.base,
              nationality: crewData.nationality,
              position: crewData.position,
              companyName: crewData.companyName,
              age: crewData.age,
              sex: crewData.sex,
              relationshipStatus: crewData.relationshipStatus,
              hobbies: crewData.hobbies,
              profileImageUrl: profileImageUrl,
              backgroundImageUrl: backgroundImageUrl,
              licenses: crewData.licenses,
              licenseType: crewData.licenseType,
              experiences: crewData.experiences,
              flyingHours: crewData.flyingHours,
              friends: crewData.friends,
              blocked: crewData.blocked,
              createdAt: new Date(crewData.createdAt),
              updatedAt: new Date(crewData.updatedAt),
            };
          })
        );
        setCrew(crewData);
      } catch (error) {
        console.error("Error fetching crew:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCrew();
  }, []);

  const renderItem = ({ item }: { item: User }) => (
     <TouchableOpacity onPress={() => openModal(item)}>
        <LinearGradient
        colors={['#4898D8', '#50AAD6', '#58BBCF']} // Gradient colors
        style={{ padding: 15, borderRadius: 10, marginBottom: 15, height: 200 }}
        >
          <AirlineImageContainer>
            <AirlineImage source={{ uri: item.profileImageUrl }} />
          </AirlineImageContainer>
          <LeftContainer>
            <AirlineName>{item.companyName}</AirlineName>
            <BottomLeftDetails>
              <DetailText>Base: {item.base}</DetailText>
              <DetailText>Last Seen: {"2 Hours ago"}</DetailText>
            </BottomLeftDetails>
          </LeftContainer>
          <RightContainer>
            <DetailText>Name: {item.name} {item.surName}</DetailText>
            <DetailText>Position: {item.position}</DetailText>
          </RightContainer>
        </LinearGradient>
     </TouchableOpacity>
  );

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <HeadingTextModal>Nearby Crew</HeadingTextModal>
      <FlatList
      data={crew}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
    {/* Menu moved outside of the Modal */}
    <Modal animationType="slide" transparent visible={modalVisible}>
        {selectedCrew && user && (
          <ModalOverlay>
            {loading && <LoadingIndicator />}
            <ModalContainer>
              <BackgroundImage source={{ uri: selectedCrew.backgroundImageUrl || "https://via.placeholder.com/300" }} />
              
              <ModalPaddingDiv>
                {/* Close Button */}
                <CloseButton onPress={closeModal}>
                  <Ionicons name="close" size={24} color="black" />
                </CloseButton>
              
                {/* Profile Info */}
                <ProfileHeader>
                  <View>
                    <HeadingText>{selectedCrew.name} {selectedCrew.surName}</HeadingText>
                    <SubText>Base: {selectedCrew.base}</SubText>
                    <SubText>Last Seen: {"2 hours ago"}</SubText>
                  </View>
                  <ProfileImage source={{ uri: selectedCrew.profileImageUrl }} />
                </ProfileHeader>
              
                {/* Divider */}
                <Divider />
              
                {/* Crew Details */}
                <DetailsContainer>
                  <DetailTextModal>Airline: {selectedCrew.companyName}</DetailTextModal>
                  <DetailTextModal>Nationality: {selectedCrew.nationality}</DetailTextModal>
                  <DetailTextModal>Hobbies: {selectedCrew.hobbies?.join(", ") || "N/A"}</DetailTextModal>
                  <DetailTextModal>Relationship Status: {selectedCrew.relationshipStatus}</DetailTextModal>
                  <DetailTextModal>Sex: {selectedCrew.sex}</DetailTextModal>
                  <DetailTextModal>Age: {selectedCrew.age}</DetailTextModal>
                </DetailsContainer>
              
                {/* Action Buttons */}
                <ButtonContainer>
                  <View ref={menuButtonRef}>
                    <TouchableOpacity onPress={openMenu}>
                      <Ionicons name="ellipsis-vertical" size={34} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => navigateToChat(selectedCrew.id)} disabled={isBlocked}>
                    <Ionicons name="mail" size={34} color={isBlocked ? "gray" : "black"} />
                  </TouchableOpacity>
                </ButtonContainer>

                {/* Menu Dropdown */}
                {menuVisible && (
                  <Modal animationType="fade" transparent visible={menuVisible} onRequestClose={closeMenu}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={closeMenu} />
                    <View
                      style={{
                        position: "absolute",
                        top: menuPosition.top,
                        left: menuPosition.left,
                        backgroundColor: "white",
                        borderRadius: 5,
                        padding: 10,
                        elevation: 5,
                      }}
                    >
                      <TouchableOpacity onPress={() => { console.log("Add Friend"); toggleFriend(user, selectedCrew.id); }}>
                        <Text style={{ padding: 10 }}>{isFriend ? "Unfriend" : "Add Friend"}</Text>
                      </TouchableOpacity>
                      <View style={{ height: 1, backgroundColor: "gray" }} />
                      <TouchableOpacity onPress={() => { console.log("Block User"); blockUser(user, selectedCrew.id); }}>
                        <Text style={{ padding: 10 }}>{isBlocked ? "Unblock" : "Block"}</Text>
                      </TouchableOpacity>
                    </View>
                  </Modal>
                )}
              </ModalPaddingDiv>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Modal>
    </Container>
  );
};

export default Home;

const Container = styled.View`
  flex: 1;
  background-color: #FFFFFF;
  padding: 20px;
`;

const HeadingText = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #5DCBCF;
  margin-bottom: 20px;
`;

const ListItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #1e1e1e;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  width: 100%;
`;

const LeftContainer = styled.View`
  flex: 1;
  justify-content: space-between;
`;

const BottomLeftDetails = styled.View`
  margin-top: absolute;
  align-items: flex-start;
  margin-bottom: -32px;
`;

const RightContainer = styled.View`
  margin-top: absolute;
  align-items: flex-end;
`;

const AirlineName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #FFFFFF;
`;

const DetailText = styled.Text`
  font-size: 14px;
  color: #FFFFFF;
`;

const AirlineImageContainer = styled.View`
  position: absolute;
  top: 15px; 
  right: 15px;
  z-index: 1;
`;

const AirlineImage = styled.Image`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  margin-bottom: 10px;
`;

const ModalOverlay = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalPaddingDiv = styled.View`
  padding: 20px;
`;

const ModalContainer = styled.View`
  width: 90%;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  padding: 0px;
  align-items: center;
`;

const BackgroundImage = styled.Image`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3;
  resize-mode: cover;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 15px;
  left: 15px;
`;

const ProfileHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 10px;
`;

const ProfileImage = styled.Image`
  width: 80px;
  height: 80px;
  border-radius: 40px;
`;

const HeadingTextModal = styled.Text`
  font-size: 20px;
  font-weight: bold;
`;

const SubText = styled.Text`
  font-size: 14px;
  color: gray;
`;

const Divider = styled.View`
  width: 100%;
  height: 1px;
  background-color: #ccc;
  margin-vertical: 15px;
`;

const DetailsContainer = styled.View`
  align-items: flex-start;
  width: 100%;
`;

const DetailTextModal = styled.Text`
  font-size: 16px;
  margin-bottom: 5px;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  margin-top: 20px;
`;

const ActionButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #007bff;
  justify-content: center;
  align-items: center;
`;
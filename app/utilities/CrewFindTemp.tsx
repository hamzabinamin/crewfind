import React, { useEffect, useState, useRef } from "react";
import { FlatList, Dimensions, Text, View, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import styled from "styled-components/native";
import { Menu, Provider as PaperProvider, Portal} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { User } from "../models/User";
import eventEmitter from "../utilities/eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import LoadingIndicator from "../utilities/LoadingIndicator";
import usePushNotifications from "../../hooks/usePushNotifications";
import { collection, doc, getDocs, updateDoc, arrayUnion, arrayRemove, getDoc, query, where } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const screenWidth = Dimensions.get("window").width;

const HomeTemp = () => {
  usePushNotifications(); 
  const [crew, setCrew] = useState<User[]>([]);
  const [originalCrew, setOriginalCrew] = useState<User[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<User | null>(null);
  const [chatIds, setChatIds] = useState<{ [key: string]: string | null }>({});
  const [user, setUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [crewModalVisible, setCrewModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const menuButtonRef = useRef<View>(null); // ✅ Explicitly type the ref
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const router = useRouter();


  useEffect(() => {
    console.log("Inside Home's useEffect");
    fetchUserFromStorage();
  }, []);
  
  useEffect(() => {
    fetchCrew();
  }, [user]);

  useEffect(() => {
    const handleFriendsChanged = () => {
      console.log("friendsChanged event received");
      fetchUserFromStorage();
      fetchCrew();
    };
    eventEmitter.on("friendsChanged", handleFriendsChanged);
  
    return () => {
      eventEmitter.off("friendsChanged", handleFriendsChanged);
    };
  }, []);

  useEffect(() => {
    const handleBlockedChanged = () => {
      console.log("blockedChanged event received");
      fetchUserFromStorage();
      fetchCrew();
    };
    eventEmitter.on("blockedChanged", handleBlockedChanged);
  
    return () => {
      eventEmitter.off("blockedChanged", handleBlockedChanged);
    };
  }, []);

  useEffect(() => {
    const listener = () => {
      console.log("Filter event received in Home!");
      setCrewModalVisible(true);
    };
    eventEmitter.on("openFilter:Home", listener);
  
    return () => {
      eventEmitter.off("openFilter:Home", listener);
    };
  }, []);

  const fetchUserFromStorage = async () => {
    const storedUser = await UtilFunctions.getUser();
    console.log("Stored User: ", storedUser);
    if (storedUser) {
      setUser(storedUser);
    }
  };
 
  const fetchCrew = async () => {
    console.log("Inside fetchCrew (Home)");
    if (!user) return;
    try {
      console.log("Fetching crew");
      setRefreshing(true);
      setLoading(true);
      const chatIdsStore: { [key: string]: string | null } = {};
      const crewSnapshot = await getDocs(collection(db, "Users"));
      const filteredCrewDocs = crewSnapshot.docs.filter((crewDoc) => crewDoc.id !== user.id);
      const crewData: User[] = await Promise.all(
        filteredCrewDocs.map(async (crewDoc) => {
          const crewData = crewDoc.data();
          console.log("Fetched Crew: ", crewData);
          const profileImageUrl = crewData.profileImage ? await UtilFunctions.fetchLogoUrl(crewData.profileImage) : "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png";
          const backgroundImageUrl = crewData.backgroundImage ? await UtilFunctions.fetchLogoUrl(crewData.backgroundImage) : "https://dummyimage.com/300/fff/fff";

          const crewId = crewDoc.id;

          if (user) {
            const chatQuery = query(
              collection(db, "Chats"),
              where("participants", "array-contains", user.id) // User must be in participants
            );

            const chatSnapshot = await getDocs(chatQuery);
            chatIdsStore[crewId] = null; // Default to null
  
            for (const chatDoc of chatSnapshot.docs) {
              const chatData = chatDoc.data();
              if (Array.isArray(chatData.participants) && chatData.participants.includes(crewId)) {
                chatIdsStore[crewId] = chatDoc.id; // Store chat ID if found
                console.log("chatIdsStore: ", chatIdsStore);
                break; // Stop searching once a chat is found
              }
            }
            setChatIds(chatIdsStore);
          }
          
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
            profileImage: profileImageUrl,
            backgroundImage: backgroundImageUrl,
            licenses: crewData.licenses,
            licenseType: crewData.licenseType,
            experiences: crewData.experiences,
            flyingHoursPIC: crewData.flyingHoursPIC,
            flyingHoursTotal: crewData.flyingHoursTotal,
            yearsOfExperience: crewData.yearsOfExperience,
            friends: crewData.friends,
            blocked: crewData.blocked,
            lastSeen: crewData.lastSeen ? crewData.lastSeen.toDate?.() ?? new Date(crewData.lastSeen) : null,
            createdAt: new Date(crewData.createdAt),
            updatedAt: new Date(crewData.updatedAt),
          };
        })
      );
      setCrew(crewData);
      setOriginalCrew(crewData);
      console.log("Chat Ids: ", chatIds);
    } catch (error) {
      console.error("Error fetching crew:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const toggleFriend = async (user: User, crewMemberId: string) => {
    console.log("Got inside toggleFriend");
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
          setIsFriend(false);
        } else {
          // Add friend
          friendsList.push(crewMemberId);
          console.log("Before updateDoc");
          await updateDoc(userRef, {
            friends: arrayUnion(crewMemberId),
          });
          console.log("After updateDoc");
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

  const navigateToChat = (recipientId: string, chatId: string) => {    
    closeModal();
    router.push({
      pathname: "../../screens/MessageDetail",
      params: { recipientId, chatId }
    });
  };
  
  const openModal = (crew: User) => {
    setSelectedCrew(crew);
    if (user && user.friends) {
      setIsFriend(user.friends.includes(crew.id ?? ""));
    }
    if (user && user.blocked) {
      setIsBlocked(user.blocked.includes(crew.id ?? ""));
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

  type CrewFilter = {
    position: string | null;
    friendsOnly: boolean;
    sex: string | null;
    relationshipStatus: string | null;
  };  

  const [filters, setFilters] = useState<{
    position: "Pilot" | "Cabin Crew" | null;
    friendsOnly: boolean;
    sex: "Male" | "Female" | null;
    relationshipStatus: "Single" | "Married" | "Unspecified" | null;
  }>({
    position: null,
    friendsOnly: false,
    sex: null,
    relationshipStatus: null,
  });
  
  //const [selectedFilterOption, setSelectedOption] = useState("All");
  
  const resetFilters = () => {
    setFilters({
      position: null,
      friendsOnly: false,
      sex: null,
      relationshipStatus: null,
    });
    setSelectedOption("All");
    setCrew(originalCrew);
  };
  
  const handleApplyFilters = () => {
    applyCrewFilter(filters);
    setCrewModalVisible(false);
  };

  const applyCrewFilter = (filters: CrewFilter) => {
    console.log("Applying crew filters:", filters);
  
    let filtered = [...originalCrew];
  
    if (filters.position) {
      console.log("Applying position filter");
      filtered = filtered.filter((crew) => crew.position === filters.position);
    }
  
    if (filters.friendsOnly) {
      filtered = filtered.filter((crew) => user?.friends.includes(crew.id ?? ""));
    }
  
    if (filters.sex) {
      filtered = filtered.filter((crew) => crew.sex === filters.sex);
    }
  
    if (filters.relationshipStatus) {
      filtered = filtered.filter((crew) => crew.relationshipStatus === filters.relationshipStatus);
    }

    setCrew(filtered);
  };
  

  const renderItem = ({ item }: { item: User }) => (
     <TouchableOpacity onPress={() => openModal(item)}>
        <LinearGradient
        colors={['#4898D8', '#50AAD6', '#58BBCF']} // Gradient colors
        style={{ padding: 15, borderRadius: 10, marginBottom: 15, height: 200 }}
        >
          <AirlineImageContainer>
            <AirlineImage source={{ uri: item.profileImage }} />
          </AirlineImageContainer>
          <LeftContainer>
            <AirlineName>{item.companyName}</AirlineName>
            <BottomLeftDetails>
              <DetailText>Base: {item.base}</DetailText>
              <DetailText>Last Seen: {UtilFunctions.getLastSeenText(item.lastSeen)}</DetailText>
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
      <HeadingText>Nearby Crew</HeadingText>
      <FlatList
        data={crew}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id ?? index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchCrew}
    />
    {/* Menu moved outside of the Modal */}
    <Modal animationType="slide" transparent visible={modalVisible}>
        {selectedCrew && user && (
          <ModalOverlay>
            <ModalContainer>
              <BackgroundImage source={{ uri: selectedCrew.backgroundImage || "https://dummyimage.com/300/fff/fff" }} />
              
              <ModalPaddingDiv>
                {/* Close Button */}
                <CloseButton onPress={closeModal}>
                  <Ionicons name="close" size={24} color="black" />
                </CloseButton>
              
                {/* Profile Info */}
                <ProfileHeader>
                  <View>
                    <HeadingTextModal>{selectedCrew.name} {selectedCrew.surName}</HeadingTextModal>
                    <SubText>Base: {selectedCrew.base}</SubText>
                    <SubText>Last Seen: {UtilFunctions.getLastSeenText(selectedCrew.lastSeen)}</SubText>
                  </View>
                  <ProfileImage source={{ uri: selectedCrew.profileImage }} />
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
                  <TouchableOpacity onPress={() => navigateToChat(selectedCrew.id ?? "", chatIds[selectedCrew.id ?? ""] ?? "")} disabled={isBlocked}>
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
                      <TouchableOpacity onPress={() => { console.log("Add Friend"); toggleFriend(user, selectedCrew.id ?? ""); }}>
                        <Text style={{ padding: 10 }}>{isFriend ? "Unfriend" : "Add Friend"}</Text>
                      </TouchableOpacity>
                      <View style={{ height: 1, backgroundColor: "gray" }} />
                      <TouchableOpacity onPress={() => { console.log("Block User"); blockUser(user, selectedCrew.id ?? ""); }}>
                        <Text style={{ padding: 10 }}>{isBlocked ? "Unblock" : "Block"}</Text>
                      </TouchableOpacity>
                    </View>
                  </Modal>
                )}
              </ModalPaddingDiv>
              {loading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <ActivityIndicator size="large" color="black" />
          </View>
        )}
            </ModalContainer>
           
          </ModalOverlay>
        )}
      </Modal>
      <Modal
        visible={crewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCrewModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCrewModalVisible(false)}>
          <ModalOverlay>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ModalBox>
                <HeadingText>Filter Options</HeadingText>

                {/* All - Reset Filters */}
                <TouchableOpacity
                  onPress={() => {
                    const reset = {
                      position: null,
                      friendsOnly: false,
                      sex: null,
                      relationshipStatus: null,
                    };
                    resetFilters();
                    setSelectedOption("All");
                    applyCrewFilter(reset);
                    setCrewModalVisible(false);
                  }}
                  style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
                >
                  <RadioCircle selected={selectedOption === "All"} />
                  <OptionText>All</OptionText>
                </TouchableOpacity>

                {/* Position Section */}
                <SectionHeading>Position</SectionHeading>
                {["Pilot", "Cabin Crew"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      const newFilters = { ...filters, position: option as "Pilot" | "Cabin Crew" };
                      setFilters(newFilters);
                      setSelectedOption(option);
                      applyCrewFilter(newFilters);
                      setCrewModalVisible(false);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
                  >
                    <RadioCircle selected={filters.position === option} />
                    <OptionText>{option}</OptionText>
                  </TouchableOpacity>
                ))}

                {/* Friends Only */}
                <SectionHeading>Friends Only</SectionHeading>
                <TouchableOpacity
                  onPress={() => {
                    const newFilters = { ...filters, friendsOnly: !filters.friendsOnly };
                    setFilters(newFilters);
                    setSelectedOption("Friends Only");
                    applyCrewFilter(newFilters);
                    setCrewModalVisible(false);
                  }}
                  style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
                >
                  <RadioCircle selected={filters.friendsOnly === true} />
                  <OptionText>Friends Only</OptionText>
                </TouchableOpacity>

                {/* Sex Section */}
                <SectionHeading>Sex</SectionHeading>
                {["Male", "Female"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      const newFilters = { ...filters, sex: option as "Male" | "Female" };
                      setFilters(newFilters);
                      setSelectedOption(option);
                      applyCrewFilter(newFilters);
                      setCrewModalVisible(false);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
                  >
                    <RadioCircle selected={filters.sex === option} />
                    <OptionText>{option}</OptionText>
                  </TouchableOpacity>
                ))}

                {/* Relationship Status */}
                <SectionHeading>Relationship Status</SectionHeading>
                {["Single", "Married", "Unspecified"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      const newFilters = { ...filters, relationshipStatus: option as "Single" | "Married" | "Unspecified" };
                      setFilters(newFilters);
                      setSelectedOption(option);
                      applyCrewFilter(newFilters);
                      setCrewModalVisible(false);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
                  >
                    <RadioCircle selected={filters.relationshipStatus === option} />
                    <OptionText>{option}</OptionText>
                  </TouchableOpacity>
                ))}
              </ModalBox>
            </TouchableWithoutFeedback>
          </ModalOverlay>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
};

export default HomeTemp;

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
  font-size: 13px;
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
  background-color: #fff;
  border-radius: 25px;
  
  elevation: 5;
  border-width: 0.5px;
  border-color: #000;
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

const SectionHeading = styled.Text`
  font-size: 16px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
`;

const ModalBox = styled.View`
  background-color: white;
  margin: 40px;
  padding: 20px;
  border-radius: 10px;
  elevation: 5;
`;

const RadioCircle = ({ selected }: { selected: boolean }) => (
  <View
    style={{
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#5DCBCF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    }}
  >
    {selected ? (
      <View
        style={{
          height: 10,
          width: 10,
          borderRadius: 5,
          backgroundColor: "#5DCBCF",
        }}
      />
    ) : null}
  </View>
);

const OptionText = styled.Text`
  font-size: 14px;
  color: #333;
`;
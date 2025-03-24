import React, { useEffect, useState } from "react";
import { FlatList, Dimensions, Text, View, Image, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";
import styled from "styled-components/native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { collection, doc, getDocs } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";

const screenWidth = Dimensions.get("window").width;

const Home = () => {
  const [crew, setCrew] = useState<User[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
 
  const openModal = (crew: User) => {
    setSelectedCrew(crew);
    setModalVisible(true);
  };
    
  const closeModal = () => {
    setModalVisible(false);
  };

  const toggleFriend = () => {
    setIsFriend((prev) => !prev);
    // Here you can add API call to update friend status in Firestore
  };

  const navigateToChat = () => {    
    router.push({
      pathname: "/Messages"
    });
  };
  
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
      <HeadingTextModal>Nearby Crew</HeadingTextModal>
      <FlatList
        data={crew}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    <Modal animationType="slide" transparent visible={modalVisible}>
      {selectedCrew && (
        <ModalOverlay>
          <ModalContainer>
            <BackgroundImage source={{ uri: selectedCrew.backgroundImageUrl || "https://via.placeholder.com/300" }} />
            
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
              <ActionButton onPress={toggleFriend}>
                <Ionicons name={isFriend ? "person-remove" : "person-add"} size={34} color="white" />
              </ActionButton>
              <ActionButton onPress={navigateToChat}>
                <Ionicons name="mail" size={34} color="white" />
              </ActionButton>
            </ButtonContainer>
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

const ModalContainer = styled.View`
  width: 90%;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  padding: 20px;
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
import React, { useEffect, useState } from "react";
import { FlatList, Dimensions, Text, View, Image, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";
import styled from "styled-components/native";
import GradientButton from '../../utilities/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { Special } from "../../models/Special";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { db } from "../../../FirebaseConfig";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";

const Specials = () => {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const openModal = (special: Special) => {
    setSelectedSpecial(special);
    setModalVisible(true);
  };
  
  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
      const fetchJobs = async () => {
        try {
          setLoading(true);
          const specialsSnapshot = await getDocs(collection(db, "Specials"));
          const specialsData: Special[] = await Promise.all(
            specialsSnapshot.docs.map(async (specialDoc) => {
              const specialData = specialDoc.data();
              console.log("Fetched Specials: ", specialData);
              const companyImageUrl = specialData.companyImage ? await UtilFunctions.fetchLogoUrl(specialData.companyImage) : "https://via.placeholder.com/60";
              const backgroundImageUrl = specialData.backgroundImage ? await UtilFunctions.fetchLogoUrl(specialData.backgroundImage) : "https://via.placeholder.com/60";
    
              return {
                id: specialDoc.id,
                companyName: specialData.companyName,
                dealExpiration: specialData.dealExpiration,
                companyImageUrl: companyImageUrl,
                backgroundImageUrl: backgroundImageUrl,
                createdAt: new Date(specialData.createdAt),
                updatedAt: new Date(specialData.updatedAt),
              };
            })
          );
    
          setSpecials(specialsData);
        } catch (error) {
          console.error("Error fetching specials:", error);
        } finally {
          setLoading(false);
        }
      };
    
      fetchJobs();
    }, []);

  const renderItem = ({ item }: { item: Special }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
      <LinearGradient
      colors={['#4898D8', '#50AAD6', '#58BBCF']} // Gradient colors
      style={{ padding: 15, borderRadius: 10, marginBottom: 15, height: 200 }}
    >
        <AirlineImageContainer>
          <AirlineImage source={{ uri: item.companyImageUrl }} />
        </AirlineImageContainer>
        <LeftContainer>
          <AirlineName>{item.companyName}</AirlineName>
          <BottomLeftDetails>
            <DetailText>{item.dealExpiration}</DetailText>
          </BottomLeftDetails>
        </LeftContainer>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <HeadingText>Nearby Deals</HeadingText>
      <FlatList
        data={specials}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Modal animationType="slide" transparent visible={modalVisible}>
        {selectedSpecial && (
          <ModalOverlay>
            <ModalContainer>
            { /* <BackgroundOverlay /> */ }
            <BackgroundImage source={{ uri: selectedSpecial.backgroundImageUrl || "https://via.placeholder.com/300" }} />
              {/* Close Button */}
              <CloseButton onPress={closeModal}>
                <Ionicons name="close" size={24} color="black" />
              </CloseButton>

              {/* Job Details */}
              <JobDetails>
                <CompanyInfo>
                  <View>
                    <HeadingTextModal>{selectedSpecial.companyName}</HeadingTextModal>
                  </View>
                  <CompanyLogo source={{ uri: selectedSpecial.companyImageUrl }} />
                </CompanyInfo>
              </JobDetails>

              {/* Divider */}
              <Divider />

              {/* Job Expiration */}
              <ExpirationText>Deal Expiration: {selectedSpecial.dealExpiration}</ExpirationText>

              {/* Action Buttons */}
              <ButtonContainer>
              <GradientButton title="Directions" onPress={closeModal} containerStyle={{ width: 120, height: 80 }} />
                <ChatButton onPress={() => router.push("/Messages")}>
                  <Ionicons name="call" size={34} color="white" />
                </ChatButton>
              </ButtonContainer>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Modal>
    </Container>
  );
};

export default Specials;

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
  margin-bottom: 0px;
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
  background-color: rgba(0, 0, 0, 0.5); /* Optional: Adds dim effect */
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const ModalContainer = styled.View`
  width: 90%;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  padding-bottom: 20px;
`;

const HeadingTextModal = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #5DCBCF;
  margin-top: 25px;
  margin-bottom: 20px;
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

const BackgroundOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: red; /* Change this color to test */
`;

const CloseButton = styled.Pressable`
  position: absolute;
  top: 10px;
  left: 10px;  /* Move to the top-left */
  background-color: #fff;
  border-radius: 15px;
  padding: 5px;
  elevation: 5;
`;

const DetailTextModal = styled.Text`
  font-size: 14px;
  color: #666;
`;

const JobDetails = styled.View`
  padding: 16px;
`;

const CompanyInfo = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const CompanyLogo = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px; 
  resize-mode: contain;
  margin-top: 15px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: #A9A9A9;
  margin-vertical: 10px;
`;

const ExpirationText = styled.Text`
  text-align: center;
  font-size: 14px;
  color: #888;
  margin-bottom: 10px;
`;

const ButtonContainer = styled.View`
  flex-direction: row; /* Arrange buttons in a row */
  justify-content: center; /* Center buttons horizontally */
  align-items: center; /* Align buttons vertically */
  align-self: center; /* Center the entire container */
  gap: 15px; /* Add spacing between the buttons */
  margin-top: 10px;
`;

const ChatButton = styled.TouchableOpacity`
  background-color: #5dcbcf;
  padding: 12px;
  border-radius: 5px;
  align-items: center;
  justify-content: center;
`;

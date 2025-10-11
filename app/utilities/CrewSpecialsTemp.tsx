import React, { useEffect, useState, useCallback } from "react";
import { FlatList, Dimensions, Text, View, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert, Linking, Platform } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import { useRouter } from "expo-router";
import styled from "styled-components/native";
import GradientButton from './GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import LoadingIndicator from "./LoadingIndicator";
import { Special } from "../models/Special";
import eventEmitter from "./eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { db } from "../../FirebaseConfig";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";

const SpecialsTemp = () => {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [originalSpecials, setOriginalSpecials] = useState<Special[]>([]);
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const openModal = (special: Special) => {
    setSelectedSpecial(special);
    setModalVisible(true);
  };
  
  const closeModal = () => {
    setModalVisible(false);
  };

  const isWithin150km = (userLoc: any, specialLoc: any) => {
    const distance = haversine(userLoc, specialLoc); // distance in meters
    return distance <= 150000 || (specialLoc.latitude === 0 && specialLoc.longitude === 0);
  };

  useEffect(() => {
    fetchUserLocationAndSpecials();
  }, []);

  useEffect(() => {
    const listener = () => {
      console.log("Filter event received in CrewSpecials!");
      setFilterModalVisible(true);
    };
  
    eventEmitter.on("openFilter:CrewSpecials", listener);
  
    return () => {
      eventEmitter.off("openFilter:CrewSpecials", listener);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        console.log('CrewSpecials screen lost focus');
        closeModal();
        setSelectedSpecial(null);
      };
    }, [])
  );

  const askForLocationWithPrePrompt = async () => {
    return new Promise((resolve) => {
      Alert.alert(
        "Allow Location Access?",
        "We use your location to show nearby specials and offers. Do you want to allow access?",
        [
          {
            text: "Not Now",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Allow",
            onPress: () => resolve(true),
          },
        ]
      );
    });
  };

  const fetchUserLocationAndSpecials = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      if (existingStatus !== "granted") {
        // Show a helpful explanation
        const userAgreed = await new Promise((resolve) => {
          Alert.alert(
            "Location Access Needed",
            "We need your location to show nearby specials and offers. Allow location access?",
            [
              { text: "Not Now", style: "cancel", onPress: () => resolve(false) },
              { text: "Allow", onPress: () => resolve(true) },
            ]
          );
        });
    
        if (!userAgreed) {
          setRefreshing(false);
          setLoading(false);
          return;
        }
    
        const { status } = await Location.requestForegroundPermissionsAsync();
    
        if (status !== "granted") {
          // 🛑 NOW the user has seen the system permission prompt
          Alert.alert(
            "Enable Location in Settings",
            "To show nearby specials, please allow location access from Settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
          setRefreshing(false);
          setLoading(false);
          return;
        }
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userLoc);
      console.log("User's location:", userLoc);

      const specialsSnapshot = await getDocs(collection(db, "Specials"));

      const specialsData: (Special | null)[] = await Promise.all(
        specialsSnapshot.docs.map(async (specialDoc) => {
          const specialData = specialDoc.data();
          const location = specialData.location || { latitude: 0, longitude: 0 };

          if (userLoc && !isWithin150km(userLoc, location)) return null;

          const companyImageUrl = specialData.companyImage
            ? await UtilFunctions.fetchLogoUrl(specialData.companyImage)
            : "https://dummyimage.com/300/fff/fff";

          const backgroundImageUrl = specialData.backgroundImage
            ? await UtilFunctions.fetchLogoUrl(specialData.backgroundImage)
            : "https://dummyimage.com/300/fff/fff";

          return {
            id: specialDoc.id,
            companyName: specialData.companyName,
            dealExpiration: specialData.dealExpiration,
            dealDescription: specialData.dealDescription,
            phoneNumber: specialData.phoneNumber,
            companyCoordinates: specialData.companyCoordinates,
            dealType: specialData.dealType,
            location,
            companyImageUrl,
            backgroundImageUrl,
            createdAt: new Date(specialData.createdAt),
            updatedAt: new Date(specialData.updatedAt),
          };
        })
      );

      const filteredSpecials = specialsData.filter(Boolean) as Special[];
      setSpecials(filteredSpecials);
      setOriginalSpecials(filteredSpecials);
    } catch (error) {
      console.error("Error fetching specials or location:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const applySpecialFilter = (option: string) => {
    console.log("Filtering specials for:", option);
  
    let filtered = [...originalSpecials]; // Make sure originalJobs is defined in your component
  
    if (option !== "All") {
      filtered = originalSpecials.filter((special) =>
        special.dealType?.toLowerCase() === option.toLowerCase()
      );
    }
    else {
      filtered = originalSpecials;
    }
  
    setSpecials(filtered);
  };

  const isValidPhoneNumber = (number: string | undefined | null) => {
    return typeof number === 'string' && /^\+?[0-9]{7,15}$/.test(number);
  };

  const isValidCoordinates = (
    coords: { latitude?: number; longitude?: number } | null
  ): coords is { latitude: number; longitude: number } => {
    return (
      coords !== null &&
      typeof coords.latitude === 'number' &&
      typeof coords.longitude === 'number' &&
      coords.latitude >= -90 &&
      coords.latitude <= 90 &&
      coords.longitude >= -180 &&
      coords.longitude <= 180
    );
  };

  const renderItem = ({ item }: { item: Special }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
      <LinearGradient
      colors={['#4898D8', '#50AAD6', '#58BBCF']} // Gradient colors
      style={{ padding: 15, borderRadius: 10, marginBottom: 15, height: 200 }}
    >
        <BackgroundImage source={{ uri: item.backgroundImageUrl || "https://dummyimage.com/300/fff/fff" }} />
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
      <HeadingText>Specials</HeadingText>
      <FlatList
        data={specials}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        refreshing={refreshing}
        onRefresh={fetchUserLocationAndSpecials}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <NoResultsContainer>
              <NoResultsText>No Specials to show</NoResultsText>
            </NoResultsContainer>
          ) : null
        }
      />
      {modalVisible && selectedSpecial && (
      <Modal animationType="slide" transparent visible onRequestClose={closeModal}>
          <ModalOverlay>
            <ModalContainer>
            { /* <BackgroundOverlay /> */ }
            <BackgroundImage source={{ uri: selectedSpecial.backgroundImageUrl || "https://dummyimage.com/300/fff/fff" }} />
              {/* Close Button */}
              <CloseButton onPress={closeModal}>
                <Ionicons name="close" size={24} color="black" />
              </CloseButton>

              {/* Job Details */}
              <SpecialDetails>
                <CompanyInfo>
                  <View>
                    <HeadingTextModal>{selectedSpecial.companyName}</HeadingTextModal>
                  </View>
                  <CompanyLogoContainer>
                    <CompanyLogo source={{ uri: selectedSpecial.companyImageUrl }} />
                  </CompanyLogoContainer>
                </CompanyInfo>
              </SpecialDetails>

              <SpecialDescriptionText>{selectedSpecial.dealDescription}</SpecialDescriptionText>

              {/* Divider */}
              <Divider />

              {/* Job Expiration */}
              <ExpirationText>Deal Expiration: {selectedSpecial.dealExpiration}</ExpirationText>

              {/* Action Buttons */}
              <ButtonContainer>
                <GradientButton
                  title="Directions"
                  onPress={() => {
                    const coords = selectedSpecial?.companyCoordinates;

                    if (!isValidCoordinates(coords)) {
                      Alert.alert('Location Unavailable', 'Map directions are not provided.');
                      return;
                    }

                    const { latitude, longitude } = coords;
                    const url = Platform.select({
                      ios: `http://maps.apple.com/?daddr=${latitude},${longitude}`,
                      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
                    });

                    Linking.openURL(url as string).catch((err) =>
                      Alert.alert('Error', 'Could not open the map.')
                    );
                  }}
                  containerStyle={{ width: 120, height: 80 }}
                />
                <ChatButton
                  onPress={() => {
                    const phoneNumber = selectedSpecial?.phoneNumber;

                    if (!isValidPhoneNumber(phoneNumber)) {
                      Alert.alert('Invalid phone number', 'Phone number is not provided.');
                      return;
                    }

                    Linking.openURL(`tel:${phoneNumber}`);
                  }}
                >
                  <Ionicons name="call" size={34} color="white" />
                </ChatButton>
              </ButtonContainer>
            </ModalContainer>
          </ModalOverlay>
      </Modal>
      )}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <ModalOverlay>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ModalBox>
                <HeadingText>Filter Options</HeadingText>

                {["All", "Hotel", "Food", "Car Rental", "Activities"].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setSelectedOption(option);
                    console.log("Selected Filter:", option);
                    setFilterModalVisible(false);
                    applySpecialFilter(option); 
                  }}
                  style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
                >
                  <RadioCircle selected={selectedOption === option} />
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

export default SpecialsTemp;

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

const NoResultsContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const NoResultsText = styled.Text`
  font-size: 18px;
  color: #999;
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
  padding-bottom: 0px;
`;

const HeadingTextModal = styled.Text`
  font-size: 20px;
  font-weight: bold;
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
  elevation: 5;
  border-width: 0.5px;
  border-color: #000;
`;

const DetailTextModal = styled.Text`
  font-size: 14px;
  color: #666;
`;

const SpecialDetails = styled.View`
  padding: 16px;
`;

const SpecialDescriptionText = styled.Text`
  font-weight: bold;
  text-align: center;
  font-size: 16px;
  margin-vertical: 12px;
  color: #000;
`;

const CompanyInfo = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
`;

const CompanyLogoContainer = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  overflow: hidden;
  background-color: #fff;
  align-items: center;
  justify-content: center;
`;

const CompanyLogo = styled.Image.attrs({
  resizeMode: 'contain',
})`
  width: 100%;
  height: 100%;
`;

const Divider = styled.View`
  height: 1px;
  background-color: #A9A9A9;
  margin-vertical: 10px;
`;

const ExpirationText = styled.Text`
  text-align: center;
  font-size: 14px;
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

const ModalBox = styled.View`
  background-color: white;
  margin: 40px;
  padding: 20px;
  border-radius: 10px;
  elevation: 5;
`;

const RadioCircle = styled.View<{ selected: boolean }>`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  border-width: 2px;
  border-color: #5DCBCF;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  background-color: ${({ selected }) => (selected ? "#5DCBCF" : "transparent")};
`;

const OptionText = styled.Text`
  font-size: 16px;
  color: #333;
`;
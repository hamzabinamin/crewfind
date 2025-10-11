import React, { useEffect, useState } from "react";
import { FlatList, View, Text, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import styled from "styled-components/native";
import GradientButton from './GradientButton';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import LoadingIndicator from "./LoadingIndicator";
import { User } from "../models/User";
import { JobPost } from "../models/JobPost";
import { Airline } from "../models/Airline";
import eventEmitter from "./eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { getAuth } from "firebase/auth";
import { db } from "../../FirebaseConfig";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const Jobs = () => {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [originalJobs, setOriginalJobs] = useState<JobPost[]>([]);
  const [chatIds, setChatIds] = useState<{ [key: string]: string | null }>({});
  const [user, setUser] = useState<User | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const openModal = (jobPost: JobPost) => {
    setSelectedJob(jobPost);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
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
    if (user) {
      fetchJobs();
    }
  }, [user]);


  useEffect(() => {
    const listener = () => {
      console.log("Filter event received in Jobs!");
      setFilterModalVisible(true);
    };
  
    eventEmitter.on("openFilter:Jobs", listener);
  
    return () => {
      eventEmitter.off("openFilter:Jobs", listener);
    };
  }, []);


  const navigateToChat = (recipientId: string, chatId: string) => {    
    router.push({
      pathname: "../../screens/MessageDetail",
      params: { recipientId, chatId }
    });
  };

  const fetchJobs = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const chatIdsStore: { [key: string]: string | null } = {};
      const jobsSnapshot = await getDocs(collection(db, "JobPosts"));
      const jobsData: JobPost[] = await Promise.all(
        jobsSnapshot.docs.map(async (jobDoc) => {
          const jobData = jobDoc.data();
          const airlineID = jobData.airlineID;
          console.log("Fetched Jobs: ", jobData);

          let airlineData: Airline;

          if (airlineID) {
            // Fetch airline details
            const airlineRef = doc(db, "Airlines", airlineID);
            const airlineSnap = await getDoc(airlineRef);

            if (airlineSnap.exists()) {
              const data = airlineSnap.data();
              console.log("Airline data: ", data);

              const logoUrl = data.logoImage ? await UtilFunctions.fetchLogoUrl(data.logoImage) : "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png";
              const backgroundUrl = data.backgroundImage ? await UtilFunctions.fetchLogoUrl(data.backgroundImage) : "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png";

              airlineData = {
                id: airlineSnap.id,
                name: data.name || "Unknown Airline",
                logoImageUrl: logoUrl,
                backgroundImageUrl: backgroundUrl,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
              };

              if (user) {
                console.log("user (Jobs): ", user);
                const chatQuery = query(
                  collection(db, "Chats"),
                  where("participants", "array-contains", user.id) // User must be in participants
                );
    
                const chatSnapshot = await getDocs(chatQuery);
                chatIdsStore[airlineSnap.id] = null; // Default to null
      
                for (const chatDoc of chatSnapshot.docs) {
                  const chatData = chatDoc.data();
                  if (Array.isArray(chatData.participants) && chatData.participants.includes(airlineSnap.id)) {
                    chatIdsStore[airlineSnap.id] = chatDoc.id; // Store chat ID if found
                    console.log("chatIdsStore: ", chatIdsStore);
                    break; // Stop searching once a chat is found
                  }
                }
                setChatIds(chatIdsStore);
              }
            } else {
              airlineData = {
                id: airlineID,
                name: "Unknown Airline",
                logoImageUrl: "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png",
                backgroundImageUrl: "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png",
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
          } else {
            airlineData = {
              id: "unknown",
              name: "Unknown Airline",
              logoImageUrl: "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png",
              backgroundImageUrl: "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }

          return {
            id: jobDoc.id,
            title: jobData.title,
            base: jobData.base,
            jobFor: jobData.jobFor || "N/A",
            jobExpiration: jobData.jobExpiration,
            description: jobData.description,
            jobURL: jobData.jobURL,
            airline: airlineData,
            createdAt: new Date(jobData.createdAt),
            updatedAt: new Date(jobData.updatedAt),
          };
        })
      );

      const sortedJobs = jobsData.sort((a, b) => {
        const nameA = a.airline?.name?.toLowerCase() || '';
        const nameB = b.airline?.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });      

      setJobs(sortedJobs);
      setOriginalJobs(sortedJobs);
      console.log("Chat Ids: ", chatIds);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  
  const applyJobFilter = (option: string) => {
    console.log("Filtering jobs for:", option);
  
    let filtered = [...originalJobs]; // Make sure originalJobs is defined in your component
  
    if (option === "Pilot" || option === "Cabin Crew") {
      filtered = originalJobs.filter((job) =>
        job.jobFor?.toLowerCase() === option.toLowerCase()
      );
    }
    else if (option === "Exclude my Country" && user) {
      const userCountry = user.base; // Replace this with dynamic value if available
      filtered = originalJobs.filter((job) => !job.base.includes(userCountry));
    }
    else {
      filtered = originalJobs;
    }
  
    setJobs(filtered);
  };

  const renderItem = ({ item }: { item: JobPost }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
       <LinearGradient
      colors={['#4898D8', '#50AAD6', '#58BBCF']} // Gradient colors
      style={{ padding: 15, borderRadius: 10, marginBottom: 15, height: 200 }}
      >
        <AirlineImageContainer>
          <AirlineImage source={{ uri: item.airline.logoImageUrl }} />
        </AirlineImageContainer>
        <LeftContainer>
          <AirlineName>{item.airline.name}</AirlineName>
          <BottomLeftDetails>
            <DetailText>{item.title}</DetailText>
            <DetailText>{item.base}</DetailText>
            <DetailText>{item.jobFor}</DetailText>
          </BottomLeftDetails>
        </LeftContainer>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <HeadingText>Job Board</HeadingText>
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        refreshing={refreshing}
        onRefresh={fetchJobs}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
        !loading ? (
          <NoResultsContainer>
            <NoResultsText>No Jobs to show</NoResultsText>
          </NoResultsContainer>
          ) : null
        }
      />
      <Modal animationType="slide" transparent visible={modalVisible}>
        {selectedJob && (
          <ModalOverlay>
            <ModalContainer>
              {/* Background Image */}
              <BackgroundImage source={{ uri: selectedJob.airline.backgroundImageUrl || "https://dummyimage.com/300/fff/fff" }} />

              {/* Close Button */}
              <CloseButton onPress={closeModal}>
                <Ionicons name="close" size={24} color="black" />
              </CloseButton>

              {/* Job Details */}
              <JobDetails>
                <CompanyInfo>
                  <View>
                    <HeadingTextModal>{selectedJob.airline.name}</HeadingTextModal>
                    <DetailTextModal>Title: {selectedJob.title}</DetailTextModal>
                    <DetailTextModal>Base: {selectedJob.base}</DetailTextModal>
                    <DetailTextModal>For: {selectedJob.jobFor}</DetailTextModal>
                  </View>
                  <AirlineImageSecondContainer>
                    <AirlineImage source={{ uri: selectedJob.airline.logoImageUrl }} />
                  </AirlineImageSecondContainer>
                </CompanyInfo>
              </JobDetails>

              <JobDescriptionText>{selectedJob.description}</JobDescriptionText>

              {/* Divider */}
              <Divider />

              {/* Job Expiration */}
              <ExpirationText>Job Expires: {selectedJob.jobExpiration}</ExpirationText>

              {/* Action Buttons */}
              <ButtonContainer>
              <GradientButton
                  title="Apply"
                  onPress={() => {
                    const url = selectedJob?.jobURL;

                    if (url && typeof url === 'string' && url.startsWith('http')) {
                      Linking.openURL(url).catch(() => {
                        Alert.alert("Error", "Unable to open the job URL.");
                      });
                    } else {
                      Alert.alert("Invalid URL", "No url is provided or the provided job url is not valid");
                    }
                  }}
                  containerStyle={{ width: 80, height: 80 }}
                />
                <ChatButton
                  onPress={() => {
                    closeModal();
                    navigateToChat(selectedJob.airline.id ?? "", chatIds[selectedJob.airline.id ?? ""] ?? "");
                  }}
                >
                  <Ionicons name="mail" size={38} color="white" />
                </ChatButton>
              </ButtonContainer>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Modal>
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

                {["All", "Exclude my Country", "Pilot", "Cabin Crew"].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setSelectedOption(option);
                    console.log("Selected Filter:", option);
                    setFilterModalVisible(false);
                    applyJobFilter(option); 
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

export default Jobs;

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

const AirlineImageSecondContainer = styled.View`
  position: absolute;
  top: 10px; 
  right: 10px;
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
  background-color: rgba(0, 0, 0, 0.5);
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
  font-size: 24px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 5px;
`;

const BackgroundImage = styled.Image`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3; /* Adjust opacity to make content readable */
`;

const CloseButton = styled.Pressable`
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #fff;
  border-radius: 25px;
  elevation: 5;
  border-width: 0.5px;
  border-color: #000;
`;

const DetailTextModal = styled.Text`
  font-size: 14px;
  color: #666;
`;

const JobDetails = styled.View`
  padding: 16px;
  margin-top: 10px;
`;

const JobDescriptionText = styled.Text`
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
  background-color: #ddd;
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
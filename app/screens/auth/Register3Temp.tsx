import { View, Dimensions, Modal, FlatList, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import styled from 'styled-components/native';
import GradientButton from "../../utilities/GradientButton";
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRouter, useLocalSearchParams } from "expo-router";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db } from '../../../FirebaseConfig'

const screenWidth = Dimensions.get('window').width;

const Register3 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userString = typeof params.user === "string" ? params.user : null;
  const [user, setUser] = useState<User>(userString ? JSON.parse(userString) : {});
  const cameFromSettings = params.cameFromSettings === "true";
  console.log("Params Register3", params);
  console.log("cameFromSettings", cameFromSettings);
  console.log("Received User: ", user);

  const [licenses, setLicenses] = useState<string[]>([]); // License input field
  const [licenseType, setLicenseType] = useState(""); // Store selected license types
  const [experiences, setExperiences] = useState<string[]>([]);
  const [flyingHoursPIC, setFlyingHoursPIC] = useState(""); // Flying hours PIC field
  const [flyingHoursTotal, setFlyingHoursTotal] = useState(""); // Flying hours Total field
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [showLicenseModal, setShowLicenseModal] = useState(false); // Show License modal flag
  const [showLicenseTypeModal, setShowLicenseTypeModal] = useState(false); // Show License Type modal flag
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const firestore = getFirestore(); // Firestore instance
  const storage = getStorage(); // Firebase Storage instance

  const licenseOptions = [
    "ICAO", "FAA", "EASA", "Transport Canada", "DGCA", "ANAC", "CASA", "JAA"
  ];

  const licenseTypeOptions = [
    "Airline", "Commercial", "Private", "Cabin Crew"
  ];

  const experienceOptions = [
    "Boeing Widebody", "Airbus Widebody", "Boeing Narrowbody", "Airbus Narrowbody", 
    "Single Piston", "Multi Piston", "Single Turbine", "Multi Turbine", 
    "Corporate Jets < 20 Tons", "Corporate Jets > 20 Tons", "Military Jets"
  ];

  useEffect(() => {
    console.log("Inside Register's useEffect");
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("Stored User: ", storedUser);
      if (storedUser && cameFromSettings) {
        setUser(storedUser);
        updateFieldsForEdit(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

  const updateFieldsForEdit = (user: User) => {
    setLicenses(user.licenses);
    setLicenseType(user.licenseType);
    setExperiences(user.experiences);
    setFlyingHoursPIC(user.flyingHoursPIC ? String(user.flyingHoursPIC) : "");
    setFlyingHoursTotal(user.flyingHoursTotal ? String(user.flyingHoursTotal) : "");
  };

  const uploadImageToFirebase = async (uri: string, userId: string, imageType: "profileImage" | "backgroundImage") => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const timestamp = Date.now();
      const filePath = `Users/${imageType === "profileImage" ? "profileImages" : "backgroundImages"}/${timestamp}-${userId}-${imageType}.jpg`;
      const storageRef = ref(getStorage(), filePath);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      return null;
    }
  };
  
  const handleStep2Press = async () => {
    // Validation
    if(licenses.length === 0) {
      Alert.alert("Validation Error", "Please select at least one license.");
      return;
    }

    if(licenseType.length === 0) {
      Alert.alert("Validation Error", "Please select at least one license type.");
      return;
    }

    if(experiences.length === 0) {
      Alert.alert("Validation Error", "Please enter at least one experience.");
      return;
    }

    if(!flyingHoursPIC || isNaN(parseInt(flyingHoursPIC))) {
      Alert.alert("Validation Error", "Please enter valid flying hours.");
      return;
    }

    if(!flyingHoursTotal || isNaN(parseInt(flyingHoursTotal))) {
      Alert.alert("Validation Error", "Please enter valid flying hours.");
      return;
    }

    const parsedFlyingHoursPIC = typeof flyingHoursPIC === "string" ? parseInt(flyingHoursPIC) : flyingHoursPIC;
    const parsedFlyingHoursTotal = typeof flyingHoursTotal === "string" ? parseInt(flyingHoursTotal) : flyingHoursTotal;

    if(user) {
      const updatedUser = {
        ...user,
        licenses: licenses,
        licenseType: licenseType,
        experiences: experiences,
        flyingHoursPIC: parsedFlyingHoursPIC, // Ensure flyingHours is a number
        flyingHoursTotal: parsedFlyingHoursTotal, // Ensure flyingHours is a number
      };
      console.log("User before saving: ", updatedUser);
      if(cameFromSettings) {
        try {
          setLoading(true);
          if (user?.id) {
            const userRef = doc(db, "Users", user.id);
            await updateDoc(userRef, {
              licenses,
              licenseType,
              experiences,
              flyingHoursPIC: parsedFlyingHoursPIC,
              flyingHoursTotal: parsedFlyingHoursTotal,
            });
            UtilFunctions.saveUser(updatedUser);
          }
        } catch (error) {
          console.error("Error updating profile:", error);
          Alert.alert("Error", "Failed to update profile. Please try again.");
          return;
        }
        finally {
          setLoading(false);
        } 
      }
      else {
        try {
          if (!updatedUser.email || !updatedUser.password) {
            throw new Error("Email and password are required for registration.");
          }
          setLoading(true);
          const userCredential = await createUserWithEmailAndPassword(auth, updatedUser.email, updatedUser.password);
          const createdUser = userCredential.user;
    
          if(!createdUser) {
            throw new Error("Failed to create user in Firebase Authentication.");
          }
          updatedUser.id = createdUser.uid 

          const profileImageUrl = updatedUser.profileImageObject
          ? await uploadImageToFirebase(updatedUser.profileImageObject, updatedUser.id, "profileImage")
          : null;

          const backgroundImageUrl = updatedUser.backgroundImageObject
          ? await uploadImageToFirebase(updatedUser.backgroundImageObject, updatedUser.id, "backgroundImage")
            : null;
    
          updatedUser.profileImage = profileImageUrl || "";
          updatedUser.backgroundImage = backgroundImageUrl || "";

          delete updatedUser.profileImageObject;
          delete updatedUser.backgroundImageObject;
          delete updatedUser.id;
          delete updatedUser.password;

          const userRef = doc(firestore, "Users", createdUser.uid);
          await setDoc(userRef, updatedUser);
          
          const userDoc = await getDoc(userRef); // Use getDoc to retrieve the document
          if (!userDoc.exists()) {
            throw new Error("Failed to save user data in Firestore.");
          } 

          const userData = userDoc.data();
       
          const registeredUser: User = {
            id: createdUser.uid,
            name: userData.name || "",
            surName: userData.surName || "",
            email: userData.email || "",
            password: "", 
            base: userData.base || "",
            nationality: userData.nationality || "",
            position: userData.position || "",
            companyName: userData.companyName || "",
            age: userData.age || 0,
            sex: userData.sex || "",
            relationshipStatus: userData.relationshipStatus || "",
            hobbies: userData.hobbies || [],
            profileImage: profileImageUrl || "",
            backgroundImage: backgroundImageUrl || "",
            licenses: userData.licenses || [],
            licenseType: userData.licenseType || "",
            experiences: userData.experiences || [],
            flyingHoursPIC: userData.flyingHoursPIC || 0,
            flyingHoursTotal: userData.flyingHoursTotal || 0,
            yearsOfExperience: userData.yearsOfExperience || 0,
            friends: userData.friends,
            blocked: userData.blocked,
            lastSeen: userData.lastSeen ? userData.lastSeen.toDate?.() ?? new Date(userData.lastSeen) : null,
            createdAt: userData.createdAt && userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(),
            updatedAt: userData.updatedAt && userData.updatedAt.toDate ? userData.updatedAt.toDate() : new Date()
          };

          console.log("Registered User id: ", registeredUser.id);
          UtilFunctions.saveUser(registeredUser);
          router.replace("../../(drawer)/(tabs)/Home")
        }
        catch (error: any) {
          console.error("Error creating user:", error.message);
          Alert.alert("Error", error.message || "Failed to create user");
        } finally {
          setLoading(false); // Hide loading indicator
        }
      }
    }
  };

  const handleLicenseSelect = (license: string) => {
    if (!licenses.includes(license)) {
      if (licenses.length < 3) {
        setLicenses([...licenses, license]);
      } else {
        Alert.alert("Limit Exceeded", "You can only select up to 3 licenses.");
      }
    }
    setShowLicenseModal(false);
  };

  const handleLicenseTypeSelect = (licenseType: string) => {
    setLicenseType(licenseType); // Set the selected license type directly
    setShowLicenseTypeModal(false); // Close the modal after selection
  };

  const handleExperienceSelect = (experience: string) => {
    if (!experiences.includes(experience)) {
      if (experiences.length < 5) {
        setExperiences([...experiences, experience]);
      } else {
        Alert.alert("Limit Exceeded", "You can only select up to 5 experiences.");
      }
    }
    setShowExperienceModal(false);
  };

  const handleTagDelete = (license: string) => {
    setLicenses(licenses.filter(item => item !== license));
  };

  const handleExperienceTagDelete = (experience: string) => {
    setExperiences(experiences.filter(item => item !== experience));
  };

  return (
    <DismissKeyboardView>
        <Container>
        {loading && <LoadingIndicator />}
        <ImageContainer>
          <AirplaneImage source={require('../../../assets/images/airplane-login.jpg')} resizeMode="cover" />  
          <Overlay />
        </ImageContainer>
        <HeadingText>
          {cameFromSettings ? "Experience " : "Create an  "}
          <BlueText>{cameFromSettings ? "Management!" : "Account!"}</BlueText>
        </HeadingText>
        <ScrollView style={{ flex: 1, width: '100%', marginTop: 140 }} contentContainerStyle={{ alignItems: 'center' }}>
          <Form>
            {/* License Input */}
            <TouchableOpacity onPress={() => setShowLicenseModal(true)}>
              <InputContainer>
                <StyledIconEmail name="id-card" size={20} color="#999999" />
                <Input
                  placeholder="License"
                  placeholderTextColor="#999999"
                  value=""
                  editable={false}
                  pointerEvents="none"
                />
                <DropdownIconContainer>
                  <Icon name="caret-down" size={20} color="#999999" />
                </DropdownIconContainer>
              </InputContainer>
            </TouchableOpacity>

            <TagsContainer>
              {licenses.length > 0 &&
                licenses.map((type) => (
                  <Tag key={type}>
                    <TagText>{type}</TagText>
                    <TagDeleteButton onPress={() => handleTagDelete(type)}>
                      <Icon name="times" size={14} color="white" />
                    </TagDeleteButton>
                  </Tag>
                ))}
            </TagsContainer>

            {/* License Type with Tags */}
            <TouchableOpacity onPress={() => setShowLicenseTypeModal(true)}>
              <InputContainer>
                <StyledIconEmail name="clipboard" size={20} color="#999999" />
                <Input
                  placeholder="License Type"
                  placeholderTextColor="#999999"
                  keyboardType="default"
                  value={licenseType}
                  editable={false}
                  pointerEvents="none"
                />
                <Icon name="caret-down" size={20} color="#999999" />
              </InputContainer>
            </TouchableOpacity>

            {/* Experience Input */}
            <TouchableOpacity onPress={() => setShowExperienceModal(true)}>
              <InputContainer>
                <StyledIconEmail name="briefcase" size={20} color="#999999" />
                <Input
                  placeholder="Experience"
                  placeholderTextColor="#999999"
                  editable={false}
                  pointerEvents="none"
                />
                <Icon name="caret-down" size={20} color="#999999" />
              </InputContainer>
            </TouchableOpacity>

            <TagsContainer>
              {experiences.map((experience) => (
                <Tag key={experience}>
                  <TagText>{experience}</TagText>
                  <TagDeleteButton onPress={() => handleExperienceTagDelete(experience)}>
                    <Icon name="times" size={14} color="white" />
                  </TagDeleteButton>
                </Tag>
              ))}
            </TagsContainer>

            {user.position !== "Cabin Crew" ? (
            <>
            {/* Flying Hours PIC Input */}
            <InputContainer>
              <StyledIconEmail name="tachometer" size={20} color="#999999" />
              <Input
                placeholder="Flying Hours PIC"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                value={flyingHoursPIC}
                onChangeText={setFlyingHoursPIC}
              />
            </InputContainer>

            {/* Flying Hours Total Input */}
            <InputContainer>
              <StyledIconEmail name="tachometer" size={20} color="#999999" />
              <Input
                placeholder="Flying Hours Total"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                value={flyingHoursTotal}
                onChangeText={setFlyingHoursTotal}
              />
            </InputContainer>
            </>
            ) : (
              <>
            {/* Years of Experience Input (for Cabin Crew) */}
            <InputContainer>
              <StyledIconEmail name="history" size={20} color="#999999" />
              <Input
                placeholder="Years of Experience"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                onChangeText={setYearsOfExperience}
                value={yearsOfExperience}
              />
            </InputContainer>
            </>
            )}
            {/* Register Button */}
            <GradientButton title={cameFromSettings ? "Save" : "Register"} onPress={handleStep2Press} />
          </Form>
        </ScrollView>

        {/* License Modal */}
        <Modal transparent={true} visible={showLicenseModal} animationType="slide">
          <ModalOverlay>
            <ModalContent>
              <FlatList
                data={licenseOptions}
                renderItem={({ item }) => (
                  <Option onPress={() => handleLicenseSelect(item)}>
                    <OptionText>{item}</OptionText>
                  </Option>
                )}
                keyExtractor={(item) => item}
              />
              <CloseButton onPress={() => setShowLicenseModal(false)}>
                <CloseButtonText>Cancel</CloseButtonText>
              </CloseButton>
            </ModalContent>
          </ModalOverlay>
        </Modal>

        {/* License Type Modal */}
        <Modal transparent={true} visible={showLicenseTypeModal} animationType="slide">
          <ModalOverlay>
            <ModalContent>
              <FlatList
                data={licenseTypeOptions}
                renderItem={({ item }) => (
                  <Option onPress={() => handleLicenseTypeSelect(item)}>
                    <OptionText>{item}</OptionText>
                  </Option>
                )}
                keyExtractor={(item) => item}
              />
              <CloseButton onPress={() => setShowLicenseTypeModal(false)}>
                <CloseButtonText>Cancel</CloseButtonText>
              </CloseButton>
            </ModalContent>
          </ModalOverlay>
        </Modal>

        {/* Experience Modal */}
        <Modal transparent={true} visible={showExperienceModal} animationType="slide">
          <ModalOverlay>
            <ModalContent>
              <FlatList
                data={experienceOptions}
                renderItem={({ item }) => (
                  <Option onPress={() => handleExperienceSelect(item)}>
                    <OptionText>{item}</OptionText>
                  </Option>
                )}
                keyExtractor={(item) => item}
              />
              <CloseButton onPress={() => setShowExperienceModal(false)}>
                <CloseButtonText>Cancel</CloseButtonText>
              </CloseButton>
            </ModalContent>
          </ModalOverlay>
        </Modal>
        {/* Loading Indicator */}
        {loading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Dull the background
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999, // Ensure the loader is on top of everything else
            }}
          >
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
      </Container>
    </DismissKeyboardView>
  );
};

export default Register3;

const Container = styled.View`
  flex: 1;
  background-color: #F8F9FC;
  align-items: center;
  justify-content: center;
`;

const ImageContainer = styled.View`
  position: absolute;
  top: 0;
  width: ${screenWidth}px;
  height: 300px;
`;

const AirplaneImage = styled.Image`
  width: ${screenWidth}px;
  height: 300px;
  margin-bottom: 20px;
  position: absolute;
  top: 0;
`;

const Overlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
`;

const HeadingText = styled.Text`
  position: absolute;
  top: 100px;
  margin-left: 20px;
  margin-bottom: 30px;
  font-size: 44px;
  font-weight: bold;
  color: #FFF;
`;

const BlueText = styled.Text`
  color: #5DCBCF;
`;

const Form = styled.View`
  margin-top: 125px;
  width: 80%;
  max-width: 400px;
  align-items: center;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 60px;
  background-color: #FFFFFF;
  border-radius: 10px;
  padding-horizontal: 10px;
  margin-bottom: 8px;
`;

const StyledIconEmail = styled(Icon)`
  margin-right: 10px;
`;

const Input = styled.TextInput`
  flex: 1;
  height: 60px;
  padding: 12px;
  margin: 8px 0;
  border-radius: 15px;
  font-size: 16px;
  color: #000;
  background-color: #FFFFFF;
`;

const TagsContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap; /* Wrap tags to the next line when necessary */
  margin-top: 0px; /* Add some space between the input and tags */
  padding: 0px;
  background-color: #f8f9fc; /* Optional background for distinction */
  border-radius: 10px; /* Optional rounded corners */
`;

const Tag = styled.View`
  background-color: #5dcbcf;
  border-radius: 15px;
  padding: 5px 10px;
  margin-right: 5px;
  margin-bottom: 5px;
  flex-direction: row;
  align-items: center;
`;

const TagText = styled.Text`
  color: white;
  font-size: 14px;
`;

const TagDeleteButton = styled.TouchableOpacity`
  margin-left: 5px;
`;

const DropdownIconContainer = styled.TouchableOpacity`
  position: absolute;
  right: 10px;
  top: 50%; /* Vertically center the icon relative to the InputContainer */
  transform: translateY(-10px); /* Offset for proper centering */
`;

const ModalOverlay = styled.View`
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  width: 100%;
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  justify-content: center;
  max-height: 60%;
`;

const Option = styled.TouchableOpacity`
  padding: 15px;
`;

const OptionText = styled.Text`
  font-size: 18px;
`;

const CloseButton = styled.TouchableOpacity`
  padding: 15px;
  background-color: red;
  border-radius: 10px;
  width: 100%;
  align-items: center;
  margin-top: 10px;
`;

const CloseButtonText = styled.Text`
  color: white;
  font-size: 16px;
`;

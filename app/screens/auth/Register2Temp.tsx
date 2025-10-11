import { Dimensions, Alert, Modal, TouchableOpacity, Text, View, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import styled from "styled-components/native";
import * as ImagePicker from "expo-image-picker";
import GradientButton from "../../utilities/GradientButton";
import GradientButtonWithArrow from "../../utilities/GradientButtonWithArrow";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter, useLocalSearchParams } from "expo-router";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, getStorage, deleteObject, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../FirebaseConfig";

const screenWidth = Dimensions.get("window").width;

interface ProfileImage {
  uri: string;
}

interface BackgroundImage {
  uri: string;
}

const Register2 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userString = typeof params.user === "string" ? params.user : null;
  const [user, setUser] = useState<User>(userString ? JSON.parse(userString) : {});
  const [loading, setLoading] = useState(false);
  console.log("Received User: ", user);

  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImage | null>(null);
  const [profileImageChanged, setProfileImageChanged] = useState(false);
  const [backgroundImageChanged, setBackgroundImageChanged] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageType, setImageType] = useState<"profile" | "background" | null>(null);
  const cameFromSettings = params.cameFromSettings === "true";
  console.log("Params Register2", params);
  console.log("cameFromSettings", cameFromSettings);

  useEffect(() => {
    console.log("Inside Register(2) useEffect");
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

  // Request camera and gallery permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== "granted" || galleryStatus !== "granted") {
        Alert.alert("Permission Denied", "You need to grant camera and gallery permissions.");
      }
    };
    requestPermissions();
  }, []);

  const updateFieldsForEdit = (user: User) => {
    setProfileImage(user.profileImage ? { uri: user.profileImage } : null);
    setBackgroundImage(user.backgroundImage ? { uri: user.backgroundImage } : null);
  };

  const pickImage = async (type: "camera" | "gallery") => {
    let result;

    if (type === "camera") {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
    } else if (type === "gallery") {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
    }

    if(result && !result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = { uri: result.assets[0].uri };

      if(imageType === "profile") {
        setProfileImage(selectedImage);
        setProfileImageChanged(true);
        setUser((prevUser: User) => ({ ...prevUser, profileImageObject: selectedImage.uri })); // Update user object with profile image
      } else if(imageType === "background") {
        setBackgroundImage(selectedImage);
        setBackgroundImageChanged(true);
        setUser((prevUser: User) => ({ ...prevUser, backgroundImageObject: selectedImage.uri })); // Update user object with background image
      }
    } else {
      console.log("No image was selected or the operation was canceled.");
    }

    // Close the modal after selecting an image
    setShowModal(false);
  };

  const handleStep3Press = async () => {
    if (!profileImage || !backgroundImage) {
      Alert.alert("Validation Error", "Both images are required.");
      return;
    }

    if(cameFromSettings) {
      try {
        if (!user.id) {
          throw new Error("User id is required for registration.");
        }
        setLoading(true);
        const userRef = doc(db, "Users", user.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const oldProfileUrl = userData.profileImage;
          const oldBackgroundUrl = userData.backgroundImage;

          // Function to delete old image from Firebase Storage
          const deleteOldImage = async (imageUrl: string) => {
            if (imageUrl) {
              const imageRef = ref(storage, imageUrl);
              try {
                await deleteObject(imageRef);
                console.log(`Deleted old image: ${imageUrl}`);
              } catch (error) {
                console.error("Error deleting old image:", error);
              }
            }
          };

          // Function to upload a new image and get the URL
          const uploadNewImage = async (imageUri: string, imageType: "profileImage" | "backgroundImage") => {
            const timestamp = Date.now();
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const path = `Users/${imageType === "profileImage" ? "profileImages" : "backgroundImages"}`;
            const fileName = `${timestamp}-${user.id}-${imageType}.jpg`;
            const imageRef = ref(storage, `${path}/${fileName}`);
            await uploadBytes(imageRef, blob);
            return await getDownloadURL(imageRef);
          };

          const updatedData: Partial<User> = {};

          // Delete and upload only if the image has changed
          if (profileImageChanged) {
            await deleteOldImage(oldProfileUrl);
            updatedData.profileImage = await uploadNewImage(profileImage.uri, "profileImage");
          }

          if (backgroundImageChanged) {
            await deleteOldImage(oldBackgroundUrl);
            updatedData.backgroundImage = await uploadNewImage(backgroundImage.uri, "backgroundImage");
          }

          // Update Firestore with new image URLs
          if (Object.keys(updatedData).length > 0) {
            await updateDoc(userRef, updatedData);
            Alert.alert("Success", "Images updated successfully!");
          }
        }
      } catch (error) {
        console.error("Error updating profile images:", error);
        Alert.alert("Error", "Failed to update profile images. Please try again.");
        return;
      }
      finally {
        setLoading(false);
      }
    }
    else {
      // Navigate to Register3 with the updated user object
      router.push({
        pathname: "./Register3",
        params: { user: JSON.stringify(user) }, // Pass the updated user object with images
      });
    }
  };

  const openImagePicker = (type: "profile" | "background") => {
    setImageType(type);
    setShowModal(true); // Show modal to select camera or gallery
  };

  return (
    <DismissKeyboardView>
      <Container>
        {loading && <LoadingIndicator />}
        <ImageContainer>
          <AirplaneImage source={require("../../../assets/images/airplane-login.jpg")} resizeMode="cover" />
          <Overlay />
        </ImageContainer>
        <HeadingText>
        {cameFromSettings ? (
          <>
          Profile <BlueText>Management</BlueText>
        </>
        ) : (
          <>
          Create an <BlueText>Account!</BlueText>
        </>
        )}
        </HeadingText>
        <Form>
          {/* Profile Image Upload */}
          <InputContainer>
            <StyledIconEmail name="user-circle" size={20} color="#999999" />
            <Input placeholder="Profile Image" placeholderTextColor="#999999" editable={false} />
            <TouchableOpacity onPress={() => openImagePicker("profile")}>
              {profileImage ? (
                <Thumbnail source={{ uri: profileImage.uri }} />
              ) : (
                <StyledIconEmail name="upload" size={20} color="#999999" />
              )}
            </TouchableOpacity>
          </InputContainer>

          {/* Profile Background Upload */}
          <InputContainer>
            <StyledIconEmail name="image" size={20} color="#999999" />
            <Input placeholder="Profile Background" placeholderTextColor="#999999" editable={false} />
            <TouchableOpacity onPress={() => openImagePicker("background")}>
              {backgroundImage ? (
                <Thumbnail source={{ uri: backgroundImage.uri }} />
              ) : (
                <StyledIconEmail name="upload" size={20} color="#999999" />
              )}
            </TouchableOpacity>
          </InputContainer>

          {cameFromSettings ? ( <GradientButton title="Save" onPress={handleStep3Press} /> ) : (
            <GradientButtonWithArrow title="Step 3 of 3" onPress={handleStep3Press} /> )}
        </Form>

        {/* Modal for Camera or Gallery Selection */}
        <Modal transparent={true} visible={showModal} animationType="slide">
          <ModalOverlay />
          <ModalContent>
            <ModalOption onPress={() => pickImage("camera")}>
              <OptionText>Camera</OptionText>
            </ModalOption>
            <ModalOption onPress={() => pickImage("gallery")}>
              <OptionText>Gallery</OptionText>
            </ModalOption>
            <CloseButton onPress={() => setShowModal(false)}>
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </CloseButton>
          </ModalContent>
        </Modal>
      </Container>
    </DismissKeyboardView>
  );
};

export default Register2;

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fc;
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
  color: #fff;
`;

const BlueText = styled.Text`
  color: #5dcbcf;
`;

const Form = styled.View`
  margin-top: -10px;
  width: 80%;
  max-width: 400px;
  align-items: center;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 60px;
  background-color: #ffffff;
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
  background-color: #ffffff;
`;

const Thumbnail = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 5px;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5); /* Dim the background */
`;

const ModalContent = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  elevation: 5; /* Adds shadow on Android */
`;

const ModalOption = styled.TouchableOpacity`
  background-color: #ffffff;
  padding: 15px;
  margin-bottom: 0; /* Removed margin-bottom for no gap between buttons */
  border-radius: 10px;
  width: 100%;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #ddd;
`;

const OptionText = styled.Text`
  font-size: 18px;
  color: #000;
`;

const CloseButton = styled.TouchableOpacity`
  padding: 15px;
  background-color: red;
  border-radius: 10px;
  width: 100%;
  align-items: center;
  margin-top: 10px;
`;

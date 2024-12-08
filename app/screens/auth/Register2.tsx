import { Dimensions, Alert, Modal, TouchableOpacity, Text, View, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import styled from "styled-components/native";
import * as ImagePicker from "expo-image-picker";
import GradientButtonWithArrow from "@/src/utilities/GradientButtonWithArrow";
import Icon from "react-native-vector-icons/FontAwesome";
import { User } from "../../../src/models/User";
import { useRouter, useLocalSearchParams } from "expo-router";

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
  console.log("Received User: ", user);

  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageType, setImageType] = useState<"profile" | "background" | null>(null);

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
        setUser((prevUser: User) => ({ ...prevUser, profileImage: selectedImage })); // Update user object with profile image
      } else if(imageType === "background") {
        setBackgroundImage(selectedImage);
        setUser((prevUser: User) => ({ ...prevUser, backgroundImage: selectedImage })); // Update user object with background image
      }
    } else {
      console.log("No image was selected or the operation was canceled.");
    }

    // Close the modal after selecting an image
    setShowModal(false);
  };

  const handleStep3Press = () => {
    if (!profileImage || !backgroundImage) {
      Alert.alert("Validation Error", "Both images are required.");
      return;
    }

    // Navigate to Register3 with the updated user object
    router.push({
      pathname: "./Register3",
      params: { user: JSON.stringify(user) }, // Pass the updated user object with images
    });
  };

  const openImagePicker = (type: "profile" | "background") => {
    setImageType(type);
    setShowModal(true); // Show modal to select camera or gallery
  };

  return (
    <Container>
      <ImageContainer>
        <AirplaneImage source={require("../../../assets/images/airplane-login.jpg")} resizeMode="cover" />
        <Overlay />
      </ImageContainer>
      <HeadingText>
        Create an <BlueText>Account!</BlueText>
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

        <GradientButtonWithArrow title="Step 3 of 3" onPress={handleStep3Press} />
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

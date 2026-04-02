import React, { useState, useEffect } from "react";
import {
  Dimensions,
  Alert,
  Modal,
  Text,
  Platform,
  TouchableOpacity,
  View,
  ScrollView,
  Linking,
  KeyboardAvoidingView
} from "react-native";
import styled from "styled-components/native";
import Icon from "react-native-vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { User } from "../../models/User";
import eventEmitter from "../../utilities/eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from "react-native-fast-image";
import DismissKeyboardView from "../../../components/DismissKeyboardView";
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { ref, getStorage, deleteObject, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../../FirebaseConfig";
import LoadingIndicator from "../../utilities/LoadingIndicator";

const Register3 = () => {
  const router = useRouter();
  const navigation = useNavigation(); 
  const params = useLocalSearchParams();
  const userString = typeof params.user === "string" ? params.user : null;
  const [user, setUser] = useState<User>(userString ? JSON.parse(userString) : {});
  const [loading, setLoading] = useState(false);

  const [profileImage, setProfileImage] = useState<{ uri: string } | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<{ uri: string } | null>(null);
  const [profileImageChanged, setProfileImageChanged] = useState(false);
  const [backgroundImageChanged, setBackgroundImageChanged] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageType, setImageType] = useState<"profile" | "background" | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const isFromSettings = params.cameFromSettings === "true";
  const isFromLogin = params.cameFromLogin === "true";
  const insets = useSafeAreaInsets();
  const firestore = getFirestore();

  useEffect(() => {
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      if (storedUser && (isFromSettings || isFromLogin)) {
        console.log("Stored Profile Image: ", storedUser.profileImage);
        console.log("Stored Background Image: ", storedUser.backgroundImage); 
        setUser(storedUser);
        updateFieldsForEdit(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

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

  useEffect(() => {
    let headerTitle = "Create Account";

    if (isFromLogin) {
      headerTitle = "Complete Your Profile";
    }
    else if (isFromSettings) {
      headerTitle = "Profile Management";
    }
    navigation.setOptions({
      headerTitle: headerTitle
    });
  }, [navigation, isFromSettings, isFromLogin]);

  const updateFieldsForEdit = (user: User) => {
    setProfileImage(user.profileImage ? { uri: user.profileImage } : null);
    setBackgroundImage(user.backgroundImage ? { uri: user.backgroundImage } : null);
  };

  const pickImage = async (type: "camera" | "gallery") => {
    let result;
    if (type === "camera") {
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    }

    if (result && !result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = { uri: result.assets[0].uri };
      if (imageType === "profile") {
        setProfileImage(selectedImage);
        setProfileImageChanged(true);
        setUser((prevUser: User) => ({ ...prevUser, profileImageObject: selectedImage.uri }));
      } else if (imageType === "background") {
        setBackgroundImage(selectedImage);
        setBackgroundImageChanged(true);
        setUser((prevUser: User) => ({ ...prevUser, backgroundImageObject: selectedImage.uri }));
      }
    }
    setShowModal(false);
  };

  const uploadNewImage = async (uri: string, type: "profileImage" | "backgroundImage") => {
    const timestamp = Date.now();
    const blob = await (await fetch(uri)).blob();
    const fileName = `${timestamp}-${user.id}-${type}.jpg`;
    const imageRef = ref(storage, `Users/${type === "profileImage" ? "profileImages" : "backgroundImages"}/${fileName}`);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleCompleteRegistration = async () => {
    if (!profileImage || !backgroundImage) {
      Alert.alert("Validation Error", "Both images are required.");
      return;
    }

    // Validate terms acceptance only during login/registration
   if (!isFromSettings && !termsAccepted) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    
    if (isFromSettings) {
      try {
        if (!user.id) throw new Error("User id is required.");
        setLoading(true);
        const userRef = doc(db, "Users", user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const deleteOldImage = async (url: string) => {
            if (url) {
              try {
                await deleteObject(ref(storage, url));
              } catch (error) {
                console.error("Error deleting old image:", error);
              }
            }
          };
          const updatedData: Partial<User> = {};
          if (profileImageChanged) {
            await deleteOldImage(userData.profileImage);
            updatedData.profileImage = await uploadNewImage(profileImage!.uri, "profileImage");
          }
          if (backgroundImageChanged) {
            await deleteOldImage(userData.backgroundImage);
            updatedData.backgroundImage = await uploadNewImage(backgroundImage!.uri, "backgroundImage");
          }
          if (Object.keys(updatedData).length > 0) {
            await updateDoc(userRef, updatedData);
            const updatedUser = { ...user, ...updatedData };
            await UtilFunctions.saveUser(updatedUser);
            eventEmitter.emit("userProfileUpdated", updatedUser);

            Alert.alert("Success", "Profile updated successfully!");
          }
        }
      } catch (e) {
        Alert.alert("Error", "Could not update images.");
      } finally {
        setLoading(false);
      }
    } 
    else {
      try {
        setLoading(true);

        let createdUser = null;

        if (isFromLogin) {
          // Already authenticated with Google, get the current Firebase user
          createdUser = auth.currentUser;
          if (!createdUser) {
            throw new Error("No authenticated Google user found.");
          }
          user.id = createdUser.uid;
        } else {
          // Normal email/password signup
          if (!user.email || !user.password) {
            throw new Error("Email and password are required for registration.");
          }
          const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
          createdUser = userCredential.user;

          if (!createdUser) {
            throw new Error("Failed to create user in Firebase Authentication.");
          }
          user.id = createdUser.uid;
        }

        // Upload profile and background images (if any)
        const profileImageUrl = user.profileImageObject
          ? await uploadNewImage(user.profileImageObject, "profileImage")
          : user.profileImage || "";

        const backgroundImageUrl = user.backgroundImageObject
          ? await uploadNewImage(user.backgroundImageObject, "backgroundImage")
          : null;

        user.profileImage = profileImageUrl || "";
        user.backgroundImage = backgroundImageUrl || "";
        let storeId = user.id;

        delete user.profileImageObject;
        delete user.backgroundImageObject;
        delete user.password;
        delete user.id;

        const userRef = doc(firestore, "Users", storeId);
        // Use setDoc with { merge: true } to avoid overwriting existing Google account data
        await setDoc(userRef, user, { merge: true });

        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          throw new Error("Failed to save user data in Firestore.");
        }

      /*  const userData = userDoc.data();

        const registeredUser: User = {
          id: userDoc.id,
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
          profileImage: user.profileImage || "",
          backgroundImage: user.backgroundImage || "",
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
        UtilFunctions.saveUser(registeredUser); */

        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);
          console.log("📧 Verification email sent to:", auth.currentUser.email);
          await UtilFunctions.deleteUser();
        }

       // router.dismissAll();
       // router.replace("../../(drawer)/(tabs)/CrewFind");
       router.replace("./VerifyEmail");
      } catch (error: any) {
        console.error("Error creating/updating user:", error.message);
        Alert.alert("Error", error.message || "Failed to create/update user");
      } finally {
        setLoading(false);
      }
    }
  };

  const openImagePicker = (type: "profile" | "background") => {
    setImageType(type);
    setShowModal(true);
  };

  return (
     <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {loading && <LoadingIndicator />}

      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Divider Line */}
        <View style={{ height: 0.5, backgroundColor: "#ccc", width: "100%" }} />

        {/* Progress section - not scrollable */}
        {!isFromSettings && (
          <>
            <ProgressHeader>
              <StepText>Step 4 of 4</StepText>
              <StepPercentage>100%</StepPercentage>
            </ProgressHeader>

            <ProgressBarContainer>
              <ProgressBarFill widthPercentage={100} />
            </ProgressBarContainer>
          </>
        )}

        {/* Scrollable content starts AFTER progress */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={true}
        >
          <Title isFromSettings={isFromSettings}>Add Photos</Title>
          <Subtitle>Upload your profile and background photos</Subtitle>

          <Label>Profile Picture</Label>
          <UploadCircle onPress={() => openImagePicker("profile")}>
            {profileImage ? (
              <Preview
                source={{
                  uri:
                    profileImage?.uri ||
                    "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png",
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <Icon name="camera" size={30} color="#B0B5C0" />
            )}
          </UploadCircle>

          <Label style={{ marginTop: 30 }}>Background Photo</Label>
          <UploadBox onPress={() => openImagePicker("background")}>
            {backgroundImage ? (
              <Preview
                source={{
                  uri: backgroundImage?.uri,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <Icon name="image" size={30} color="#B0B5C0" />
            )}
          </UploadBox>

          {!isFromSettings && (
            <TermsContainer>
              <CheckboxContainer onPress={() => setTermsAccepted(!termsAccepted)}>
                <Checkbox checked={termsAccepted}>
                  {termsAccepted && <Icon name="check" size={14} color="#fff" />}
                </Checkbox>
                <TermsText>
                  I have read, understood and agreed with these{" "}
                  <TermsLink
                    onPress={() =>
                      Linking.openURL("https://www.crewfind.app/terms")
                    }
                  >
                    Terms and Conditions
                  </TermsLink>
                </TermsText>
              </CheckboxContainer>
              {termsError && (
                <ErrorText>
                  Please check and accept the terms and conditions.
                </ErrorText>
              )}
            </TermsContainer>
          )}
        </ScrollView>

        {/* Fixed button */}
        <FixedBottom style={{ paddingBottom: insets.bottom + 30 }}>
          <NextButton onPress={handleCompleteRegistration}>
            <NextButtonText>
              {isFromSettings ? "Save" : "Complete Registration"}
            </NextButtonText>
          </NextButton>
        </FixedBottom>

        {/* Modal */}
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
      </View>
    </KeyboardAvoidingView>
  );
};

export default Register3;

const Container = styled.View`
  flex: 1;
  background-color: white;
`;

const ProgressHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px 5px 20px;
`;

const StepText = styled.Text`
  font-size: 14px;
  color: #8c8c8c;
`;

const StepPercentage = styled.Text`
  font-size: 14px;
  color: #000000;
`;

const ProgressBarContainer = styled.View`
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  width: 90%;
  margin: 10px 20px;
  overflow: hidden;
`;

const ProgressBarFill = styled.View<{ widthPercentage: number }>`
  height: 100%;
  width: ${(props) => props.widthPercentage}%;
  background-color: #1c1c88;
`;

const Title = styled.Text<{ isFromSettings?: boolean }>`
  font-size: 24px;
  font-weight: bold;
  color: #1c1c88;
  margin: ${({ isFromSettings }) => (isFromSettings ? "5px 20px 5px 20px" : "0px 20px 5px 20px")};
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #5c5c5c;
  margin: 0 20px 20px 20px;
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #1c1c88;
  margin: 8px 20px 4px 20px;
`;

const UploadCircle = styled.TouchableOpacity`
  width: 160px;
  height: 160px;
  border-radius: 80px;
  border: 2px dashed #d1d5db;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  align-self: center;
`;

const UploadBox = styled.TouchableOpacity`
  width: 90%;
  height: 160px;
  border-radius: 15px;
  border: 2px dashed #d1d5db;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  margin: 10px 20px;
`;

const UploadText = styled.Text`
  margin-top: 10px;
  color: #aeb0b4;
  font-size: 16px;
`;

const UploadNote = styled.Text`
  text-align: center;
  font-size: 13px;
  color: #aeb0b4;
  margin-top: 10px;
`;

const Preview = styled(FastImage)`
  width: 100%;
  height: 100%;
  border-radius: 15px;
`;

const FooterRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 40px;
`;

const FixedBottom = styled.View`
  padding: 20px;
  background-color: #fff;
  border-top-width: 1px;
  border-top-color: #eee;
`;

const NextButton = styled.TouchableOpacity`
  background-color: #1c1c88;
  padding: 14px;
  border-radius: 10px;
  align-items: center;
`;

const NextButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 20px;
  border-radius: 15px;
`;

const ModalOption = styled.TouchableOpacity`
  padding: 15px;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #ddd;
`;

const OptionText = styled.Text`
  font-size: 18px;
`;

const CloseButton = styled.TouchableOpacity`
  background-color: red;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
  margin-top: 10px;
`;

const TermsContainer = styled.View`
  margin: 20px 20px -30px 20px;
`;

const CheckboxContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: flex-start;
`;

const Checkbox = styled.View<{ checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid ${(props) => (props.checked ? "#1c1c88" : "#d1d5db")};
  background-color: ${(props) => (props.checked ? "#1c1c88" : "transparent")};
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  margin-top: 2px;
`;

const TermsText = styled.Text`
  flex: 1;
  font-size: 14px;
  color: #5c5c5c;
  line-height: 20px;
`;

const TermsLink = styled.Text`
  color: #1c1c88;
  text-decoration: underline;
  font-weight: 600;
`;

const ErrorText = styled.Text`
  color: #ff0000;
  font-size: 13px;
  margin-top: 8px;
  margin-left: 30px;
`;

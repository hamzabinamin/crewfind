import React, { useState } from "react";
import { Alert } from "react-native";
import styled from "styled-components/native";
import { useRouter } from "expo-router";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { GeoPoint } from "firebase/firestore";
import DismissKeyboardView from "../../../components/DismissKeyboardView";
import { sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../../../FirebaseConfig";
import LoadingIndicator from "../../utilities/LoadingIndicator";

const VerifyEmail = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const firestore = getFirestore();

  const handleContinue = async () => {
    try {
      setLoading(true);
      await auth.currentUser?.reload();

      if (auth.currentUser?.emailVerified) {
        const userRef = doc(firestore, "Users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();

            let profileImageUrl = "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png";
            if (userData.profileImage) {
                if (UtilFunctions.isExternalUrl(userData.profileImage)) {
                profileImageUrl = userData.profileImage;
                } else {
                try {
                    profileImageUrl = await UtilFunctions.fetchLogoUrl(userData.profileImage);
                } catch (error) {
                    console.error("Error fetching profile image from Firebase Storage:", error);
                }
                }
            }

            let backgroundImageUrl = "https://dummyimage.com/300/fff/fff";
            if (userData.backgroundImage) {
                if (UtilFunctions.isExternalUrl(userData.backgroundImage)) {
                backgroundImageUrl = userData.backgroundImage;
                } else {
                try {
                    backgroundImageUrl = await UtilFunctions.fetchLogoUrl(userData.backgroundImage);
                } catch (error) {
                    console.error("Error fetching background image from Firebase Storage:", error);
                }
                }
            }

            const registeredUser: User = {
                id: userDoc.id,
                name: userData.name || "",
                surName: userData.surName || "",
                email: userData.email || "",
                password: "",
                isVerified: userData.isVerified || "false",
                base: userData.base || "",
                nationality: userData.nationality || "",
                position: userData.position || "",
                companyName: userData.companyName || "",
                age: userData.age || 0,
                sex: userData.sex || "",
                relationshipStatus: userData.relationshipStatus || "",
                hobbies: userData.hobbies || [],
                profileImage: profileImageUrl,
                backgroundImage: backgroundImageUrl,
                licenses: userData.licenses || [],
                licenseType: userData.licenseType || "",
                experiences: userData.experiences || [],
                flyingHoursPIC: userData.flyingHoursPIC || 0,
                flyingHoursTotal: userData.flyingHoursTotal || 0,
                yearsOfExperience: userData.yearsOfExperience || 0,
                userCoordinates: userData.userCoordinates || new GeoPoint(0, 0),
                friends: userData.friends,
                blocked: userData.blocked,
                lastSeen: userData.lastSeen ? userData.lastSeen.toDate?.() ?? new Date(userData.lastSeen) : null,
                createdAt: userData.createdAt && userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(),
                updatedAt: userData.updatedAt && userData.updatedAt.toDate ? userData.updatedAt.toDate() : new Date()
            };

            console.log("✅ Saving verified user locally:", registeredUser.id);
            UtilFunctions.saveUser(registeredUser);
            router.dismissAll();
            router.replace("../../(drawer)/(tabs)/CrewFind");
        } 
      }  else {
            Alert.alert(
            "Email Not Verified",
            "Your email is still not verified. Please check your inbox or resend the email."
            );
        }
    } catch (err: any) {
      console.error("Verification check failed:", err);
      Alert.alert("Error", "Could not verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Verification Email Sent", "Please check your inbox.");
      }
    } catch (err: any) {
      console.error("Resend failed:", err);
      Alert.alert("Error", "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DismissKeyboardView>
      <Container>
        {loading && <LoadingIndicator />}
        <LogoContainer>
          <LogoCircle>
            <LogoImage
              source={require("../../../assets/images/logo-white.png")}
              resizeMode="contain"
            />
          </LogoCircle>
          <AppTitle>Verify Your Email</AppTitle>
          <AppSubtitle>
            We've sent you a verification email. Please confirm your email
            before continuing.
          </AppSubtitle>
        </LogoContainer>

        <Form>
          <VerifyButton onPress={handleContinue} disabled={loading}>
            <VerifyButtonText>CONTINUE</VerifyButtonText>
          </VerifyButton>

          <ResendContainer>
            <ResendText>Didn’t get the email?</ResendText>
            <ResendLink onPress={handleResendEmail}>Resend</ResendLink>
          </ResendContainer>
        </Form>
      </Container>
    </DismissKeyboardView>
  );
};

export default VerifyEmail;

// --- styled components ---

const Container = styled.View`
  flex: 1;
  background-color: #ffffff;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
`;

const LogoContainer = styled.View`
  align-items: center;
  margin-bottom: 40px;
`;

const LogoCircle = styled.View`
  width: 80px;
  height: 80px;
  background-color: #1c1c88;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const LogoImage = styled.Image`
  width: 60px;
  height: 60px;
`;

const AppTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #1c1c88;
`;

const AppSubtitle = styled.Text`
  font-size: 16px;
  color: #5c5c5c;
  margin-top: 5px;
  text-align: center;
`;

const Form = styled.View`
  width: 100%;
  max-width: 400px;
`;

const VerifyButton = styled.TouchableOpacity`
  background-color: #1c1c88;
  height: 48px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
`;

const VerifyButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const ResendContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-top: 20px;
`;

const ResendText = styled.Text`
  font-size: 14px;
  color: #6b7280;
`;

const ResendLink = styled.Text`
  color: #1c1c88;
  font-weight: 600;
  text-decoration-line: underline;
  margin-left: 6px;
`;

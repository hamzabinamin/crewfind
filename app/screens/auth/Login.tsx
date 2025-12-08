import { Dimensions, View, TouchableOpacity, Text, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GeoPoint } from "firebase/firestore";
import { auth, db } from '../../../FirebaseConfig'
import { 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth'
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google Auth Configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '229155847690-a4agpm1ivphmmfbcv7er383rp34rhigt.apps.googleusercontent.com', // Add your iOS client ID
    androidClientId: '229155847690-gc5np3p8ahnr151cma9k6u6hgrqrfo2s.apps.googleusercontent.com', // Add your Android client ID
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleSignIn(authentication?.accessToken);
    }
  }, [response]);

  useEffect(() => {
    const checkAppleAvailability = async () => {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    };
    checkAppleAvailability();
  }, []);

  const validateFields = () => {
    const newErrors = { email: "", password: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) newErrors.email = "Email field cannot be empty.";
    else if (!emailRegex.test(email)) newErrors.email = "Please enter a valid email address.";
    if (!password.trim()) newErrors.password = "Password field cannot be empty.";

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const createOrUpdateUser = async (firebaseUser: any, additionalData: any = {}) => {
    try {
      console.log("firebaseUser.uid: ", firebaseUser.uid);
      const userDocRef = doc(db, "Users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let userData;
      let isNewUser = false;

      if (userDoc.exists()) {
        userData = userDoc.data();
        // Check if account is deactivated
        if (userData.isDeactivated) {
          Alert.alert("Account Deactivated", "This account has been deactivated.");
          await auth.signOut();
          return null;
        }
        console.log("Got here after account deactivated return");

        // Check if user profile is incomplete (for existing OAuth users who haven't completed registration)
        const isProfileIncomplete = !userData.base || !userData.nationality || 
                                  !userData.position || !userData.companyName || 
                                  userData.age === 0 || !userData.sex;

        console.log("isProfileIncomplete: ", isProfileIncomplete);
        console.log("Base: ", userData.base);
        console.log("Nationality: ", userData.nationality);
        console.log("Position: ", userData.position);
        console.log("Company Name: ", userData.companyName);
        console.log("Age: ", userData.age);
        console.log("Sex: ", userData.sex);
        console.log("Firebase email: ", firebaseUser.email);
        console.log("Firebase name: ", firebaseUser.displayName?.split(' ')[0]);
        
        if (isProfileIncomplete) {
          // Save partial user data and redirect to Register
          const partialUser: User = {
            id: firebaseUser.uid,
            name: userData.name || additionalData.firstName || firebaseUser.displayName?.split(' ')[0] || "",
            surName: userData.surName || additionalData.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
            email: userData.email || firebaseUser.email || "",
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
            profileImage: userData.profileImage || "",
            backgroundImage: userData.backgroundImage || "",
            licenses: userData.licenses || [],
            licenseType: userData.licenseType || "",
            experiences: userData.experiences || [],
            flyingHoursPIC: userData.flyingHoursPIC || 0,
            flyingHoursTotal: userData.flyingHoursTotal || 0,
            yearsOfExperience: userData.yearsOfExperience || 0,
            friends: userData.friends || [],
            blocked: userData.blocked || [],
            userCoordinates: userData.userCoordinates,
            lastSeen: userData.lastSeen ? userData.lastSeen.toDate?.() ?? new Date(userData.lastSeen) : null,
            createdAt: userData.createdAt?.toDate?.() || new Date(),
            updatedAt: userData.updatedAt?.toDate?.() || new Date()
          };

          UtilFunctions.saveUser(partialUser);
          router.push({
            pathname: "./Register1",
            params: { cameFromLogin: "true" }
          });
          return partialUser;
        }
        else {
          console.log("Profile is complete so got here in else");
        }
      } 
      else {
        isNewUser = true;
        // Create new user document for OAuth users with minimal data
        userData = {
          name: additionalData.firstName || firebaseUser.displayName?.split(' ')[0] || "",
          surName: additionalData.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || "", 
          email: firebaseUser.email || "",
          isVerified: "false",
          base: "", // Will be filled in Register screen
          nationality: "", // Will be filled in Register screen
          position: "", // Will be filled in Register screen
          companyName: "", // Will be filled in Register screen
          age: 0, // Will be filled in Register screen
          sex: "", // Will be filled in Register screen
          relationshipStatus: "",
          hobbies: [],
          profileImage: firebaseUser.photoURL || null,
          backgroundImage: null,
          licenses: [],
          licenseType: "",
          experiences: [],
          flyingHoursPIC: 0,
          flyingHoursTotal: 0,
          yearsOfExperience: 0,
          friends: [],
          blocked: [],
          isDeactivated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSeen: new Date()
        };
        
        await setDoc(userDocRef, userData);

        // For new OAuth users, save partial data and redirect to Register
        let profileImage = "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png";
        if (userData.profileImage) {
          if (UtilFunctions.isExternalUrl(userData.profileImage)) {
            profileImage = userData.profileImage;
          } else {
            try {
              profileImage = await UtilFunctions.fetchLogoUrl(userData.profileImage);
            } catch (error) {
              console.error("Error fetching profile image from Firebase Storage:", error);
            }
          }
        }
       
        let backgroundImage = "https://dummyimage.com/300/fff/fff";
        if (userData.backgroundImage) {
          if (UtilFunctions.isExternalUrl(userData.backgroundImage)) {
            backgroundImage = userData.backgroundImage;
          } else {
            try {
              backgroundImage = await UtilFunctions.fetchLogoUrl(userData.backgroundImage);
            } catch (error) {
              console.error("Error fetching background image from Firebase Storage:", error);
            }
          }
        }

        const partialUser: User = {
          id: firebaseUser.uid,
          name: userData.name || "",
          surName: userData.surName || "",
          email: userData.email || "",
          password: "",
          isVerified: userData.isVerified || "false",
          base: "",
          nationality: "",
          position: "",
          companyName: "",
          age: 0,
          sex: "",
          relationshipStatus: "",
          hobbies: [],
          profileImage,
          backgroundImage,
          licenses: [],
          licenseType: "",
          experiences: [],
          flyingHoursPIC: 0,
          flyingHoursTotal: 0,
          yearsOfExperience: 0,
          friends: [],
          blocked: [],
          userCoordinates: new GeoPoint(0 , 0),
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        UtilFunctions.saveUser(partialUser);
        router.push({
          pathname: "./Register",
          params: { cameFromLogin: "true" }
        }); 
        return partialUser;
      }

      // If we reach here, it's an existing user with complete profile
      console.log("Fetching profile and background images now through download url");

      let profileImage = "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png";
      if (userData.profileImage) {
        if (UtilFunctions.isExternalUrl(userData.profileImage)) {
          profileImage = userData.profileImage;
        } else {
          try {
            profileImage = await UtilFunctions.fetchLogoUrl(userData.profileImage);
          } catch (error) {
            console.error("Error fetching profile image from Firebase Storage:", error);
          }
        }
      }

      let backgroundImage = "https://dummyimage.com/300/fff/fff";
      if (userData.backgroundImage) {
        if (UtilFunctions.isExternalUrl(userData.backgroundImage)) {
          backgroundImage = userData.backgroundImage;
        } else {
          try {
            backgroundImage = await UtilFunctions.fetchLogoUrl(userData.backgroundImage);
          } catch (error) {
            console.error("Error fetching background image from Firebase Storage:", error);
          }
        }
      }

     // const profileImage = userData.profileImage ? await UtilFunctions.fetchLogoUrl(userData.profileImage) : "https://via.placeholder.com/60";
     // const backgroundImage = userData.backgroundImage ? await UtilFunctions.fetchLogoUrl(userData.backgroundImage) : "https://via.placeholder.com/60";

      const loggedInUser: User = {
        id: firebaseUser.uid,
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
        profileImage,
        backgroundImage,
        licenses: userData.licenses || [],
        licenseType: userData.licenseType || "",
        experiences: userData.experiences || [],
        flyingHoursPIC: userData.flyingHoursPIC || 0,
        flyingHoursTotal: userData.flyingHoursTotal || 0,
        yearsOfExperience: userData.yearsOfExperience || 0,
        friends: userData.friends || [],
        blocked: userData.blocked || [],
        userCoordinates: userData.userCoordinates,
        lastSeen: userData.lastSeen ? userData.lastSeen.toDate?.() ?? new Date(userData.lastSeen) : null,
        createdAt: userData.createdAt?.toDate?.() || new Date(),
        updatedAt: userData.updatedAt?.toDate?.() || new Date()
      };

      UtilFunctions.saveUser(loggedInUser);
      UtilFunctions.updateLastSeen();
      router.replace("../../(drawer)/(tabs)/CrewFind"); // Go to main app
      return loggedInUser;
    } catch (error) {
      console.error("Error creating/updating user:", error);
      throw error;
    }
  };

  const handleLoginPress = async () => {
    if (!validateFields()) return;
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setEmailNotVerified(true); 
        return; 
      }

      await createOrUpdateUser(userCredential.user);
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (accessToken?: string) => {
    try {
      setLoading(true);
      if (!accessToken) {
        Alert.alert('Error', 'Failed to get Google access token');
        return;
      }
      const credential = GoogleAuthProvider.credential(null, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      await createOrUpdateUser(userCredential.user);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert('Google Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      console.log('🍎 Starting Apple Sign In...');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 Apple credential received:', {
        user: credential.user ? 'User ID present' : 'No user ID',
        email: credential.email || 'No email provided',
        identityToken: credential.identityToken ? 'Token present' : 'No identity token',
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Create Firebase credential using OAuthProvider
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
      });

      console.log('🍎 Attempting Firebase sign in...');
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      console.log('🍎 Firebase sign in successful');
      
      // Extract name from Apple response (only provided on first sign-in)
      const additionalData = {
        firstName: credential.fullName?.givenName || "",
        lastName: credential.fullName?.familyName || "",
      };

      // Use the same createOrUpdateUser function as Google sign-in
      await createOrUpdateUser(userCredential.user, additionalData);
      
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('🍎 User canceled Apple Sign In');
        return;
      }
      
      console.error('🍎 Apple sign in error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      Alert.alert('Apple Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    router.replace("../../(drawer)/(tabs)/CrewFind");
  };

  const handleRegisterPress = () => router.push({
    pathname: "./Register",
    params: { cameFromLogin: "false" }
  });
  const handleForgotPasswordPress = () => router.push("./ForgotPassword");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
       <DismissKeyboardView>
        <Container>
          {loading && <LoadingIndicator />}
          <LogoContainer>
            <LogoCircle>
              <LogoImage source={require('../../../assets/images/logo-white.png')} resizeMode="contain" />
            </LogoCircle>
            <AppTitle>Welcome Back!</AppTitle>
            <AppSubtitle>Connect with aviation professionals</AppSubtitle>
          </LogoContainer>

          <Form>
            <View>
              <InputContainer>
                <StyledIconEmail name="envelope" size={20} color="#999999" />
                <Input
                  placeholder="Email"
                  placeholderTextColor="#999999"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </InputContainer>
              {errors.email ? <ErrorText>{errors.email}</ErrorText> : null}
            </View>

            <View>
              <InputContainer>
                <StyledIconPassword name="lock" size={20} color="#999999" />
                <Input
                  placeholder="Password"
                  placeholderTextColor="#999999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </InputContainer>
              {errors.password ? <ErrorText>{errors.password}</ErrorText> : null}
            </View>

                  {/* 🔹 Email not verified banner */}
            {emailNotVerified && (
              <ErrorMessage>
                <Icon
                  name="exclamation-circle"
                  size={16}
                  color="#ef4444"
                  style={{ marginRight: 8 }}
                />
                <ErrorTextVerification>
                  Please verify your email before logging in. Check your inbox (and spam folder).
                </ErrorTextVerification>
                <ResendButton
                  onPress={async () => {
                    try {
                      if (auth.currentUser) {
                        await sendEmailVerification(auth.currentUser);
                        Alert.alert("Verification Email Sent", "Please check your inbox.");
                      }
                    } catch (err: any) {
                      Alert.alert("Error", "Could not resend verification email.");
                      console.error(err);
                    }
                  }}
                >
                  <ResendText>Resend</ResendText>
                </ResendButton>
              </ErrorMessage>
            )}

            <SignInButton onPress={handleLoginPress} disabled={loading}>
              <SignInText>Sign In</SignInText>
            </SignInButton>

            <CreateAccountButton onPress={handleRegisterPress} disabled={loading}>
              <CreateAccountText>Create Account</CreateAccountText>
            </CreateAccountButton>

            <ForgotPassword onPress={handleForgotPasswordPress}>Forgot Password?</ForgotPassword>

            <Separator />

            {isAppleAvailable && (
              <OAuthButton onPress={handleAppleSignIn} disabled={loading}>
                <Icon name="apple" size={20} color="#000" />
                <OAuthText>Continue with Apple</OAuthText>
              </OAuthButton>
            )} 

            <OAuthButton onPress={() => promptAsync()} disabled={!request || loading}>
              <Icon name="google" size={20} color="#000" />
              <OAuthText>Continue with Google</OAuthText>
            </OAuthButton>

            <GuestButton onPress={handleContinueAsGuest}>
              <GuestText>Continue as Guest</GuestText>
            </GuestButton>
          </Form>
        </Container>
      </DismissKeyboardView>
    </SafeAreaView>
   
  );
};

export default Login;

const Container = styled.View`
  flex: 1;
  background-color: #ffffff;
  align-items: center;
  justify-content: center;
  padding: 24px;
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
`;

const Form = styled.View`
  width: 100%;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 10px;
  padding-horizontal: 12px;
  height: 48px;
  margin-bottom: 10px;
`;

const Input = styled.TextInput`
  flex: 1;
  height: 48px;
  color: #000000;
  padding-horizontal: 10px;
`;

const StyledIconEmail = styled(Icon)`
  margin-right: 8px;
`;

const StyledIconPassword = styled(Icon)`
  margin-right: 8px;
`;

const ErrorText = styled.Text`
  color: red;
  font-size: 12px;
  margin-bottom: 10px;
  margin-left: 5px;
`;

const SignInButton = styled.TouchableOpacity`
  background-color: #1c1c88;
  height: 48px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  opacity: ${(props: any) => props.disabled ? 0.6 : 1};
`;

const SignInText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const CreateAccountButton = styled.TouchableOpacity`
  height: 48px;
  border: 1px solid #1c1c88;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  opacity: ${(props: any) => props.disabled ? 0.6 : 1};
`;

const CreateAccountText = styled.Text`
  color: #1c1c88;
  font-size: 16px;
  font-weight: 600;
`;

const ForgotPassword = styled.Text`
  text-align: center;
  margin-top: 15px;
  color: #6b7280;
`;

const Separator = styled.View`
  height: 1px;
  background-color: #e5e7eb;
  margin-vertical: 20px;
`;

const OAuthButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  padding-vertical: 12px;
  border-radius: 10px;
  margin-bottom: 12px;
  opacity: ${(props: any) => props.disabled ? 0.6 : 1};
`;

const OAuthText = styled.Text`
  margin-left: 10px;
  font-size: 16px;
  color: #111827;
`;

const GuestButton = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  padding-vertical: 14px;
  margin-top: 10px;
`;

const GuestText = styled.Text`
  font-size: 15px;
  color: #6b7280;
  text-decoration: underline;
`;

const ErrorMessage = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 15px;
  padding: 12px;
  background-color: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  flex-wrap: wrap; /* allow text + button to wrap nicely */
`;

const ErrorTextVerification = styled.Text`
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 1;
`;

const ResendButton = styled.TouchableOpacity`
  margin-left: 12px;
  padding: 4px 8px;
  background-color: #fee2e2;
  border-radius: 6px;
`;

const ResendText = styled.Text`
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
`;

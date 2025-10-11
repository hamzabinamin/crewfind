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
import * as Crypto from 'expo-crypto';
import * as AuthSession from 'expo-auth-session';

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

  const generateNonce = (length = 32) => {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
    return result;
  };

 /* const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      console.log('🍎 Starting Apple Sign In...');
      
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('🍎 Apple Authentication available:', isAvailable);
      
      if (!isAvailable) {
        Alert.alert('Apple Sign In Not Available', 'Apple Sign In is not available on this device.');
        return;
      }
      
      // Generate nonce
      const rawNonce = generateNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      console.log('🍎 Generated nonces - raw length:', rawNonce.length, 'hashed length:', hashedNonce.length);
      
      // Attempt Apple Sign In
      console.log('🍎 Attempting Apple Authentication...');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      console.log('🍎 Apple credential received:', {
        user: credential.user ? `User ID present (${credential.user.length} chars)` : 'No user ID',
        email: credential.email || 'No email provided',
        identityToken: credential.identityToken ? `Token present (${credential.identityToken.length} chars)` : 'No identity token',
        authorizationCode: credential.authorizationCode ? `Code present (${credential.authorizationCode.length} chars)` : 'No auth code',
        fullName: credential.fullName ? {
          givenName: credential.fullName.givenName,
          familyName: credential.fullName.familyName
        } : 'No full name',
        realUserStatus: credential.realUserStatus
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Create Firebase credential
      console.log('🍎 Creating Firebase credential...');
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: rawNonce,
      });

      console.log('🍎 Attempting Firebase sign in...');
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      console.log('🍎 Firebase sign in successful:', userCredential.user.uid);
      
      // Extract name from Apple response
      const additionalData = {
        firstName: credential.fullName?.givenName || "",
        lastName: credential.fullName?.familyName || "",
      };

      await createOrUpdateUser(userCredential.user, additionalData);
      
    } catch (error: any) {
      console.log('🍎 Full error object:', JSON.stringify(error, null, 2));
      console.log('🍎 Error properties:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack,
        nativeStackAndroid: error.nativeStackAndroid,
        userInfo: error.userInfo
      });
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('🍎 User canceled Apple Sign In');
        return;
      }
      
      // Handle specific Apple Sign In errors
      let errorMessage = 'Apple Sign In failed';
      
      switch (error.code) {
        case 'ERR_REQUEST_FAILED':
          errorMessage = 'Apple Sign In request failed. Please check your internet connection.';
          break;
        case 'ERR_REQUEST_CANCELED':
          errorMessage = 'Apple Sign In was canceled.';
          break;
        case 'ERR_REQUEST_NOT_HANDLED':
          errorMessage = 'Apple Sign In request was not handled properly.';
          break;
        case 'ERR_REQUEST_NOT_INTERACTIVE':
          errorMessage = 'Apple Sign In requires user interaction.';
          break;
        case 'ERR_REQUEST_UNKNOWN':
          errorMessage = 'An unknown error occurred during Apple Sign In.';
          break;
        default:
          if (error.message.includes('firebase')) {
            errorMessage = `Firebase error: ${error.message}`;
          } else if (error.message.includes('nonce')) {
            errorMessage = 'Nonce validation failed. Please try again.';
          } else {
            errorMessage = `Apple Sign In error: ${error.message}`;
          }
      }
      
      console.error('🍎 Apple sign in error details:', errorMessage);
      Alert.alert('Apple Sign In Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  }; */

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      console.log('🍎 Starting Expo Managed Apple Sign In...');
      
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

      // Use Expo's managed Firebase integration
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
      });

      console.log('🍎 Attempting Firebase sign in...');
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      console.log('🍎 Firebase sign in successful');
      
      // Extract name from Apple response
      const additionalData = {
        firstName: credential.fullName?.givenName || "",
        lastName: credential.fullName?.familyName || "",
      };

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
      
      Alert.alert('Apple Sign In Failed', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const debugAppleSignIn = async () => {
    try {
      console.log('🔍 === APPLE SIGN IN COMPREHENSIVE DEBUG ===');
      
      // 1. Check basic availability
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('🔍 Apple Auth Available:', isAvailable);
      
      if (!isAvailable) {
        Alert.alert('Not Available', 'Apple Sign In is not available on this device or iOS version');
        return;
      }
      
      // 2. Check device Apple ID status
      console.log('🔍 Testing Apple ID credential state...');
      
      // 3. Try different scope combinations
      const testConfigurations = [
        {
          name: 'No scopes',
          scopes: []
        },
        {
          name: 'Email only',
          scopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL]
        },
        {
          name: 'Name only', 
          scopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME]
        },
        {
          name: 'Both scopes',
          scopes: [
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME
          ]
        }
      ];
      
      for (const config of testConfigurations) {
        try {
          console.log(`🔍 Testing: ${config.name}`);
          
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: config.scopes,
          });
          
          console.log(`✅ SUCCESS with ${config.name}:`, {
            user: credential.user ? `Present (${credential.user.length} chars)` : 'Missing',
            email: credential.email || 'Not provided',
            identityToken: credential.identityToken ? `Present (${credential.identityToken.length} chars)` : 'Missing',
            authorizationCode: credential.authorizationCode ? `Present` : 'Missing',
            realUserStatus: credential.realUserStatus
          });
          
          Alert.alert('Success!', `Apple Sign In worked with: ${config.name}`);
          return; // Stop on first success
          
        } catch (error: any) {
          console.log(`❌ Failed with ${config.name}:`, {
            code: error.code,
            message: error.message
          });
        }
      }
      
      console.log('🔍 All configurations failed');
      
    } catch (error) {
      console.log('🔍 Debug function error:', error);
    }
  };

/*const tryAuthSession = async () => {
  try {
    console.log('🔄 Trying with expo-auth-session...');
    
    // This is an alternative approach using AuthSession
    const request = new AuthSession.AuthRequest({
      clientId: 'com.fulltrade.crewfind', // Your bundle ID
      scopes: ['email', 'name'],
      redirectUri: AuthSession.makeRedirectUri({
        useProxy: true,
      }),
      responseType: AuthSession.ResponseType.Code,
      additionalParameters: {},
      extraParams: {},
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    });

    console.log('🔄 AuthSession result:', result);
    
  } catch (error) {
    console.log('🔄 AuthSession failed:', error);
  }
};

// Function to check bundle ID at runtime (add expo-application if needed)
const checkAppConfig = () => {
  console.log('📱 App Configuration Check:');
  // If you have expo-application installed:
  // import * as Application from 'expo-application';
  // console.log('Bundle ID:', Application.applicationId);
  // console.log('App Name:', Application.applicationName);
  
  // For now, just log what we expect
  console.log('Expected Bundle ID: com.fulltrade.crewfind');
  console.log('Expected Return URL format: https://auth.expo.io/@username/slug');
};*/

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

          {/* {isAppleAvailable && (
              <OAuthButton onPress={debugAppleSignIn} disabled={loading}>
                <Icon name="apple" size={20} color="#000" />
                <OAuthText>Continue with Apple</OAuthText>
              </OAuthButton>
            )} */}

            <OAuthButton onPress={() => promptAsync()} disabled={!request || loading}>
              <Icon name="google" size={20} color="#000" />
              <OAuthText>Continue with Google</OAuthText>
            </OAuthButton>
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

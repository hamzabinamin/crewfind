import { Dimensions, View } from "react-native";
import React, { useState } from "react";
import styled from 'styled-components/native';
import GradientButton from '../../utilities/GradientButton';
import Icon from 'react-native-vector-icons/FontAwesome';
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import { auth, db } from '../../../FirebaseConfig'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get('window').width;

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const validateFields = () => {
      const newErrors = { email: "", password: "" };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
      if (!email.trim()) {
        newErrors.email = "Email field cannot be empty.";
      } else if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address.";
      }
  
      if (!password.trim()) {
        newErrors.password = "Password field cannot be empty.";
      }
  
      setErrors(newErrors);
      return Object.values(newErrors).every((error) => error === "");
    };
  
    const handleLoginPress = async () => {
      console.log('Login 2 button pressed');
      if (!validateFields()) return;
     // router.replace("../../(drawer)/(tabs)/Home");
      try {
        setLoading(true);
        const user = await signInWithEmailAndPassword(auth, email, password)
        if(user) {
          const userDocRef = doc(db, "Users", user.user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            if (userData.isDeactivated === true) {
              alert("This account has been deactivated.");
              return;
            }

            const profileImage = userData.profileImage ? await UtilFunctions.fetchLogoUrl(userData.profileImage) : "https://via.placeholder.com/60";
            const backgroundImage = userData.backgroundImage ? await UtilFunctions.fetchLogoUrl(userData.backgroundImage) : "https://via.placeholder.com/60";
           
            const loggedInUser: User = {
              id: user.user.uid,
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
              profileImage: profileImage || "",
              backgroundImage: backgroundImage || "",
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

            UtilFunctions.saveUser(loggedInUser);
            router.replace("../../(drawer)/(tabs)/Home")
          }
          else {
            console.log("No user data found!");
            alert("User details not found in the database.");
          }
        } 
      } 
      catch (error: any) {
        console.log(error)
        alert('Sign in failed: ' + error.message);
      } 
      finally {
        setLoading(false); 
      }
    };

    const handleRegisterPress = () => {
      router.push("./Register");
    };

    const handleForgotPasswordPress = () => {
      router.push("./ForgotPassword");
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
              Welcome<BlueText> Back!</BlueText>
            </HeadingText>
            <Form>
                <View>
                  <InputContainer>
                      <StyledIconEmail name="envelope" size={20} color="#999999" />
                      <Input placeholder="Email" placeholderTextColor="#999999" keyboardType="email-address" value={email} onChangeText={(text) => setEmail(text)} />
                  </InputContainer>
                  {errors.email ? <ErrorText>{errors.email}</ErrorText> : null}
                </View>
                
                <View>
                  <InputContainer>
                      <StyledIconPassword name="lock" size={20} color="#999999" />
                      <Input placeholder="Password" placeholderTextColor="#999999" secureTextEntry value={password} onChangeText={(text) => setPassword(text)} />
                  </InputContainer>
                  {errors.password ? <ErrorText>{errors.password}</ErrorText> : null}
                </View>

                <GradientButton title="LOG IN" onPress={handleLoginPress} />
                <ForgotPasswordText onPress={handleForgotPasswordPress}>Forgot Password?</ForgotPasswordText>
                <RegisterLink>
                    Don't have an account? <LinkText onPress={handleRegisterPress}>Register</LinkText>
                </RegisterLink>
            </Form>
        </Container>
      </DismissKeyboardView>
    );
};

export default Login;

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
  margin-top: 65px;
  width: 80%;
  max-width: 400px;
  align-items: center;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 60px;
  background-color: #FFFFFF; /* Semi-transparent black background */
  border-radius: 10px;
  padding-horizontal: 10px;
  margin-bottom: 8px;
`;

const StyledIconEmail = styled(Icon)`
  margin-right: 10px;
`;

const StyledIconPassword = styled(Icon)`
  margin-left: 5px;
  margin-right: 10px;
`;

const Input = styled.TextInput`
  flex: 1; /* Ensure input takes the remaining space */
  height: 60px;
  padding: 12px;
  margin: 8px 0;
  border-radius: 15px;
  font-size: 16px;
  color: #999999; /* Change text color to white */
  background-color: #FFFFFF; /* Make background transparent to see the container */
`;

const ErrorText = styled.Text`
  color: red;
  fontSize: 12;
  marginBottom: 10;
  marginLeft: 5;
`;

const ForgotPasswordText = styled.Text`
  margin-top: 15px;
  font-size: 14px;
  color: #5DCBCF;
  text-decoration-line: underline; /* Underline text */
  text-align: center;
`;

const RegisterLink = styled.Text`
  margin-top: 20px;
  font-size: 14px;
  color: #999999;
`;

const LinkText = styled.Text`
  color: #5DCBCF;
  text-decoration-line: underline;
`;

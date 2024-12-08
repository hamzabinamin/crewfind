import { Dimensions } from "react-native";
import React, { useState } from "react";
import styled from 'styled-components/native';
import GradientButton from '../../../src/utilities/GradientButton';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../src/navigation/types';
import { auth } from '../../../FirebaseConfig'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from "expo-router";

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
const screenWidth = Dimensions.get('window').width;

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  
    const handleLoginPress = async () => {
      console.log('Login 2 button pressed');
      router.replace("../../(drawer)/(tabs)/Home");
    /*  try {
        const user = await signInWithEmailAndPassword(auth, email, password)
        if(user) {
          router.replace("../../(drawer)/(tabs)/Home")
        } 
      } 
      catch (error: any) {
        console.log(error)
        alert('Sign in failed: ' + error.message);
      } */
    };

    const handleRegisterPress = () => {
      router.push("./Register");
    };

    const handleForgotPasswordPress = () => {
      router.push("./ForgotPassword");
    };

    return (
        <Container>
            <ImageContainer>
                <AirplaneImage source={require('../../../assets/images/airplane-login.jpg')} resizeMode="cover" />  
                <Overlay />
            </ImageContainer>
            <HeadingText>
              Welcome<BlueText> Back!</BlueText>
            </HeadingText>
            <Form>
                <InputContainer>
                    <StyledIconEmail name="envelope" size={20} color="#999999" />
                    <Input placeholder="Email" placeholderTextColor="#999999" keyboardType="email-address" />
                </InputContainer>
                <InputContainer>
                    <StyledIconPassword name="lock" size={20} color="#999999" />
                    <Input placeholder="Password" placeholderTextColor="#999999" secureTextEntry />
                </InputContainer>
                <GradientButton title="LOG IN" onPress={handleLoginPress} />
                <ForgotPasswordText onPress={handleForgotPasswordPress}>Forgot Password?</ForgotPasswordText>
                <RegisterLink>
                    Don't have an account? <LinkText onPress={handleRegisterPress}>Register</LinkText>
                </RegisterLink>
            </Form>
        </Container>
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

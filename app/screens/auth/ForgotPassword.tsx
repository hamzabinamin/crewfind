import { Dimensions } from "react-native";
import React from "react";
import styled from 'styled-components/native';
import GradientButton from '../../../src/utilities/GradientButton';
import Icon from 'react-native-vector-icons/FontAwesome';

const screenWidth = Dimensions.get('window').width;

const handleLoginPress = () => {
    console.log('Password reset button pressed');
};

const Login = () => {
    return (
        <Container>
            <ImageContainer>
                <AirplaneImage source={require('../../../assets/images/airplane-login.jpg')} resizeMode="cover" />  
                <Overlay />
            </ImageContainer>
            <HeadingText>
              Reset<BlueText> Password!</BlueText>
            </HeadingText>
            <Form>
              <InputContainer>
                <StyledIconEmail name="envelope" size={20} color="#999999" />
                <Input placeholder="Email" placeholderTextColor="#999999" keyboardType="email-address" />
              </InputContainer>
              <GradientButton title="SEND RESET REQUEST" onPress={handleLoginPress} />
              <ForgotPasswordText><BlueText>Note:</BlueText> Enter the email address associated with your account and we'll send an email with instructions to reset your password.</ForgotPasswordText>
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
  margin-top: 15px;
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

const Input = styled.TextInput`
  flex: 1; /* Ensure input takes the remaining space */
  height: 60px;
  padding: 12px;
  margin: 8px 0;
  border-radius: 15px;
  font-size: 16px;
  color: #FFF; /* Change text color to white */
  background-color: #FFFFFF; /* Make background transparent to see the container */
`;

const ForgotPasswordText = styled.Text`
  margin-top: 15px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #999999;
  text-align: center;
`;

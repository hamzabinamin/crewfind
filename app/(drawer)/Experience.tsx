import { Dimensions } from "react-native";
import React from "react";
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const screenWidth = Dimensions.get('window').width;


const Experience = () => {

    return (
        <Container>
            <HeadingText>
              Experience
            </HeadingText>
        </Container>
    );
};

export default Experience;

const Container = styled.View`
  flex: 1;
  background-color: #090320;
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

const PinkText = styled.Text`
  color: #B658C3;
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
  background-color: #3D394F; /* Semi-transparent black background */
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
  color: #FFF; /* Change text color to white */
  background-color: #3D394F; /* Make background transparent to see the container */
`;

const LoginButton = styled.TouchableOpacity`
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  border-radius: 5px;
  background-color: #007bff;
  align-items: center;
`;
  
const ButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
`;

const ForgotPasswordText = styled.Text`
  margin-top: 15px;
  font-size: 14px;
  color: #FFF;
  text-decoration-line: underline; /* Underline text */
  text-align: center;
`;

const RegisterLink = styled.Text`
  margin-top: 20px;
  font-size: 14px;
  color: #ffffff;
`;

const LinkText = styled.Text`
  color: #BF5DCD;
  text-decoration-line: underline;
`;

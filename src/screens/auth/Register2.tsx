import { Dimensions } from "react-native";
import React from "react";
import styled from 'styled-components/native';
import GradientButtonWithArrow from "@/src/utilities/GradientButtonWithArrow";
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

type Register2ScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register2'>;
const screenWidth = Dimensions.get('window').width;


const Register2 = () => {
  const navigation = useNavigation<Register2ScreenNavigationProp>();

  const handleStep3Press = () => {
    navigation.navigate('Register3');
  };

    return (
        <Container>
            <ImageContainer>
                <AirplaneImage source={require('../../../assets/images/airplane-login.jpg')} resizeMode="cover" />  
                <Overlay />
            </ImageContainer>
            <HeadingText>
              Create an <BlueText>Account!</BlueText>
            </HeadingText>
            <Form>
                <InputContainer>
                    <StyledIconEmail name="user-circle" size={20} color="#999999" />
                    <Input placeholder="Profile Image" placeholderTextColor="#999999" keyboardType="default" />
                </InputContainer>
                <InputContainer>
                    <StyledIconEmail name="user-circle" size={20} color="#999999" />
                    <Input placeholder="Profile Background" placeholderTextColor="#999999" keyboardType="default" />
                </InputContainer>
                <GradientButtonWithArrow title="Step 3 of 3"  onPress={handleStep3Press} />
            </Form>
        </Container>
    );
};

export default Register2;

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

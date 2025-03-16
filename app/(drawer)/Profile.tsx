import { Dimensions } from "react-native";
import React from "react";
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const Profile = () => { 
  return (
    <Container>
      <Heading>Profile Mangement</Heading>
      {/* Settings List */}
      <ListItem>
        <ListText>Profile Details</ListText>
      </ListItem>
      <ListItem>
        <ListText>Experience</ListText>
      </ListItem>
    </Container>
  );
}

export default Profile;

const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
  padding: 20px;
`;

const Heading = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #5DCBCF;
  margin-bottom: 15px;
`;

const ListItem = styled.TouchableOpacity`
  padding: 15px;
  background-color: #ffffff;
  border-bottom-width: 1px;
  border-bottom-color: #ddd;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ListText = styled.Text`
  font-size: 16px;
  color: #333333;
  font-weight: normal;
`;

const Separator = styled.View`
  height: 1px;
  background-color: #dddddd;
  margin: 20px 0;
`;

const FooterText = styled.Text`
  font-size: 14px;
  text-align: center;
  color: #999999;
  margin-top: 10px; 
`;


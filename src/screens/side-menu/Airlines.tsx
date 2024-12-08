import React from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Ionicons';

// Sample data
const airlines = [
  {
    id: '1',
    name: 'Delta Airlines',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8S94XvDD8H424x0NgoIcsBRayY9LTIpgR4Q&s',
  },
  {
    id: '2',
    name: 'American Airlines',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8S94XvDD8H424x0NgoIcsBRayY9LTIpgR4Q&s',
  },
  {
    id: '3',
    name: 'United Airlines',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8S94XvDD8H424x0NgoIcsBRayY9LTIpgR4Q&s',
  },
];

const Airlines = () => {
  // Render each airline row
  const renderAirline = ({ item }: { item: typeof airlines[0] }) => (
    <AirlineRow>
      <AirlineLogo source={{ uri: item.logo }} />
      <AirlineName>{item.name}</AirlineName>
      <ChatButton>
        <Icon name="chatbubble-outline" size={24} color="#555" />
      </ChatButton>
    </AirlineRow>
  );

  return (
    <Container>
      <Heading>Airlines List</Heading>
      <FlatList
        data={airlines}
        renderItem={renderAirline}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Airlines;

// Styled-components
const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
  padding: 10px;
`;

const Heading = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #5DCBCF;
  margin-bottom: 15px;
`;

const AirlineRow = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const AirlineLogo = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 15px;
`;

const AirlineName = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const ChatButton = styled.TouchableOpacity`
  padding: 10px;
`;


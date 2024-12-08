import React from "react";
import { FlatList, Dimensions, Text, View, Image } from "react-native";
import styled from "styled-components/native";
// Import BackgroundGradient
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get("window").width;

// Example data
const airlines = [
  {
    id: "1",
    airlineName: "Airline 1",
    base: "New York",
    lastSeen: "5 mins ago",
    pilotName: "John Doe",
    position: "Captain",
    image: "https://scontent.flhe3-1.fna.fbcdn.net/v/t39.30808-6/223026893_10158294655997224_2627253782580690174_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=lr7KlpgiGhMQ7kNvgGWv-PB&_nc_zt=23&_nc_ht=scontent.flhe3-1.fna&_nc_gid=Ao68NVQRjcgIsnQMVzKvnfO&oh=00_AYAcS4My2rZmUWHuKCwWwvVKEHqAudcYrmadprVlivgKbg&oe=674257E5",
  },
  {
    id: "2",
    airlineName: "Airline 2",
    base: "Los Angeles",
    lastSeen: "10 mins ago",
    pilotName: "Jane Smith",
    position: "First Officer",
    image: "https://scontent.flhe3-1.fna.fbcdn.net/v/t39.30808-6/223026893_10158294655997224_2627253782580690174_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=lr7KlpgiGhMQ7kNvgGWv-PB&_nc_zt=23&_nc_ht=scontent.flhe3-1.fna&_nc_gid=Ao68NVQRjcgIsnQMVzKvnfO&oh=00_AYAcS4My2rZmUWHuKCwWwvVKEHqAudcYrmadprVlivgKbg&oe=674257E5",
  },
  {
    id: "3",
    airlineName: "Airline 3",
    base: "Los Angeles",
    lastSeen: "10 mins ago",
    pilotName: "Jane Smith",
    position: "First Officer",
    image: "https://scontent.flhe3-1.fna.fbcdn.net/v/t39.30808-6/223026893_10158294655997224_2627253782580690174_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=lr7KlpgiGhMQ7kNvgGWv-PB&_nc_zt=23&_nc_ht=scontent.flhe3-1.fna&_nc_gid=Ao68NVQRjcgIsnQMVzKvnfO&oh=00_AYAcS4My2rZmUWHuKCwWwvVKEHqAudcYrmadprVlivgKbg&oe=674257E5",
  },
];

const Home = () => {
  const renderItem = ({ item }: { item: typeof airlines[0] }) => (
    <LinearGradient
      colors={['#4898D8', '#50AAD6', '#58BBCF']} // Gradient colors
      style={{ padding: 15, borderRadius: 10, marginBottom: 15, height: 200 }}
    >
      <AirlineImageContainer>
        <AirlineImage source={{ uri: item.image }} />
      </AirlineImageContainer>
      <LeftContainer>
        <AirlineName>{item.airlineName}</AirlineName>
        <BottomLeftDetails>
          <DetailText>Base: {item.base}</DetailText>
          <DetailText>Last Seen: {item.lastSeen}</DetailText>
        </BottomLeftDetails>
      </LeftContainer>
      <RightContainer>
        <DetailText>Name: {item.pilotName}</DetailText>
        <DetailText>Position: {item.position}</DetailText>
      </RightContainer>
    </LinearGradient>
  );

  return (
    <Container>
      <HeadingText>Nearby Crew</HeadingText>
      <FlatList
        data={airlines}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Home;

const Container = styled.View`
  flex: 1;
  background-color: #FFFFFF;
  padding: 20px;
`;

const HeadingText = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #5DCBCF;
  margin-bottom: 20px;
`;

const ListItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #1e1e1e;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  width: 100%;
`;

const LeftContainer = styled.View`
  flex: 1;
  justify-content: space-between;
`;

const BottomLeftDetails = styled.View`
  margin-top: absolute;
  align-items: flex-start;
  margin-bottom: -32px;
`;

const RightContainer = styled.View`
  margin-top: absolute;
  align-items: flex-end;
`;

const AirlineName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #FFFFFF;
`;

const DetailText = styled.Text`
  font-size: 14px;
  color: #FFFFFF;
`;

const AirlineImageContainer = styled.View`
  position: absolute;
  top: 15px; 
  right: 15px;
  z-index: 1;
`;

const AirlineImage = styled.Image`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  margin-bottom: 10px;
`;

import React from "react";
import { FlatList, Dimensions, Text, View, Image } from "react-native";
import styled from "styled-components/native";
// Import BackgroundGradient
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get("window").width;

const jobs = [
  {
    id: "1",
    airlineName: "Airline 1",
    jobTitle: "Job Title",
    jobBase: "Job Base",
    pilotName: "Pilot Name",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8S94XvDD8H424x0NgoIcsBRayY9LTIpgR4Q&s",
  },
  {
    id: "2",
    airlineName: "Airline 2",
    jobTitle: "Job Title",
    jobBase: "Job Base",
    pilotName: "Pilot Name",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8S94XvDD8H424x0NgoIcsBRayY9LTIpgR4Q&s",
  },
  {
    id: "3",
    airlineName: "Airline 3",
    jobTitle: "Job Title",
    jobBase: "Job Base",
    pilotName: "Pilot Name",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8S94XvDD8H424x0NgoIcsBRayY9LTIpgR4Q&s",
  },
];

const Jobs = () => {
  const renderItem = ({ item }: { item: typeof jobs[0] }) => (
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
          <DetailText>{item.jobTitle}</DetailText>
          <DetailText>{item.jobBase}</DetailText>
          <DetailText>{item.pilotName}</DetailText>
        </BottomLeftDetails>
      </LeftContainer>
    </LinearGradient>
  );

  return (
    <Container>
      <HeadingText>Job Board</HeadingText>
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Jobs;

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
  margin-bottom: 0px;
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

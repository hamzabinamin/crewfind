import React from "react";
import { FlatList, Dimensions, Text, View, Image } from "react-native";
import styled from "styled-components/native";
// Import BackgroundGradient
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get("window").width;

const specials = [
  {
    id: "1",
    companyName: "Company 1",
    dealExpiration: "Exp 11/2024",
    image: "https://marketplace.canva.com/EAE0rNNM2Fg/1/0/1600w/canva-letter-c-trade-marketing-logo-design-template-r9VFYrbB35Y.jpg",
  },
  {
    id: "2",
    companyName: "Company 2",
    dealExpiration: "Exp 11/2024",
    image: "https://marketplace.canva.com/EAE0rNNM2Fg/1/0/1600w/canva-letter-c-trade-marketing-logo-design-template-r9VFYrbB35Y.jpg",
  },
  {
    id: "3",
    companyName: "Company 3",
    dealExpiration: "Exp 11/2024",
    image: "https://marketplace.canva.com/EAE0rNNM2Fg/1/0/1600w/canva-letter-c-trade-marketing-logo-design-template-r9VFYrbB35Y.jpg",
  },
];

const Specials = () => {
  const renderItem = ({ item }: { item: typeof specials[0] }) => (
    <LinearGradient
      colors={['#4898D8', '#50AAD6', '#58BBCF']} // Gradient colors
      style={{ padding: 15, borderRadius: 10, marginBottom: 15, height: 200 }}
    >
      <AirlineImageContainer>
        <AirlineImage source={{ uri: item.image }} />
      </AirlineImageContainer>
      <LeftContainer>
        <AirlineName>{item.companyName}</AirlineName>
        <BottomLeftDetails>
          <DetailText>{item.dealExpiration}</DetailText>
        </BottomLeftDetails>
      </LeftContainer>
    </LinearGradient>
  );

  return (
    <Container>
      <HeadingText>Nearby Deals</HeadingText>
      <FlatList
        data={specials}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Specials;

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

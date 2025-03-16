import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LoadingIndicator from "../utilities/LoadingIndicator";
import { Airline } from "../models/Airline";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { db } from "../../FirebaseConfig";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";

const Airlines = () => {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        setLoading(true);
        const airlinesSnapshot = await getDocs(collection(db, "Airlines"));
        const airlinesData: Airline[] = await Promise.all(
          airlinesSnapshot.docs.map(async (airlineDoc) => {
            const airlineData = airlineDoc.data();
            console.log("Fetched Airlines: ", airlineData);
  
            const logoUrl = airlineData.logoImage ? await UtilFunctions.fetchLogoUrl(airlineData.logoImage) : "https://via.placeholder.com/60";
  
            return {
              id: airlineDoc.id,
              name: airlineData.name,
              logoImageUrl: logoUrl,
              createdAt: new Date(airlineData.createdAt),
              updatedAt: new Date(airlineData.updatedAt),
            };
          })
        );
  
        setAirlines(airlinesData);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
      fetchAirlines();
  }, []);

  // Render each airline row
  const renderAirline = ({ item }: { item: Airline }) => (
    <AirlineRow>
      <AirlineLogo source={{ uri: item.logoImageUrl }} />
      <AirlineName>{item.name}</AirlineName>
      <ChatButton>
        <Icon name="chatbubble-outline" size={24} color="#555" />
      </ChatButton>
    </AirlineRow>
  );

  return (
    <Container>
       {loading && <LoadingIndicator />}
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


import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from "expo-router";
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { User } from "../../models/User";
import { Airline } from "../../models/Airline";
import UtilFunctions from "@/utilities/UtilFunctions";
import { Image } from "expo-image";
import { db } from "../../FirebaseConfig";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";

const Airlines = () => {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [chatIds, setChatIds] = useState<{ [key: string]: string | null }>({});
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      if (storedUser) {
        setUser(storedUser); // triggers the next useEffect
      }
    };
    fetchUserFromStorage();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAirlines();
    }
  }, [user]);

  const fetchAirlines = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const chatIdsStore: { [key: string]: string | null } = {};
      const airlinesSnapshot = await getDocs(collection(db, "Airlines"));
      const airlinesData: Airline[] = await Promise.all(
        airlinesSnapshot.docs.map(async (airlineDoc) => {
          const airlineData = airlineDoc.data();
          console.log("Fetched Airlines: ", airlineData);
          const logoUrl = airlineData.logoImage ? await UtilFunctions.fetchLogoUrl(airlineData.logoImage) : "https://dummyimage.com/300/fff/fff";

          const airlineId = airlineDoc.id;

          if (user) {
            console.log("user (Airlines): ", user);
            const chatQuery = query(
              collection(db, "Chats"),
              where("participants", "array-contains", user.id) // User must be in participants
            );

            const chatSnapshot = await getDocs(chatQuery);
            chatIdsStore[airlineId] = null; // Default to null
  
            for (const chatDoc of chatSnapshot.docs) {
              const chatData = chatDoc.data();
              if (Array.isArray(chatData.participants) && chatData.participants.includes(airlineId)) {
                chatIdsStore[airlineId] = chatDoc.id; // Store chat ID if found
                console.log("chatIdsStore(Airlines): ", chatIdsStore);
                break; // Stop searching once a chat is found
              }
            }
            setChatIds(chatIdsStore);
          }

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
      console.log("Chat Ids: ", chatIds);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const navigateToChat = (recipientId: string, chatId: string, otherParticipant: Airline) => {    
    router.push({
      pathname: "../../screens/MessageDetail",
      params: { recipientId, chatId, otherParticipantName: otherParticipant.name, otherParticipantImage: encodeURIComponent(otherParticipant.logoImageUrl ?? "") }
    });
  };

  const filteredAirlines = airlines.filter((airline) =>
    airline.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render each airline row
  const renderAirline = ({ item }: { item: Airline }) => (
    <AirlineRow>
      <AirlineLogo
        source={{
          uri: item.logoImageUrl
        }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <AirlineName>{item.name}</AirlineName>
      <ChatButton onPress={() => navigateToChat(item.id ?? "", chatIds[item.id ?? ""] ?? "", item)}>
        <Icon name="chatbubble-ellipses-outline" size={20} color="#fff" />
      </ChatButton>
    </AirlineRow>
  );

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <View style={{ backgroundColor: "#fff", padding: 15, borderRadius: 15, marginBottom: 15 }}>
        <SearchBarContainer>
          <Icon name="search" size={18} color="#999" style={{ marginRight: 10 }} />
          <SearchInput
            placeholder="Search Airlines..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </SearchBarContainer>

        <InfoBox>
          <InfoText>Browse and connect with airlines worldwide</InfoText>
        </InfoBox>
      </View>
      <FlatList
        data={filteredAirlines}
        renderItem={renderAirline}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        refreshing={refreshing}
        onRefresh={fetchAirlines}
        ListEmptyComponent={() => (
          <EmptyContainer>
            <EmptyMessage>No airlines to show</EmptyMessage>
          </EmptyContainer>
        )}
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

const AirlineRow = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 12px;
`;

const AirlineLogo = styled(Image)`
  width: 50px;
  height: 50px;
  margin-right: 15px;
  backgroundColor: #1c1c88;
  borderWidth: 1;
  borderColor: #1c1c88;
`;

const AirlineName = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const ChatButton = styled.TouchableOpacity`
  background-color: #1c1c88;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
`;

const SearchBarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #F2F3F5;
  border-radius: 10px;
  padding: 10px 15px;
  margin-bottom: 10px;
`;

const SearchInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
`;

const InfoBox = styled.View`
  background-color: #fff;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ccc;
  margin-bottom: 0px;
`;

const InfoText = styled.Text`
  font-size: 14px;
  color: #555;
  text-align: center;
`;

const SearchBar = styled.TextInput`
  height: 50px;
  background-color: #fff;
  border-radius: 25px;
  padding: 0 20px;
  font-size: 16px;
  margin-bottom: 10px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const EmptyMessage = styled.Text`
  text-align: center;
  font-size: 18px;
  color: #999;
  margin-top: 0px;
`;
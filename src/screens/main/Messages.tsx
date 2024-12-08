import React from 'react';
import { FlatList, TextInputProps } from 'react-native';
import styled from 'styled-components/native';

const Messages = () => {
  // Example data for the chat list
  const chatList = [
    {
      id: '1',
      name: 'John Doe',
      message: 'Hey, how are you?',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s',
    },
    {
      id: '2',
      name: 'Jane Smith',
      message: 'Let’s catch up tomorrow!',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      message: 'Got the documents you sent.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s',
    },
  ];

  // Render each chat row
  const renderChatItem = ({ item }: { item: typeof chatList[0] }) => (
    <ChatItem>
      <ChatImage source={{ uri: item.image }} />
      <ChatDetails>
        <ChatName>{item.name}</ChatName>
        <ChatMessage>{item.message}</ChatMessage>
      </ChatDetails>
    </ChatItem>
  );

  return (
    <Container>
      <SearchBar placeholder="Search" placeholderTextColor="#aaa" />
      <FlatList
        data={chatList}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Messages;

// Styled-components
const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
  padding: 10px;
`;

const SearchBar = styled.TextInput<TextInputProps>`
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

const ChatItem = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 10px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const ChatImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 15px;
`;

const ChatDetails = styled.View`
  flex: 1;
  justify-content: center;
`;

const ChatName = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const ChatMessage = styled.Text`
  font-size: 14px;
  color: #666;
  margin-top: 2px;
`;

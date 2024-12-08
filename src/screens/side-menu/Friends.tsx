import React, { useState } from 'react';
import { FlatList, Alert } from 'react-native';
import styled from 'styled-components/native';

const Friends = () => {
  // Example data
  const [blockedUsers, setUsers] = useState([
    { id: '1', name: 'John Doe', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s', isBlocked: true },
    { id: '2', name: 'Jane Smith', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s', isBlocked: true },
    { id: '3', name: 'Bob Johnson', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX8uvIm9k-h9Weo6XPPRRPTifgMEV4khlQoA&s', isBlocked: true },
  ]);

  // Toggle status
  const toggleStatus = (id: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, isBlocked: !user.isBlocked } : user
      )
    );
  };

  // Show confirmation dialog
  const showConfirmationDialog = (id: string, isBlocked: boolean) => {
    const action = isBlocked ? 'friend' : 'unfriend';
    Alert.alert(
      `Are you sure?`,
      `Are you sure you want to ${action} this person?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => toggleStatus(id),
        },
      ]
    );
  };

  // Render each user row
  const renderUser = ({ item }: { item: typeof blockedUsers[0] }) => (
    <UserRow>
      <UserImage source={{ uri: item.image }} />
      <UserName>{item.name}</UserName>
      <BlockButton
        onPress={() => showConfirmationDialog(item.id, item.isBlocked)}
        isBlocked={item.isBlocked}
      >
        <ButtonText>{item.isBlocked ? 'UnFriended' : 'Friends'}</ButtonText>
      </BlockButton>
    </UserRow>
  );

  return (
    <Container>
      <Heading>Friends List</Heading>
      <FlatList
        data={blockedUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Friends;

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

const UserRow = styled.View`
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

const UserImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 15px;
`;

const UserName = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const BlockButton = styled.TouchableOpacity<{ isBlocked: boolean }>`
  background-color: ${({ isBlocked }) => (isBlocked ? '#ff4d4d' : '#4caf50')};
  padding: 10px 20px;
  border-radius: 25px;
`;

const ButtonText = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: #fff;
`;

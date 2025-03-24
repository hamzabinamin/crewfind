import React from 'react';
import styled from 'styled-components/native';
import { useRouter } from "expo-router";

const Settings = () => { 
  const router = useRouter();
  return (
    <Container>
      {/* Settings List */}
      <ListItem onPress={() => router.push({ pathname: "/screens/auth/Register", params: { cameFromSettings: "true" } })}>
        <ListText>Profile Details</ListText>
      </ListItem>
      <ListItem onPress={() => router.push({ pathname: "/screens/auth/Register1", params: { cameFromSettings: "true" } })}>
        <ListText>Experience</ListText>
      </ListItem>
      <ListItem>
        <ListText>Deactivate Account</ListText>
      </ListItem>
      <ListItem>
        <ListText>Privacy Policy</ListText>
      </ListItem>

      {/* Separator Line */}
      <Separator />

      {/* Footer */}
      <FooterText>© 2025 Fullard Apps</FooterText>
    </Container>
  );
}

export default Settings;

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fc;
  padding: 20px;
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

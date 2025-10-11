import React, { useState } from 'react';
import { Pressable, Linking, TouchableOpacity, Alert, Text } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from "expo-router";
import LoadingIndicator from "../utilities/LoadingIndicator";
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../FirebaseConfig'; // adjust to your Firebase init

const Settings = () => { 
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDeactivateAccount = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
  
      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);
          
      if (!userSnap.exists()) {
        console.error("User document not found!");
        return;
      }
  
      await updateDoc(userRef, {
        isDeactivated: true,
        deactivatedAt: new Date(),
      });
  
      // Optionally log them out
      await signOut(auth);
      router.replace("../screens/auth/Login");
    } catch (error) {
      console.error('Error deactivating account:', error);
      Alert.alert('Error', 'Failed to deactivate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <ListItem onPress={() => router.push({ pathname: "/screens/auth/Register1", params: { cameFromSettings: "true" } })}>
        <ListText>Profile Details</ListText>
      </ListItem>
      <ListItem onPress={() => router.push({ pathname: "/screens/auth/Register2", params: { cameFromSettings: "true" } })}>
        <ListText>Experience</ListText>
      </ListItem>
      <ListItem onPress={() => {
        Alert.alert(
          'Deactivate Account',
          'Are you sure you want to deactivate your account?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Yes, Deactivate',
              style: 'destructive',
              onPress: handleDeactivateAccount,
            },
          ],
        );
      }}>
        <ListText style={{ color: 'red' }}>Deactivate Account</ListText>
      </ListItem>

      <ListItem  onPress={() => Linking.openURL("https://www.crewfind.app/terms.html")}>
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

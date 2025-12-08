import React, { useState } from 'react';
import { Pressable, Linking, TouchableOpacity, Alert, Text } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from "expo-router";
import LoadingIndicator from "../utilities/LoadingIndicator";
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { signOut, deleteUser } from 'firebase/auth';
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

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "Users", user.uid);

      // ✅ 1. Delete Firestore user data
      await deleteDoc(userRef);

      // ✅ 2. Delete Auth account
      await deleteUser(user);

      // ✅ 3. Redirect to Login
      router.replace("../screens/auth/Login");

    } catch (error: any) {
      console.error("Error deleting account:", error);

      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Reauthentication Required",
          "Please sign in again to delete your account."
        );
      } else {
        Alert.alert("Error", "Failed to delete account. Please try again.");
      }
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

      <ListItem
        onPress={() => {
          Alert.alert(
            "Delete Account",
            "This will permanently delete your account and all associated data. This action cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes, Delete",
                style: "destructive",
                onPress: handleDeleteAccount,
              },
            ]
          );
        }}
      >
        <ListText style={{ color: "#dc2626", fontWeight: "600" }}>
          Delete Account
        </ListText>
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

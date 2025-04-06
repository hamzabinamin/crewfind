import { View, Text, Button, TouchableOpacity, AppState, AppStateStatus } from "react-native";
import React, { useEffect, useRef } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import { Stack, router } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../FirebaseConfig"; 

export default function _layout() {

  const appState = useRef(AppState.currentState);

  // Update the "lastSeen" timestamp when the app comes to the foreground
  const updateLastSeen = async () => {
    const user = getAuth().currentUser;
    if (user) {
      const userRef = doc(db, "Users", user.uid);
      try {
        await updateDoc(userRef, {
          lastSeen: serverTimestamp(),
        });
        console.log("Last seen updated");
      } catch (error) {
        console.error("Error updating last seen:", error);
      }
    }
  };

  useEffect(() => {
    // Initial last seen update when the app is loaded
    updateLastSeen();

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        updateLastSeen(); // When the app resumes
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove(); // Clean up the listener when the component unmounts
    };
  }, []);


  return (
    <Stack>
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen name="screens/auth/Login" options={{ headerShown: false }} />
      <Stack.Screen
        name="screens/auth/ForgotPassword"
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="screens/auth/Register"
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="screens/auth/Register1"
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
       <Stack.Screen
        name="screens/auth/Register2"
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="screens/auth/Register3"
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="screens/MessageDetail"
        options={{
          headerTitle: "Messages",
          headerTitleStyle: {
            color: "#5DCBCF",
          },
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#5DCBCF" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>

    
    
  );
}
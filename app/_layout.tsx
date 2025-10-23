import { View, Text, Button, TouchableOpacity, AppState, AppStateStatus, StyleSheet } from "react-native";
import React, { useEffect, useRef } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import { Stack, router } from "expo-router";
import UtilFunctions from "@/app/utilities/UtilFunctions";

export default function _layout() {

  const customHeaderStyle = StyleSheet.create({
  header: {
    backgroundColor: "#ffffff",         // Required to make border visible
    borderBottomWidth: 1,              // The actual bottom border
    borderBottomColor: "#dcdcdc",      // Light grey border color
    elevation: 0,                      // Removes shadow on Android
    shadowOpacity: 0,      
  },
});

  const appState = useRef(AppState.currentState);

  // Update the "lastSeen" timestamp when the app comes to the foreground


  useEffect(() => {
    // Initial last seen update when the app is loaded
    UtilFunctions.updateLastSeen();

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        UtilFunctions.updateLastSeen(); // When the app resumes
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="screens/auth/Login" options={{ headerShown: false }} />
      <Stack.Screen
        name="screens/auth/ForgotPassword"
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#1c1c88" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="screens/auth/Register"
        options={{
          headerTitle: "Create Account",
          headerTransparent: false,
          headerTitleStyle: {
            color: "#1c1c88", // ← This changes the title text color
            fontWeight: "bold",
            fontSize: 18,
          },
         // headerStyle: customHeaderStyle.header as any,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#1c1c88" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="screens/auth/Register1"
        options={{
          headerTitle: "Create Account",
          headerTransparent: false,
          headerTitleStyle: {
            color: "#1c1c88", // ← This changes the title text color
            fontWeight: "bold",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#1c1c88" />
            </TouchableOpacity>
          ),
        }}
      />
       <Stack.Screen
        name="screens/auth/Register2"
        options={{
          headerTitle: "Create Account",
          headerTransparent: false,
          headerTitleStyle: {
            color: "#1c1c88", // ← This changes the title text color
            fontWeight: "bold",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#1c1c88" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="screens/auth/Register3"
        options={{
          headerTitle: "Create Account",
          headerTransparent: false,
          headerTitleStyle: {
            color: "#1c1c88", // ← This changes the title text color
            fontWeight: "bold",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#1c1c88" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="screens/auth/VerifyEmail"
        options={{
          headerTitle: "Verify Email",
          headerTransparent: false,
          headerTitleStyle: {
            color: "#1c1c88", // ← This changes the title text color
            fontWeight: "bold",
            fontSize: 18,
          },
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="screens/MessageDetail"
        options={{
          headerTitle: "Messages",
          headerTitleStyle: {
            color: "#000",
          },
          headerTransparent: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Icon name="chevron-left" size={20} color="#1c1c88" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>

    
    
  );
}
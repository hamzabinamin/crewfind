import React, { useEffect, useState, useRef } from "react";
import { View, Text, Button, TouchableOpacity, AppState, AppStateStatus, StyleSheet, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Stack, router } from "expo-router";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { auth } from "../FirebaseConfig";

export default function _layout() {


  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initial last seen update when the app is loaded
    const updateIfAuthenticated = async () => {
      const user = auth.currentUser; // Check if logged in
      if (user) {
        await UtilFunctions.updateLastSeen();
      }
    };

    updateIfAuthenticated();

    const subscription = AppState.addEventListener("change", async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        const user = auth.currentUser; // Check if logged in
        if (user) {
          await UtilFunctions.updateLastSeen(); // Only update if authenticated
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    const shouldSuppress = (message: any) => {
      const msg = message?.toString() || '';
      return msg.includes('permission-denied') || 
            msg.includes('Missing or insufficient permissions') ||
            msg.includes('@firebase/firestore');
    };

    console.error = (...args) => {
      if (shouldSuppress(args[0])) return;
      originalError(...args);
    };

    console.warn = (...args) => {
      if (shouldSuppress(args[0])) return;
      originalWarn(...args);
    };

    console.log = (...args) => {
      if (shouldSuppress(args[0])) return;
      originalLog(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
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
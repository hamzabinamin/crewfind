import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Alert } from "react-native";
import { Drawer } from 'expo-router/drawer';
import { DrawerToggleButton, DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { User } from "../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { auth } from '../../FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { router } from "expo-router";

getAuth().onAuthStateChanged((user) => {
  if(!user) {
    router.replace("/screens/auth/Login")
  }
});

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{ 
        headerShown: true, 
        swipeEdgeWidth: 0, 
        drawerActiveTintColor: "#5DCBCF", 
        headerLeft: () => (
          <DrawerToggleButton tintColor="#5DCBCF" />
        ) 
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Home",
          title: "Home",
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="Profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
          headerTitleStyle: {
            color: "#5DCBCF",
          },
          headerLeft: () => (
            <DrawerToggleButton tintColor="#5DCBCF" />
          ) 
        }}
      />
      <Drawer.Screen
        name="Experience"
        options={{
          drawerLabel: "Experience",
          title: "Experience",
          headerTitleStyle: {
            color: "#5DCBCF",
          },
          headerLeft: () => (
            <DrawerToggleButton tintColor="#5DCBCF" />
          ) 
        }}
      />
      <Drawer.Screen
        name="Airlines"
        options={{
          drawerLabel: "Airlines",
          title: "Airlines",
          headerTitleStyle: {
            color: "#5DCBCF",
          },
          headerLeft: () => (
            <DrawerToggleButton tintColor="#5DCBCF" />
          ) 
        }}
      />
       <Drawer.Screen
        name="Blocked"
        options={{
          drawerLabel: "Blocked",
          title: "Blocked",
          headerTitleStyle: {
            color: "#5DCBCF",
          },
          headerLeft: () => (
            <DrawerToggleButton tintColor="#5DCBCF" />
          ) 
        }}
      />
      <Drawer.Screen
        name="Friends"
        options={{
          drawerLabel: "Friends",
          title: "Friends",
          headerTitleStyle: {
            color: "#5DCBCF",
          },
          headerLeft: () => (
            <DrawerToggleButton tintColor="#5DCBCF" />
          ) 
        }}
      />
      <Drawer.Screen
        name="Settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          headerTitleStyle: {
            color: "#5DCBCF",
          },
          headerLeft: () => (
            <DrawerToggleButton tintColor="#5DCBCF" />
          ) 
        }}
      />
    </Drawer>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("Stored User: ", storedUser);
      if (storedUser) {
        setUser(storedUser);
      }
    };

    fetchUserFromStorage();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            auth.signOut()
          }, 
        },
      ]
    );
  };

  return (
    <DrawerContentScrollView {...props}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{
            uri: user?.profileImageUrl || "https://www.shutterstock.com/image-photo/head-shot-portrait-close-smiling-600nw-1714666150.jpg", // Replace with actual profile image URL
          }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{user?.name || "User"}</Text>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Drawer Items */}
      <DrawerItemList {...props} />

      {/* Logout Item */}
      <DrawerItem
        label="Logout"
        labelStyle={{ color: "red" }}
        onPress={handleLogout}
      />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
    marginHorizontal: 20,
  },
});

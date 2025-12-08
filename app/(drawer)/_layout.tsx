import { useEffect, useState, useRef } from "react";
import { View, Text, Image, StyleSheet, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Drawer } from 'expo-router/drawer';
import { DrawerToggleButton, DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { User } from "../models/User";
import eventEmitter from "../utilities/eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import FastImage from "react-native-fast-image"
import { auth } from '../../FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { router } from "expo-router";

export default function DrawerLayout() {
  const [hasStoredUser, setHasStoredUser] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      setHasStoredUser(!!storedUser);
    };

    fetchUserFromStorage();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribe = getAuth().onAuthStateChanged(async (user) => {
      if (!user && isMountedRef.current) {
        console.log("User signed out, clearing storage and redirecting.");
       /* try {
          await AsyncStorage.removeItem("user");
          router.replace("/screens/auth/Login");
        } catch (error) {
          console.error("Error clearing user:", error);
        } */
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  return (
    <Drawer
      screenOptions={{ 
        headerShown: true, 
        swipeEnabled: hasStoredUser,
        swipeEdgeWidth: 0, 
        drawerActiveTintColor: "#1c1c88", 
        headerLeft: hasStoredUser
          ? () => <DrawerToggleButton tintColor="#1c1c88" />
          : () => null,   // 👈 MUST RETURN null
        }}
        drawerContent={(props) =>
          hasStoredUser ? <CustomDrawerContent {...props} /> : <GuestDrawerContent {...props} />
        }
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
        name="Airlines"
        options={{
          drawerLabel: "Airlines",
          title: "Airlines",
          headerTitleStyle: {
            color: "#1c1c88",
          },
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/logo-with-text.png')}
                style={{ width: 25, height: 25, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Airlines</Text>
            </View>
          ),
         // headerLeft: () => (
         //   <DrawerToggleButton tintColor="#1c1c88" />
         // ) 
        }}
      />
       <Drawer.Screen
        name="Blocked"
        options={{
          drawerLabel: "Blocked",
          title: "Blocked",
          headerTitleStyle: {
            color: "#1c1c88",
          },
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/logo-with-text.png')}
                style={{ width: 25, height: 25, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Blocked</Text>
            </View>
          ),
         // headerLeft: () => (
         //   <DrawerToggleButton tintColor="#1c1c88" />
         // ) 
        }}
      />
      <Drawer.Screen
        name="Friends"
        options={{
          drawerLabel: "Friends",
          title: "Friends",
          headerTitleStyle: {
            color: "#1c1c88",
          },
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/logo-with-text.png')}
                style={{ width: 25, height: 25, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Friends</Text>
            </View>
          ),
        // headerLeft: () => (
        //   <DrawerToggleButton tintColor="#1c1c88" />
        // ) 
        }}
      />
      <Drawer.Screen
        name="Settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          headerTitleStyle: {
            color: "#1c1c88",
          },
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/logo-with-text.png')}
                style={{ width: 25, height: 25, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Settings</Text>
            </View>
          ),
        //  headerLeft: () => (
        //    <DrawerToggleButton tintColor="#1c1c88" />
        //  ) 
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

    const handleUserProfileUpdated = (updatedUser: any) => {
      console.log("🔄 Profile updated event received:", updatedUser);
      setUser(updatedUser);
    };

    eventEmitter.on("userProfileUpdated", handleUserProfileUpdated);

    return () => {
      eventEmitter.off("userProfileUpdated", handleUserProfileUpdated);
    };
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => { 
            auth.signOut()
            await AsyncStorage.removeItem("user");
            router.replace("/screens/auth/Login"); 
          }, 
        },
      ]
    );
  };

  return (
    <DrawerContentScrollView {...props}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <FastImage
          source={{
            uri:
              user?.profileImage ||
              "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png",
            priority: FastImage.priority.high,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.profileImage}
          resizeMode={FastImage.resizeMode.cover}
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

function GuestDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
      {/* Guest Header */}
      <View style={styles.profileSection}>
        <Image
          source={require('../../assets/images/logo-white.png')}
          style={{ width: 60, height: 60, marginBottom: 10 }}
          resizeMode="contain"
        />
        <Text style={styles.profileName}>Guest</Text>
        <Text style={{ color: "#6b7280", fontSize: 13 }}>
          Limited access
        </Text>
      </View>

      <View style={styles.separator} />

      {/* Login option */}
      <DrawerItem
        label="Login / Create Account"
        onPress={() => {
          router.replace("/screens/auth/Login");
        }}
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
  }
});

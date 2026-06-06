import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import { User } from "../../models/User";
import eventEmitter from "../../utilities/eventEmitter";
import UtilFunctions from "@/utilities/UtilFunctions";
import { Image as EImage } from "expo-image";
import usePushNotifications from "../../hooks/usePushNotifications";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { auth } from "../../FirebaseConfig";

GoogleSignin.configure({
  webClientId:
    "229155847690-ctgfkjhnpp8e2cj0mf9vatl7a56bdbpp.apps.googleusercontent.com",
  iosClientId:
    "229155847690-a4agpm1ivphmmfbcv7er383rp34rhigt.apps.googleusercontent.com",
});

const ACTIVE_COLOR = "#1c1c88";

/**
 * Replacement for @react-navigation/drawer's DrawerToggleButton.
 * Uses the navigation object provided by expo-router's Drawer.
 */
function DrawerToggle({ navigation }: any) {
  return (
    <TouchableOpacity
      onPress={() => navigation.toggleDrawer()}
      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="bars" size={20} color={ACTIVE_COLOR} />
    </TouchableOpacity>
  );
}

/**
 * Replacement for @react-navigation/drawer's DrawerItemList.
 * Renders one row per drawer screen and navigates via expo-router.
 */
function DrawerItems({ state, navigation, descriptors }: any) {
  return (
    <View>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const rawLabel = options.drawerLabel ?? options.title ?? route.name;
        const label =
          typeof rawLabel === "function"
            ? rawLabel({
                focused,
                color: focused ? ACTIVE_COLOR : "#000",
              })
            : rawLabel;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={[
              styles.drawerItem,
              focused && styles.drawerItemActive,
            ]}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "500",
                color: focused ? ACTIVE_COLOR : "#000",
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function DrawerLayout() {
  const [hasStoredUser, setHasStoredUser] = useState(false);
  const pathname = usePathname();

  usePushNotifications();

  useEffect(() => {
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      setHasStoredUser(!!storedUser);
    };

    fetchUserFromStorage();
  }, [pathname]);

  const renderLogoTitle = (titleText: string) => () => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Image
        source={require("../../assets/images/logo-with-text.png")}
        style={{ width: 25, height: 25, marginRight: 8 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#000" }}>
        {titleText}
      </Text>
    </View>
  );

  return (
    <Drawer
      screenOptions={({ navigation }) => ({
        headerShown: true,
        swipeEnabled: hasStoredUser,
        swipeEdgeWidth: 0,
        drawerActiveTintColor: ACTIVE_COLOR,
        headerLeft: hasStoredUser
          ? () => <DrawerToggle navigation={navigation} />
          : () => null,
      })}
      drawerContent={(props) =>
        hasStoredUser ? (
          <CustomDrawerContent {...props} />
        ) : (
          <GuestDrawerContent {...props} />
        )
      }
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Home",
          title: "Home",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Airlines"
        options={{
          drawerLabel: "Airlines",
          title: "Airlines",
          headerTitleStyle: { color: ACTIVE_COLOR },
          headerTitle: renderLogoTitle("Airlines"),
        }}
      />
      <Drawer.Screen
        name="Blocked"
        options={{
          drawerLabel: "Blocked",
          title: "Blocked",
          headerTitleStyle: { color: ACTIVE_COLOR },
          headerTitle: renderLogoTitle("Blocked"),
        }}
      />
      <Drawer.Screen
        name="Friends"
        options={{
          drawerLabel: "Friends",
          title: "Friends",
          headerTitleStyle: { color: ACTIVE_COLOR },
          headerTitle: renderLogoTitle("Friends"),
        }}
      />
      <Drawer.Screen
        name="Settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          headerTitleStyle: { color: ACTIVE_COLOR },
          headerTitle: renderLogoTitle("Settings"),
        }}
      />
    </Drawer>
  );
}

function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
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
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          props.navigation.closeDrawer();
          await AsyncStorage.removeItem("user");
          await auth.signOut();
          console.log("Seeing if it was Google login");
          try {
            await GoogleSignin.signOut();
            console.log("Google session cleared successfully.");
          } catch (error) {
            console.log(
              "Google sign out skipped (user likely logged in via Email/Apple)"
            );
          }

          if (Platform.OS === "ios") {
            router.replace("/screens/auth/Login");
          } else {
            router.push("/screens/auth/Login");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.drawerContainer}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <EImage
          source={{
            uri:
              user?.profileImage ||
              "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png",
          }}
          style={styles.profileImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <Text style={styles.profileName}>{user?.name || "User"}</Text>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Drawer Items */}
      <DrawerItems {...props} />

      {/* Logout Item */}
      <TouchableOpacity
        style={{ paddingVertical: 14, paddingHorizontal: 18 }}
        onPress={handleLogout}
      >
        <Text style={{ fontSize: 15, fontWeight: "500", color: "red" }}>
          Logout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function GuestDrawerContent(props: any) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.drawerContainer}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      {/* Guest Header */}
      <View style={styles.profileSection}>
        <Image
          source={require("../../assets/images/logo-white.png")}
          style={{ width: 60, height: 60, marginBottom: 10 }}
          resizeMode="contain"
        />
        <Text style={styles.profileName}>Guest</Text>
        <Text style={{ color: "#6b7280", fontSize: 13 }}>Limited access</Text>
      </View>

      <View style={styles.separator} />

      {/* Login option */}
      <TouchableOpacity
        style={{ paddingVertical: 14, paddingHorizontal: 18 }}
        onPress={() => {
          if (Platform.OS === "ios") {
            router.replace("/screens/auth/Login");
          } else {
            router.push("/screens/auth/Login");
          }
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "500", color: ACTIVE_COLOR }}>
          Login / Create Account
        </Text>
      </TouchableOpacity>
    </ScrollView>
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
  drawerItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  drawerItemActive: {
    backgroundColor: "rgba(28, 28, 136, 0.08)",
  },
});
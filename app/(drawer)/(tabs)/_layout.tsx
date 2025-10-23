import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, Text, Image } from "react-native";
import { DrawerToggleButton } from "@react-navigation/drawer";
import eventEmitter from "../../utilities/eventEmitter";
import { useUnreadMessages } from "../../../hooks/useUnreadMessages";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { Tabs } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";

export default function _layout() {
  const [user, setUser] = useState<User | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await UtilFunctions.getUser();
      if (storedUser) setUser(storedUser);
    };
    fetchUser();
  }, []);

  useUnreadMessages(user?.id);

  useEffect(() => {
    const handleUnreadChange = (hasUnread: boolean) => {
      setHasUnreadMessages(hasUnread);
    };

    eventEmitter.on("unreadMessagesChanged", handleUnreadChange);

    return () => {
      eventEmitter.off("unreadMessagesChanged", handleUnreadChange);
    };
  }, []);

  const handleFilterPress = (routeName: string) => {
    const eventName = `openFilter:${routeName}`;
    console.log(`Emitting event: ${eventName}`);
    eventEmitter.emit(eventName); 
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerLeft: () => <DrawerToggleButton tintColor="#1c1c88" />,
        headerRight: () =>
          route.name === "CrewFind" /*|| route.name === "Jobs" || route.name === "CrewSpecials" */ ? (
            <TouchableOpacity style={{ marginRight: 15 }} onPress={() => {
              // Handle the filter button press
              console.log('Filter button pressed');
              handleFilterPress(route.name)
            }}>
              <Icon name="filter" size={22} color="#1c1c88" />
            </TouchableOpacity>
          ) : route.name !== "Messages" && route.name !== "Jobs" && route.name !== "CrewSpecials" ? (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => console.log("Filter icon pressed")}
            >
              <Icon name="filter" size={22} color="#1c1c88" />
            </TouchableOpacity>
          ) : null,
        headerTitleStyle: {
          color: "#1c1c88", // Set the title color here
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Assign icons based on route name
          switch (route.name) {
            case "CrewFind":
              iconName = "home";
              break;
            case "CrewSpecials":
              iconName = "star";
              break;
            case "Jobs":
              iconName = "briefcase";
              break;
            case "Messages":
              iconName = "envelope";
              break;
            default:
              iconName = "circle";
              break;
          }

          return (
            <View style={{ position: "relative" }}>
              <Icon name={iconName} size={size} color={color} />
              {route.name === "Messages" && hasUnreadMessages && (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -6,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "red",
                  }}
                />
              )}
            </View>
          );
        },
        tabBarActiveTintColor: "#1c1c88",
        tabBarInactiveTintColor: "gray",
      })}
    >
      {/* Define your tabs */}
      <Tabs.Screen
        name="CrewFind"
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../../assets/images/logo-with-text.png')}
                style={{ width: 25, height: 25, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Find Crew</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="CrewSpecials" options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../../assets/images/logo-with-text.png')}
                style={{ width: 25, height: 25, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Crew Specials</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="Jobs" options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../../assets/images/logo-with-text.png')}
                style={{ width: 25, height: 25, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Job Opportunities</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="Messages" options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../../assets/images/logo-with-text.png')}
                style={{ width: 25, height: 25, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Messages</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

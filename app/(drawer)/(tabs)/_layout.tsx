import React, { useRef } from "react";
import { TouchableOpacity } from "react-native";
import { DrawerToggleButton } from "@react-navigation/drawer";
import eventEmitter from "../../utilities/eventEmitter";
import { Tabs } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";

export default function _layout() {

  const handleFilterPress = () => {
    console.log("Emitting openFilter event");
    eventEmitter.emit("openFilter"); 
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerLeft: () => <DrawerToggleButton tintColor="#5DCBCF" />,
        headerRight: () =>
          route.name === "Jobs" ? (
            <TouchableOpacity style={{ marginRight: 15 }} onPress={() => {
              // Handle the filter button press
              console.log('Filter button pressed');
              handleFilterPress()
            }}>
              <Icon name="filter" size={22} color="#5DCBCF" />
            </TouchableOpacity>
          ) : route.name !== "Messages" ? (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => console.log("Filter icon pressed")}
            >
              <Icon name="filter" size={22} color="#5DCBCF" />
            </TouchableOpacity>
          ) : null,
        headerTitleStyle: {
          color: "#5DCBCF", // Set the title color here
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Assign icons based on route name
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "CrewSpecials":
              iconName = "ticket";
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

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#5DCBCF",
        tabBarInactiveTintColor: "gray",
      })}
    >
      {/* Define your tabs */}
      <Tabs.Screen name="Home" options={{ title: "Crewfind" }} />
      <Tabs.Screen name="CrewSpecials" options={{ title: "Specials" }} />
      <Tabs.Screen name="Jobs" options={{ title: "Jobs" }}  />
      <Tabs.Screen name="Messages" options={{ title: "Messages" }} />
    </Tabs>
  );
}

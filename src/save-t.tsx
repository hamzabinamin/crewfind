import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Home from "./screens/main/Home";
import CrewSpecials from "./screens/main/CrewSpecials";
import Jobs from "./screens/main/Jobs";
import Messages from "./screens/main/Messages";
import Icon from 'react-native-vector-icons/FontAwesome';

const Tab = createBottomTabNavigator();

type MainTabsNavigationProp = DrawerNavigationProp<any, 'Home'>;

interface MainTabsProps {
  navigation: MainTabsNavigationProp;
}

function MainTabs({ navigation }: MainTabsProps) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = '';

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Specials':
              iconName = 'ticket';
              break;
            case 'Jobs':
              iconName = 'briefcase';
              break;
            case 'Messages':
              iconName = 'envelope';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5DCBCF',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: { backgroundColor: '#F8F9FC' },
        headerStyle: { backgroundColor: '#F8F9FC' },
        headerTintColor: '#5DCBCF',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          headerTitle: "Crewfind",
          headerLeft: () => (
            <Icon
              name="bars"
              size={22}
              color="#5DCBCF"
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 15 }}
            />
          ),
          headerRight: () => (
            <Icon
              name="filter"
              size={22}
              color="#5DCBCF"
              onPress={() => console.log("Filter pressed")}
              style={{ marginRight: 15 }}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Specials" 
        component={CrewSpecials}
        options={{
          headerLeft: () => (
            <Icon
              name="bars"
              size={25}
              color="#5DCBCF"
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 15 }}
            />
          ),
          headerRight: () => (
            <Icon
              name="filter"
              size={25}
              color="#5DCBCF"
              onPress={() => console.log("Filter pressed")}
              style={{ marginRight: 15 }}
            />
          ),
        }} 
      />
      <Tab.Screen 
        name="Jobs" 
        component={Jobs} 
        options={{
          headerLeft: () => (
            <Icon
              name="bars"
              size={25}
              color="#5DCBCF"
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 15 }}
            />
          ),
          headerRight: () => (
            <Icon
              name="filter"
              size={25}
              color="#5DCBCF"
              onPress={() => console.log("Filter pressed")}
              style={{ marginRight: 15 }}
            />
          ),
        }} 
      />
      <Tab.Screen 
        name="Messages" 
        component={Messages} 
        options={{
          headerLeft: () => (
            <Icon
              name="bars"
              size={25}
              color="#5DCBCF"
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 15 }}
            />
          )
        }} 
      />
    </Tab.Navigator>
  );
}

export default MainTabs;

import React from 'react';
import { Alert } from 'react-native';
import styled from 'styled-components/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './navigation/types'; // Import the RootStackParamList
import Login from '../app/screens/auth/Login';
import Register from './screens/auth/Register';
import Register1 from './screens/auth/Register1';
import Register2 from './screens/auth/Register2';
import Register3 from './screens/auth/Register3';
import ForgotPassword from './screens/auth/ForgotPassword';
import MainTabs from '../app/(drawer)/(tabs)/_layout';
import Profile from './screens/side-menu/Profile';
import Experience from './screens/side-menu/Experience';
import Airlines from './screens/side-menu/Airlines';
import Blocked from './screens/side-menu/Blocked';
import Friends from './screens/side-menu/Friends';
import Settings from './screens/side-menu/Settings';

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <DrawerContentScrollView {...props}>
      <ProfileSection>
        <ProfileImage source={{ uri: 'https://www.shutterstock.com/image-photo/head-shot-portrait-close-smiling-600nw-1714666150.jpg' }} />
        <Username>John Doe</Username>
      </ProfileSection>
      <Divider />
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: '#5DCBCF',
        drawerInactiveTintColor: '#999999',
        drawerActiveBackgroundColor: '#E1F3F6',
        drawerStyle: { backgroundColor: '#F8F9FC' },
      }}
    >
      <Drawer.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="Experience" component={Experience} />
      <Drawer.Screen name="Airlines" component={Airlines} />
      <Drawer.Screen name="Blocked" component={Blocked} />
      <Drawer.Screen name="Friends" component={Friends} />
      <Drawer.Screen name="Settings" component={Settings} />
      <Drawer.Screen name="Logout2" component={LogoutComponent} options={{ drawerLabel: 'Logout', headerShown: false }} />
    </Drawer.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={Register} options={{ headerTransparent: true }} />
      <Stack.Screen name="Register1" component={Register1} options={{ headerTransparent: true }} />
      <Stack.Screen name="Register2" component={Register2} options={{ headerTransparent: true }} />
      <Stack.Screen name="Register3" component={Register3} options={{ headerTransparent: true }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerTransparent: true }} />
      <Stack.Screen name="Home" component={DrawerNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppNavigator />
  );
}

function ExperienceComponent({ navigation }: any) {
  React.useEffect(() => {
    // Navigate to Register3 while maintaining the stack
    navigation.push('Register3');
  }, [navigation]);

  return null; 
}

function LogoutComponent({ navigation }: any) {
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Yes',
            onPress: () => navigation.replace('Login'),
          },
        ],
        { cancelable: true }
      );
    });

    return unsubscribe;
  }, [navigation]);
  return null;
}

const DrawerContent = styled(DrawerContentScrollView)`
  flex: 1;
`;

const ProfileSection = styled.View`
  align-items: center;
  padding: 20px 0;
  background-color: #f8f9fc;
`;

const ProfileImage = styled.Image`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  margin-bottom: 10px;
`;

const Username = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333333;
`;

const Divider = styled.View`
  height: 1px;
  background-color: #dddddd;
  margin: 10px 20px;
`;  

import { useEffect, useRef } from 'react';
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from 'expo-notifications';
import Login from "./app/screens/auth/Login";
import registerForPushNotificationsAsync from './app/notifications/registerForPushNotifications';
import { saveExpoPushToken } from './app/notifications/saveExpoPushToken';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const auth = getAuth();

// ✅ Set how notifications are handled when received in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // Feel free to keep this false if you prefer
    shouldSetBadge: false,
  }),
});

export default function App() {
  console.log("Inside App.tsx");
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // ✅ Register for push notifications only if user is logged in
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("Inside onAuthStateChanged");
      if (user) {
        console.log("User: ", user);
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log("Saving expo token");
          await saveExpoPushToken(user.uid, token);
        }
        else {
          console.log("Not saving expo token");
        }
      }
    });

    // ✅ Listener for notifications received while the app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("📥 Notification received (foreground):", notification);
    });

    // ✅ Listener for when a user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("🔔 Notification tapped:", response);
      // Optional: Navigate based on notification content
    });

    // ✅ Cleanup on unmount
    return () => {
      unsubscribeAuth();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Login />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

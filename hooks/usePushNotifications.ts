// app/hooks/usePushNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import registerForPushNotificationsAsync from '../app/notifications/registerForPushNotifications';
import { saveExpoPushToken } from '../app/notifications/saveExpoPushToken';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function usePushNotifications() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await saveExpoPushToken(user.uid, token);
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification response:", response);
    });

    return () => {
      unsubscribeAuth();
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
}

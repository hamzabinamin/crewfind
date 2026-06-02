// app/hooks/usePushNotifications.ts
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import registerForPushNotificationsAsync from '../notifications/registerForPushNotifications';
import { saveExpoPushToken } from '../notifications/saveExpoPushToken';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Global variable to track currently open chat ID
export let currentOpenChatId: string | null = null;
export const setCurrentOpenChatId = (chatId: string | null) => {
  currentOpenChatId = chatId;
};

export default function usePushNotifications() {
  const router = useRouter();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const chatId = notification.request.content.data?.chatId;

        // Suppress notification alert if user is already in that chat
        if (chatId && chatId === currentOpenChatId) {
          console.log("🔇 Suppressing notification because user is in this chat:", chatId);
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
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
      console.log("📥 Notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("🔔 Notification tapped:", response);

      const data = response.notification.request.content.data;
      console.log("🔔 Notification data:", data);
      // ✅ Check if this is a chat notification
      if (data?.type === "chat" && data?.chatId) {
        console.log("Navigating to chat:", data.chatId);
        router.push({ pathname: "../../screens/MessageDetail", params: { chatId: data.chatId, otherParticipantName: data.senderName ?? "", otherParticipantImage: encodeURIComponent(data.senderProfileImage ?? "") } });
      }
    });

    return () => {
      unsubscribeAuth();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
}

import { useEffect, useState } from "react";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import eventEmitter from "../app/utilities/eventEmitter"; 

export const useUnreadMessages = (userId?: string) => {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "Chats"), where("participants", "array-contains", userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let hasUnread = false;

      snapshot.docs.forEach((doc) => {
        const chat = doc.data();
        const lastMessageTimestamp = chat.timestamp || 0;
        const lastMessageSenderId = chat.lastMessageSenderId;
        const readTimestamps = chat.readTimestamps || {};

        const userLastRead = readTimestamps[userId] || 0;

        if (lastMessageTimestamp > userLastRead && lastMessageSenderId !== userId) {
          hasUnread = true;
        }
      });

      setHasUnreadMessages(hasUnread);

      // ✅ Emit to layout (so layout updates immediately)
      eventEmitter.emit("unreadMessagesChanged", hasUnread);
    });

    return () => unsubscribe();
  }, [userId]);

  return hasUnreadMessages;
};

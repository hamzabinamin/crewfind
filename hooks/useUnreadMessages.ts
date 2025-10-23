import { useEffect, useState, useRef } from "react";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import eventEmitter from "../app/utilities/eventEmitter"; 

export const useUnreadMessages = (userId?: string) => {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const prevUnreadRef = useRef<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "Chats"), where("participants", "array-contains", userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let hasUnread = false;

      snapshot.docs.forEach((doc) => {
        const chat = doc.data();
        const lastMessageTimestamp = chat.timestamp || 0;
        const lastMessageSenderId = chat.lastMessageSenderId ?? null; // 👈 Safe default
        const readTimestamps = chat.readTimestamps || {};
        const userLastRead = readTimestamps[userId] || 0;

        // ✅ Ignore unread if we can’t determine sender (undefined) OR if user sent it
        if (!lastMessageSenderId || lastMessageSenderId === userId) {
          console.log("🟢 Ignoring unread: no sender or self-sent");
          return;
        }

        // ✅ Only count as unread if newer message from someone else exists
        if (lastMessageTimestamp > userLastRead) {
          hasUnread = true;
        }
      });

      if (hasUnread !== prevUnreadRef.current) {
        setHasUnreadMessages(hasUnread);
        prevUnreadRef.current = hasUnread;

        console.log("🔔 unreadMessagesChanged emitted:", hasUnread);
        eventEmitter.emit("unreadMessagesChanged", hasUnread);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return hasUnreadMessages;
};

import { 
    collection, addDoc, query, where, getDocs, doc, setDoc, updateDoc, 
    Timestamp, orderBy 
  } from "firebase/firestore";
  import { db } from "../../FirebaseConfig"; // Ensure Firebase is initialized
  import { Message } from "../models/Message";
  
  // Create or fetch an existing chat between two users or a user and an airline
  export const getOrCreateChat = async (userId: string, recipientId: string) => {
    const chatRef = collection(db, "Chats");
  
    // 🔍 Query Firestore for a chat that contains both users in participantIds
    const chatQuery = query(chatRef, where("participants", "array-contains", userId));
    const chatSnapshot = await getDocs(chatQuery);
  
    let chat = null;
    chatSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(recipientId)) {
        chat = { id: doc.id, ...data };
      }
    });
  
    if (chat) {
      return chat; // ✅ Return existing chat
    }
  
    // 🆕 Create a new chat if not found
    const newChatRef = await addDoc(chatRef, {
     // participantIds: [userId, recipientId], // Store only IDs
      participants: [userId, recipientId], // Will be populated later with user/airline details
      lastMessage: "",
      timestamp: Timestamp.now().toMillis(),
    });
  
    return { 
      id: newChatRef.id, 
     // participantIds: [userId, recipientId], 
      participants: [userId, recipientId], // Placeholder for details
      lastMessage: "", 
      timestamp: Timestamp.now().toMillis() 
    };
  };
  
  // 📩 Send a message in a chat
  export const sendMessage = async (chatId: string, senderId: string, text: string) => {
    try {
        if (!chatId || !senderId || text.trim() === "") {
          throw new Error("Invalid chatId, senderId, or empty message.");
        }
    
        const messagesRef = collection(db, "Chats", chatId, "Messages");
        await addDoc(messagesRef, {
          senderId,
          text,
          timestamp: Timestamp.now().toMillis(),
        });
    
        const chatDocRef = doc(db, "Chats", chatId);
        await updateDoc(chatDocRef, {
          lastMessage: text,
          timestamp: Timestamp.now().toMillis(),
        });
    
        console.log("Message sent successfully!");
    } catch (error) {
        console.error("Error sending message:", error);
    }
  };
  
  // 📜 Fetch chat messages
  export const getMessages = async (chatId: string) => {
    const messagesRef = collection(db, "Chats", chatId, "Messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const snapshot = await getDocs(q);
  
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
  };

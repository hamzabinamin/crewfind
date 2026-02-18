import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from "date-fns";
import User from "../models/User";
import { db, auth } from "../../FirebaseConfig";
import { doc, addDoc, updateDoc, getDoc, getDocs, collection, serverTimestamp, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

class UtilFunctions {
  static convertToNumber(input: string): number | null {
    if (!input || isNaN(Number(input))) {
      return null; // Return null or handle invalid input
    }
    return Number(input); // or parseInt(input, 10) for integers
  }

  static convertToString(input: number): string | null {
    if (typeof input !== "number" || isNaN(input)) {
      return null; // Return null for invalid numbers
    }
    return input.toString();
  }

  static formatChatTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate(); // Convert Firestore timestamp to JS Date
    const now = new Date();
  
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    const isThisWeek = date > new Date(now.setDate(now.getDate() - now.getDay())); // Start of the week (Sunday)
  
    if (isToday) {
      return format(date, "h:mm a"); // Example: "8:18 PM"
    } else if (isYesterday) {
      return "Yesterday";
    } else if (isThisWeek) {
      return format(date, "EEEE"); // Example: "Wednesday"
    } else {
      return format(date, "M/d/yy"); // Example: "2/20/25"
    }
  };

  static isExternalUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };


  static fetchLogoUrl = async (imagePath: string) => {
    try {
        if (!auth.currentUser) {
      //    console.error("User not authenticated!");
     //     return "https://via.placeholder.com/60"; // Fallback image
        }
    
        const storage = getStorage();
        const logoRef = ref(storage, imagePath);
        return await getDownloadURL(logoRef);
    } catch (error) {
        console.error("Error fetching logo:", error);
        return "https://via.placeholder.com/60"; // Fallback image in case of an error
    }
  };

  static saveUser = async (user: User) => {
    try {
      const userJson = JSON.stringify(user);  // Convert the User object to a string
      await AsyncStorage.setItem('user', userJson);  // Store the user object with a key
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  static deleteUser = async () => {
    try {
      await AsyncStorage.removeItem("user"); // Remove the stored user
      console.log("User deleted from storage");
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  static getPositionIcon = (position: string) => {
    const pilotPositions = [
      "Captain",
      "First Officer",
      "Second Officer",
      "Private Pilot",
    ];
    if (pilotPositions.includes(position)) {
      return "plane";
    }
    return "briefcase"; // For cabin crew or others
  };

  static getUser = async (): Promise<User | null> => {
    try {
      const userJson = await AsyncStorage.getItem('user');  // Get the string from AsyncStorage
      if(userJson !== null) {
        return JSON.parse(userJson);  // Parse it into a User object
      } else {
        return null;  // Return null if the user is not found
      }
    } catch(error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }; 

  /// *** CHAT APIs *** ///

  static createOrGetChat = async (organizerId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return null; // Ensure user is logged in
  
    // Query Firestore for an existing chat between the two users
    const chatsRef = collection(db, "Chats");
    const q = query(chatsRef, where("participants", "array-contains", userId));
    const querySnapshot = await getDocs(q);
  
    // Check if a chat exists between the current user and the organizer
    let chatId = null;
    querySnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participants.includes(organizerId)) {
        chatId = doc.id; // Found existing chat
      }
    });
  
    // If chat doesn't exist, create a new one
    if (!chatId) {
      const newChatRef = await addDoc(chatsRef, {
        participants: [userId, organizerId],
        lastMessage: "",
        lastMessageTimestamp: serverTimestamp(),
      });
      chatId = newChatRef.id;
    }
  
    return chatId;
  };

  static sendMessage = async (chatId: string, messageText: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
  
    const messagesRef = collection(db, "Chats", chatId, "messages");
  
    await addDoc(messagesRef, {
      senderId: userId,
      text: messageText,
      timestamp: serverTimestamp(),
    });
  
    // Update the last message in the chat document
    const chatDocRef = doc(db, "Chats", chatId);
    await updateDoc(chatDocRef, {
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
    });
  };

  static updateLastSeen = async () => {
      const user = getAuth().currentUser;
      if (user) {
        const userRef = doc(db, "Users", user.uid);
        try {
          await updateDoc(userRef, {
            lastSeen: serverTimestamp(),
          });
          console.log("Last seen updated");
        } catch (error) {
          console.error("Error updating last seen:", error);
        }
      }
  };

  static updateUserCoordinates = async (latitude: number, longitude: number) => {
    const user = getAuth().currentUser;
    if (user) {
      const userRef = doc(db, "Users", user.uid);
      try {
        await updateDoc(userRef, {
          userCoordinates: {
            latitude,
            longitude,
          },
        });
        console.log("User coordinates updated");
      } catch (error) {
        console.error("Error updating coordinates:", error);
      }
    } else {
      console.warn("No authenticated user found");
    }
  };

  static getLastSeenText = (lastSeen: Date | null): string => {
    if (!lastSeen) return "A while ago";
  
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000); // difference in minutes
    const diffInHours = Math.floor(diffInMinutes / 60);
  
    if (diffInMinutes < 1) return "NOW";
    if (diffInMinutes <= 15) return "15 minutes ago";
    if (diffInMinutes <= 30) return "30 minutes ago";
    if (diffInMinutes <= 60) return "1 hour ago";
   
    if (diffInHours <= 12) return `${diffInHours} hours ago`;

    return "A while ago";
  };

}

export default UtilFunctions;
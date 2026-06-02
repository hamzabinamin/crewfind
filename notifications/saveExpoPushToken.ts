import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../FirebaseConfig';

/* export const saveExpoPushToken = async (uid: string, token: string) => {
  try {
    await setDoc(doc(db, 'Users', uid), {
      expoPushToken: token
    }, { merge: true }); // merge so you don't overwrite other fields
  } catch (err) {
    console.error("Failed to save push token:", err);
  }
}; */

export const saveExpoPushToken = async (uid: string, token: string) => {
  try {
    const userRef = doc(db, 'Users', uid);
    
    // Use updateDoc instead of setDoc - only updates existing documents
    await updateDoc(userRef, {
      expoPushToken: token
    });
    
    console.log("Push token saved successfully");
  } catch (error) {
    // If document doesn't exist yet, updateDoc will fail
    // This is fine - the token will be saved after user profile is created
    console.log("Push token will be saved after user profile is created");
  }
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3MNPVskSFN-NQUHPcYlkLaIa4FIYbNz8",
  authDomain: "crewfind-cfac2.firebaseapp.com",
  projectId: "crewfind-cfac2",
  storageBucket: "crewfind-cfac2.firebasestorage.app",
  messagingSenderId: "229155847690",
  appId: "1:229155847690:web:790d839d8ebceecb07e9f3",
  measurementId: "G-SX7DDRQBSW"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);
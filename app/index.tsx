import { useEffect, useState } from "react";
import { useRouter, useRootNavigationState } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import LoadingIndicator from "./utilities/LoadingIndicator";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("User state changed:", user); // Debug output
      if (user) {
        console.log("Going to home screen");
        router.replace("/(drawer)/(tabs)/Home");
      } 
      else {
        router.replace("/screens/auth/Login");
      }
    });

    return () => unsubscribe();
  }, [router]);

 /* useEffect(() => {
    if (navigationState?.key) {
      // Redirect to the Login screen once the Root Layout is ready
      router.replace("/screens/auth/Login");
    }
  }, [navigationState, router]); */

  return (
    <View style={styles.container}>
      {/* Loader while waiting */}
      <ActivityIndicator size="large" color="#5DCBCF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

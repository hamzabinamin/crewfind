import { useEffect } from "react";
import { useRouter, useRootNavigationState } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (navigationState?.key) {
      // Redirect to the Login screen once the Root Layout is ready
      router.replace("/screens/auth/Login");
    }
  }, [navigationState, router]);

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

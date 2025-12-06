import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { View, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { Video, ResizeMode } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

export default function Index() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [videoFinished, setVideoFinished] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Step 1: After video finishes, then check auth state
  useEffect(() => {
    if (videoFinished) {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthChecked(true);
      });

      return () => unsubscribe();
    }
  }, [videoFinished]);

  // Step 2: After both video and auth check complete, navigate
  useEffect(() => {
    if (videoFinished && authChecked) {
    /*  if (currentUser) {
        router.replace("/(drawer)/(tabs)/CrewFind");
      } else {
        router.replace("/screens/auth/Login");
      } */
      router.replace("/(drawer)/(tabs)/CrewFind");
    }
  }, [videoFinished, authChecked, currentUser]);

  return (
    <View style={styles.container}>
      {!videoFinished ? (
        <Video
          ref={videoRef}
          source={require("../assets/animation/startup.mp4")}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              setVideoFinished(true);
            }
          }}
        />
      ) : (
        <ActivityIndicator size="large" color="#5DCBCF" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    position: "absolute",
  },
});

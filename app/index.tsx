import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { View, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useVideoPlayer, VideoView } from "expo-video";

export default function Index() {
  const router = useRouter();
 // const videoRef = useRef<Video>(null);
  const [videoFinished, setVideoFinished] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const player = useVideoPlayer(require("../assets/animation/startup.mp4"), player => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      setVideoFinished(true);
    });

    return () => subscription.remove();
  }, [player]);

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
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
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
    justifyContent: "center", // Centers vertically
    alignItems: "center",
  },
  video: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    position: "absolute",
  },
});

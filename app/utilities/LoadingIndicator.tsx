import React from "react";
import { View, ActivityIndicator, StyleSheet, Modal } from "react-native";

const LoadingIndicator = () => {
  return (
    <Modal
      transparent={true} // Allows the screen beneath to be visible
      animationType="fade" // Smooth appearance/disappearance
    >
      <View style={styles.overlay}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#097054" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Translucent black overlay
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default LoadingIndicator;

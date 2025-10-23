import React from "react";
import { Text, TouchableOpacity, StyleSheet, GestureResponderEvent, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GradientButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  containerStyle?: ViewStyle; // Allows customization of the button size
  textStyle?: TextStyle; // Allows customization of the text style
}

const GradientButton: React.FC<GradientButtonProps> = ({ onPress, title, containerStyle, textStyle }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, containerStyle]}>
      <LinearGradient colors={["#4898D8", "#50AAD6", "#58BBCF"]} start={[0, 0]} end={[1, 1]} style={styles.gradient}>
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%", // Default full width unless overridden
    marginTop: 20,
  },
  gradient: {
    height: 60,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default GradientButton;

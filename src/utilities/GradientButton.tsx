import React from 'react';
import { Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';  // Import LinearGradient from expo-linear-gradient

interface GradientButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
}

const GradientButton: React.FC<GradientButtonProps> = ({ onPress, title }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <LinearGradient
        colors={['#4898D8', '#50AAD6', '#58BBCF']}  // Gradient colors (start to end)
        start={[0, 0]}                              // Gradient starts at top-left
        end={[1, 1]}                                // Gradient ends at bottom-right
        style={styles.gradient}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    marginTop: 20,
  },
  gradient: {
    height: 60,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GradientButton;

import React from 'react';
import {
  Keyboard,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
  ViewProps,
} from 'react-native';

interface Props extends ViewProps {
  children: React.ReactNode;
}

export default function DismissKeyboardView({ children, ...props }: Props) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        {...props}
      >
        {children}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

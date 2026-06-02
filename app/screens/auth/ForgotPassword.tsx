import React, { useState } from "react";
import { Dimensions, Alert, KeyboardAvoidingView, Platform } from "react-native";
import styled from "styled-components/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../FirebaseConfig";
import DismissKeyboardView from "../../../components/DismissKeyboardView";
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingIndicator from "../../../utilities/LoadingIndicator";

const screenWidth = Dimensions.get("window").width;

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email field cannot be empty.";
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    return "";
  };

  const handleResetPress = async () => {
    const validationError = validateEmail();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Try to send password reset email first
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          setError("No account found with this email address.");
          break;
        case 'auth/invalid-email':
          setError("Please enter a valid email address.");
          break;
        case 'auth/too-many-requests':
          setError("Too many attempts. Please try again later.");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your connection and try again.");
          break;
        case 'auth/user-disabled':
          setError("This account has been disabled. Please contact support.");
          break;
        default:
          // For other errors, try to check if it's a Google-only account
          try {
            const methods = await fetchSignInMethodsForEmail(auth, email.trim());
            console.log("Available sign-in methods:", methods);
            
            // If methods are returned and password is not included
            if (methods.length > 0 && !methods.includes("password")) {
              if (methods.includes("google.com")) {
                setError(
                  "This account was created using Google login. You cannot reset the password here. Please log in with Google."
                );
              } else {
                setError(
                  "This account doesn't use password login. Please use your original sign-in method."
                );
              }
            } else {
              // Fallback error message
              setError("Unable to send password reset email. This account may not use password authentication or there was an error. Please try logging in with Google or contact support.");
            }
          } catch (methodsError) {
            console.error("Error fetching sign-in methods:", methodsError);
            setError("Unable to send password reset email. This account may not use password authentication. Please try logging in with Google or contact support.");
          }
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <DismissKeyboardView style={{ flex: 1 }}>
          <Container>
            {loading && <LoadingIndicator />}
            <LogoContainer>
              <LogoCircle>
                <LogoImage source={require('../../../assets/images/logo-white.png')} resizeMode="contain" />
              </LogoCircle>
              <AppTitle>Reset Password!</AppTitle>
              <AppSubtitle>
                Enter your email to receive reset instructions.
              </AppSubtitle>
            </LogoContainer>

            <Form>
              <InputContainer>
                <StyledIconEmail name="envelope" size={20} color="#999999" />
                <Input
                  placeholder="Email"
                  placeholderTextColor="#999999"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(""); // Clear error when user types
                  }}
                  autoCapitalize="none"
                  editable={!resetSent}
                />
              </InputContainer>
              {error ? <ErrorText>{error}</ErrorText> : null}

              <ForgotPasswordButton 
                onPress={handleResetPress}
                disabled={loading || resetSent}
                opacity={loading || resetSent ? 0.6 : 1}
              >
                <ForgotPasswordText>
                  {resetSent ? "EMAIL SENT" : "SEND RESET REQUEST"}
                </ForgotPasswordText>
              </ForgotPasswordButton>

              {resetSent && (
                <SuccessMessage>
                  <Icon name="check-circle" size={16} color="#10b981" style={{ marginRight: 8 }} />
                  <SuccessText>Password reset email sent successfully!</SuccessText>
                </SuccessMessage>
              )}

              <NoteText>
                <NoteLabel>Note:</NoteLabel> Enter the email address associated with
                your account and we'll send an email with instructions to reset your
                password.
              </NoteText>

              {resetSent && (
                <AdditionalNote>
                  Didn't receive the email? Check your spam folder or{" "}
                  <ResendLink onPress={() => setResetSent(false)}>
                    try again
                  </ResendLink>
                </AdditionalNote>
              )}
            </Form>
          </Container>
        </DismissKeyboardView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;

const Container = styled.View`
  flex: 1;
  background-color: #ffffff;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  min-height: 100%;
`;

const LogoContainer = styled.View`
  align-items: center;
  margin-bottom: 40px;
`;

const LogoCircle = styled.View`
  width: 80px;
  height: 80px;
  background-color: #1c1c88;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const LogoImage = styled.Image`
  width: 60px;
  height: 60px;
`;

const AppTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #1c1c88;
`;

const AppSubtitle = styled.Text`
  font-size: 16px;
  color: #5c5c5c;
  margin-top: 5px;
  text-align: center;
`;

const Form = styled.View`
  width: 100%;
  max-width: 400px;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 10px;
  padding-horizontal: 12px;
  height: 48px;
  margin-bottom: 10px;
`;

const Input = styled.TextInput`
  flex: 1;
  height: 48px;
  color: #000000;
  padding-horizontal: 10px;
`;

const StyledIconEmail = styled(Icon)`
  margin-right: 8px;
`;

const ErrorText = styled.Text`
  color: red;
  font-size: 12px;
  margin-bottom: 10px;
  margin-left: 5px;
`;

const SuccessMessage = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 15px;
  padding: 12px;
  background-color: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
`;

const SuccessText = styled.Text`
  color: #10b981;
  font-size: 14px;
  font-weight: 500;
`;

const NoteText = styled.Text`
  margin-top: 20px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  line-height: 20px;
`;

const NoteLabel = styled.Text`
  color: #1c1c88;
  font-weight: bold;
`;

const AdditionalNote = styled.Text`
  margin-top: 15px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  line-height: 20px;
`;

const ResendLink = styled.Text`
  color: #1c1c88;
  font-weight: 600;
  text-decoration-line: underline;
`;

const ForgotPasswordButton = styled.TouchableOpacity<{ opacity: number }>`
  background-color: #1c1c88;
  height: 48px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  opacity: ${({ opacity }) => opacity};
`;

const ForgotPasswordText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;
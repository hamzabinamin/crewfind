import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView, SafeAreaView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import styled from "styled-components/native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function Register() {
  const router = useRouter();
  const { cameFromLogin } = useLocalSearchParams();
  const isFromLogin = cameFromLogin === "true";
  const [selectedRole, setSelectedRole] = useState<"Pilot" | "Cabin Crew" | null>(null);

  const handleNext = () => {
    if (selectedRole) {
      router.push({
        pathname: "./Register1",
        params: {cameFromLogin: isFromLogin ? "true" : "false", role: selectedRole },
      });
    }
  };

  return (
    <Container>
      <View style={{ height: 0.5, backgroundColor: "#ccc", width: "100%" }} />
      <ProgressHeader>
        <StepText>Step 1 of 4</StepText>
        <StepPercentage>25%</StepPercentage>
      </ProgressHeader>
      <ProgressBarContainer>
        <ProgressBarFill widthPercentage={25} />
      </ProgressBarContainer>

      <ScrollViewContent>
        <Heading>Choose Your Role</Heading>
        <SubText>Select your primary aviation profession</SubText>

        <RoleOption
          selected={selectedRole === "Pilot"}
          onPress={() => setSelectedRole("Pilot")}
        >
          <IconWrapper>
            <Ionicons name="person-outline" size={20} color="#fff" />
            {selectedRole === "Pilot" && (
              <CheckIcon name="checkmark" size={12} color="#fff" />
            )}
          </IconWrapper>
          <OptionDetails>
            <OptionTitle>Pilot</OptionTitle>
            <OptionSub>Captain, First Officer, etc.</OptionSub>
          </OptionDetails>
        </RoleOption>

        <RoleOption
          selected={selectedRole === "Cabin Crew"}
          onPress={() => setSelectedRole("Cabin Crew")}
        >
          <IconWrapper>
            <Ionicons name="people-outline" size={20} color="#fff" />
            {selectedRole === "Cabin Crew" && (
              <CheckIcon name="checkmark" size={12} color="#fff" />
            )}
          </IconWrapper>
          <OptionDetails>
            <OptionTitle>Cabin Crew</OptionTitle>
            <OptionSub>Flight Attendant, Purser, etc.</OptionSub>
          </OptionDetails>
        </RoleOption>
      </ScrollViewContent>

      <FixedBottom>
        <NextButton
          disabled={!selectedRole}
          activeOpacity={selectedRole ? 0.7 : 1}
          style={{
            backgroundColor: selectedRole ? "#1F2C91" : "#A6A6A6",
          }}
          onPress={handleNext}
        >
          <NextButtonText>Next</NextButtonText>
        </NextButton>
      </FixedBottom>
    </Container>
  );
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #fff;
`;

const ProgressHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px 5px 20px;
`;

const StepText = styled.Text`
  font-size: 14px;
  color: #8c8c8c;
`;

const StepPercentage = styled.Text`
  font-size: 14px;
  color: #000000;
`;

const ProgressBarContainer = styled.View`
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  width: 90%;
  margin: 10px 20px;
  overflow: hidden;
`;

const ProgressBarFill = styled.View<{ widthPercentage: number }>`
  height: 100%;
  width: ${(props) => props.widthPercentage}%;
  background-color: #1c1c88;
`;

const ScrollViewContent = styled(ScrollView).attrs({
  contentContainerStyle: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
})``;

const Heading = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #1c1c88;
  margin-bottom: 5px;
`;

const SubText = styled.Text`
  font-size: 16px;
  color: #5c5c5c;
  margin-bottom: 30px;
`;

const RoleOption = styled.TouchableOpacity<{ selected: boolean }>`
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: #1c1c88;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  background-color: ${({ selected }) => (selected ? "#EAF0FB" : "#fff")};
`;

const IconWrapper = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #1c1c88;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
`;

const CheckIcon = styled(Ionicons)`
  position: absolute;
  bottom: 2px;
  right: 2px;
`;

const OptionDetails = styled.View``;

const OptionTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #1c1c88;
`;

const OptionSub = styled.Text`
  font-size: 13px;
  color: #666;
`;

const FixedBottom = styled.View`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
`;

const NextButton = styled(TouchableOpacity)`
  padding: 15px;
  border-radius: 8px;
  align-items: center;
`;

const NextButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`;
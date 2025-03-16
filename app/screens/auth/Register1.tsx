import { Dimensions, Alert, Modal, FlatList, TouchableOpacity, Text } from "react-native";
import React, { useState } from "react";
import styled from "styled-components/native";
import GradientButtonWithArrow from "../../utilities/GradientButtonWithArrow";
import Icon from "react-native-vector-icons/FontAwesome";
import { User } from "../../models/User";
import { useRouter, useLocalSearchParams } from "expo-router";

const screenWidth = Dimensions.get("window").width;

const Register1 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userString = typeof params.user === "string" ? params.user : null;
  const [user, setUser] = useState<Partial<User>>(userString ? JSON.parse(userString) : {});
  console.log("Received User: ", user);

  const [position, setPosition] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [hobbies, setHobbies] = useState("");

  // State for showing modals
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showSexModal, setShowSexModal] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);

  // List of options for Position, Sex, Relationship Status
  const positionOptions = [
    "Captain", "First Officer", "Second Officer", "Cabin Crew", "Private Pilot"
  ];

  const sexOptions = ["Male", "Female"];
  const relationshipOptions = ["Single", "Married", "Unspecified"];

  const handleStep2Press = () => {
    if (!position || !companyName || !age || !sex || !relationshipStatus || !hobbies) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      Alert.alert("Validation Error", "Please enter a valid age.");
      return;
    }

    let sanitizedSex = sex.trim().toLowerCase();
    if (sanitizedSex === "male" || sanitizedSex === "female") {
      sanitizedSex = sanitizedSex.charAt(0).toUpperCase() + sanitizedSex.slice(1);
    } else {
      Alert.alert("Validation Error", "Sex must be either 'Male' or 'Female'.");
      return;
    }

    const sanitizedHobbies = hobbies.trim();
    if (sanitizedHobbies.length > 300) {
      Alert.alert("Validation Error", "Hobbies must be less than 300 characters.");
      return;
    }

    if (sanitizedHobbies.endsWith(",") || sanitizedHobbies.includes(",,")) {
      Alert.alert(
        "Validation Error",
        "Hobbies must be a comma-separated list without a trailing comma or consecutive commas."
      );
      return;
    }

    // Update user object
    const updatedUser = {
      ...user,
      position: position,
      companyName: companyName,
      age: parsedAge,
      sex: sanitizedSex,
      relationshipStatus: relationshipStatus,
      hobbies: sanitizedHobbies.split(",").map((hobby) => hobby.trim()), // Convert to array of trimmed hobbies
    };

    // Navigate to Register2
    router.push({
      pathname: "./Register2",
      params: { user: JSON.stringify(updatedUser) },
    });
  };

  return (
    <Container>
      <ImageContainer>
        <AirplaneImage source={require("../../../assets/images/airplane-login.jpg")} resizeMode="cover" />
        <Overlay />
      </ImageContainer>
      <HeadingText>
        Create an <BlueText>Account!</BlueText>
      </HeadingText>
      <Form>
        <InputContainer>
          <StyledIconEmail name="briefcase" size={20} color="#999999" />
          <Input
            placeholder="Position"
            placeholderTextColor="#999999"
            keyboardType="default"
            value={position}
            editable={false}
          />
          <TouchableOpacity onPress={() => setShowPositionModal(true)}>
            <Icon name="caret-down" size={20} color="#999999" />
          </TouchableOpacity>
        </InputContainer>
        <InputContainer>
          <StyledIconEmail name="id-badge" size={20} color="#999999" />
          <Input
            placeholder="Company Name"
            placeholderTextColor="#999999"
            keyboardType="default"
            onChangeText={setCompanyName}
          />
        </InputContainer>
        <InputContainer>
          <StyledIconEmail name="calendar" size={20} color="#999999" />
          <Input
            placeholder="Age"
            placeholderTextColor="#999999"
            keyboardType="numeric"
            onChangeText={setAge}
          />
        </InputContainer>
        <InputContainer>
          <StyledIconEmail name="mars" size={20} color="#999999" />
          <Input
            placeholder="Sex"
            placeholderTextColor="#999999"
            value={sex}
            editable={false}
          />
          <TouchableOpacity onPress={() => setShowSexModal(true)}>
            <Icon name="caret-down" size={20} color="#999999" />
          </TouchableOpacity>
        </InputContainer>
        <InputContainer>
          <StyledIconEmail name="users" size={20} color="#999999" />
          <Input
            placeholder="Relationship Status"
            placeholderTextColor="#999999"
            value={relationshipStatus}
            editable={false}
          />
          <TouchableOpacity onPress={() => setShowRelationshipModal(true)}>
            <Icon name="caret-down" size={20} color="#999999" />
          </TouchableOpacity>
        </InputContainer>
        <InputContainer>
          <StyledIconEmail name="paint-brush" size={20} color="#999999" />
          <Input
            placeholder="Hobbies (e.g., Reading, Swimming)"
            placeholderTextColor="#999999"
            keyboardType="default"
            onChangeText={setHobbies}
          />
        </InputContainer>
        <GradientButtonWithArrow title="Step 2 of 3" onPress={handleStep2Press} />
      </Form>

      {/* Position Modal */}
      <Modal transparent={true} visible={showPositionModal} animationType="slide">
        <ModalOverlay>
          <ModalContent>
            <FlatList
              data={positionOptions}
              renderItem={({ item }) => (
                <Option onPress={() => { setPosition(item); setShowPositionModal(false); }}>
                  <OptionText>{item}</OptionText>
                </Option>
              )}
              keyExtractor={(item) => item}
            />
            <CloseButton onPress={() => setShowSexModal(false)}>
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      </Modal>

      {/* Sex Modal */}
      <Modal transparent={true} visible={showSexModal} animationType="slide">
        <ModalOverlay>
          <ModalContent>
            <FlatList
              data={sexOptions}
              renderItem={({ item }) => (
                <Option onPress={() => { setSex(item); setShowSexModal(false); }}>
                  <OptionText>{item}</OptionText>
                </Option>
              )}
              keyExtractor={(item) => item}
            />
             <CloseButton onPress={() => setShowSexModal(false)}>
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      </Modal>

      {/* Relationship Status Modal */}
      <Modal transparent={true} visible={showRelationshipModal} animationType="slide">
        <ModalOverlay>
          <ModalContent>
            <FlatList
              data={relationshipOptions}
              renderItem={({ item }) => (
                <Option onPress={() => { setRelationshipStatus(item); setShowRelationshipModal(false); }}>
                  <OptionText>{item}</OptionText>
                </Option>
              )}
              keyExtractor={(item) => item}
            />
            <CloseButton onPress={() => setShowSexModal(false)}>
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Container>
  );
};

export default Register1;

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fc;
  align-items: center;
  justify-content: center;
`;

const ImageContainer = styled.View`
  position: absolute;
  top: 0;
  width: ${screenWidth}px;
  height: 300px;
`;

const AirplaneImage = styled.Image`
  width: ${screenWidth}px;
  height: 300px;
  margin-bottom: 20px;
  position: absolute;
  top: 0;
`;

const Overlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
`;

const HeadingText = styled.Text`
  position: absolute;
  top: 100px;
  margin-left: 20px;
  margin-bottom: 30px;
  font-size: 44px;
  font-weight: bold;
  color: #fff;
`;

const BlueText = styled.Text`
  color: #5dcbcf;
`;

const Form = styled.View`
  margin-top: 260px;
  width: 80%;
  max-width: 400px;
  align-items: center;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 60px;
  background-color: #ffffff;
  border-radius: 10px;
  padding-horizontal: 10px;
  margin-bottom: 8px;
`;

const StyledIconEmail = styled(Icon)`
  margin-right: 10px;
`;

const Input = styled.TextInput`
  flex: 1;
  height: 60px;
  padding: 12px;
  font-size: 16px;
  color: #000;
  background-color: #ffffff;
`;

const CloseButton = styled.TouchableOpacity`
  padding: 15px;
  background-color: red;
  border-radius: 10px;
  width: 100%;
  align-items: center;
  margin-top: 10px;
`;

const ModalOverlay = styled.View`
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  width: 100%;
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  justify-content: center;
  max-height: 60%;
`;

const Option = styled.TouchableOpacity`
  padding: 15px;
`;

const OptionText = styled.Text`
  font-size: 18px;
`;

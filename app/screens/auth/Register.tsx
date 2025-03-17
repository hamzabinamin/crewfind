import { Dimensions, Alert, Modal, FlatList, TouchableOpacity, Text } from "react-native";
import React, { useEffect, useState } from "react";
import styled from "styled-components/native";
import GradientButtonWithArrow from "../../utilities/GradientButtonWithArrow";
import Icon from "react-native-vector-icons/FontAwesome";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { useRouter,  useLocalSearchParams } from "expo-router";

// Static list of countries (simplified for the example)
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea (North)", "Korea (South)", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru",
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const screenWidth = Dimensions.get("window").width;

const Register = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [base, setBase] = useState(""); // This field will now trigger the modal
  const [nationality, setNationality] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const params = useLocalSearchParams();
  const cameFromSettings = params.cameFromSettings === "true";
  console.log("Params", params);
  console.log("cameFromSettings", cameFromSettings);

  useEffect(() => {
    console.log("Inside Register's useEffect");
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("Stored User: ", storedUser);
      if (storedUser) {
        setUser(storedUser);
        updateFieldsForEdit(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

  const updateFieldsForEdit = (user: User) => {
    setName(user.name);
    setSurname(user.surName);
    setEmail(user.email);
    setBase(user.base);
    setNationality(user.nationality);
  };

  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleStep1Press = async () => {
    if (!name || !surname || !email || (!password && !cameFromSettings) || !base || !nationality) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    if (!isEmailValid(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address!");
      return;
    }

    if (password.length < 8 && !cameFromSettings) {
      Alert.alert("Validation Error", "Password must be at least 8 characters long!");
      return;
    }

    if(user) {
      user.name = name;
      user.surName = surname;
      user.email = email;
      user.password = password;
      user.base = base;
      user.nationality = nationality;  

      router.push({
        pathname: cameFromSettings ? "./Register2" : "./Register1",
        params: { 
          user: JSON.stringify(user),  
          ...(cameFromSettings && { cameFromSettings: "true" }) 
        } 
      });
    }
  
   /* const user = {
      name,
      surName: surname,
      email,
      password,
      base,
      nationality,
    }; */
  };

  const handleCountrySelect = (country: string) => {
    setBase(country); // Set the selected country as the base
    setShowModal(false); // Close modal after selection
  };

  return (
    <Container>
      <ImageContainer>
        <AirplaneImage source={require("../../../assets/images/airplane-login.jpg")} resizeMode="cover" />
        <Overlay />
      </ImageContainer>
      <HeadingText>
        {cameFromSettings ? "Profile " : "Create an  "}
        <BlueText>{cameFromSettings ? "Management!" : "Account!"}</BlueText>
      </HeadingText>
      <Form>
        <InputContainer>
          <StyledIconEmail name="user" size={20} color="#999999" />
          <Input placeholder="Name" placeholderTextColor="#999999" keyboardType="default" value={name} onChangeText={setName} />
        </InputContainer>
        <InputContainer>
          <StyledIconEmail name="user" size={20} color="#999" />
          <Input placeholder="Surname" placeholderTextColor="#999999" keyboardType="default" value={surname} onChangeText={setSurname} />
        </InputContainer>
        <InputContainer>
          <StyledIconEmail name="envelope" size={20} color="#999999" />
          <Input placeholder="Email" placeholderTextColor="#999999" keyboardType="email-address" value={email} onChangeText={setEmail} />
        </InputContainer>
        {!cameFromSettings && (
          <InputContainer>
            <StyledIconEmail name="lock" size={20} color="#999999" />
            <Input 
              placeholder="Password" 
              placeholderTextColor="#999999" 
              keyboardType="default" 
              secureTextEntry={true} 
              onChangeText={setPassword} 
            />
          </InputContainer>
        )}
        <InputContainer>
          <StyledIconEmail name="map-marker" size={20} color="#999999" />
          <Input
            placeholder="Base"
            placeholderTextColor="#999999"
            editable={false}
            value={base} // Show the selected base country
          />
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Icon name="caret-down" size={20} color="#999999" />
          </TouchableOpacity>
        </InputContainer>
        <InputContainer>
          <StyledIconEmail name="flag" size={20} color="#999999" />
          <Input placeholder="Nationality" placeholderTextColor="#999999" keyboardType="default" value={nationality} onChangeText={setNationality} />
        </InputContainer>
        <GradientButtonWithArrow title={cameFromSettings ? "Save and Continue" : "Step 1 of 3"}  onPress={handleStep1Press} />
      </Form>

      {/* Country Selection Modal */}
      <Modal transparent={true} visible={showModal} animationType="slide">
        <ModalOverlay>
          <ModalContent>
            <FlatList
              data={countries}
              renderItem={({ item }) => (
                <CountryOption onPress={() => handleCountrySelect(item)}>
                  <CountryText>{item}</CountryText>
                </CountryOption>
              )}
              keyExtractor={(item) => item}
              style={{ maxHeight: 300 }} // Set the max height for the modal content
            />
            <CloseButton onPress={() => setShowModal(false)}>
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Container>
  );
};

export default Register;

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
  background-color: rgba(0, 0, 0, 0.5);
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
  margin-top: 190px;
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
  margin: 8px 0;
  border-radius: 15px;
  font-size: 16px;
  color: #000;
  background-color: #ffffff;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  elevation: 5;
`;

const CountryOption = styled.TouchableOpacity`
  padding: 15px;
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #ddd;
`;

const CountryText = styled.Text`
  font-size: 18px;
  color: #000;
`;

const CloseButton = styled.TouchableOpacity`
  padding: 15px;
  background-color: red;
  border-radius: 10px;
  width: 100%;
  align-items: center;
  margin-top: 10px;
`;

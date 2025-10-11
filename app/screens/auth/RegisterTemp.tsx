import { Dimensions, Alert, Modal, FlatList, TouchableOpacity, Text, TextInput, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import React, { useEffect, useState } from "react";
import styled from "styled-components/native";
import GradientButtonWithArrow from "../../utilities/GradientButtonWithArrow";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter,  useLocalSearchParams } from "expo-router";
import { User, createUser } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";

// Static list of countries (simplified for the example)
const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia",
    "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
    "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
    "Congo", "Costa Rica", "Croatia", "Cuba", "Curacao", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti",
    "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
    "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Isle of Man", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya",
    "Kiribati", "Korea (North)", "Korea (South)", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
    "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia", "Maldives",
    "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova",
    "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
    "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Northern Cyprus", "Norway", "Oman", "Pakistan",
    "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico",
    "Qatar", "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Samoa",
    "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten", "Slovakia",
    "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
    "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
    "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"
];

const screenWidth = Dimensions.get("window").width;

const Register = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [base, setBase] = useState(""); // This field will now trigger the modal
  const [nationality, setNationality] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const cameFromSettings = params.cameFromSettings === "true";
  console.log("Params", params);
  console.log("cameFromSettings", cameFromSettings);

  useEffect(() => {
    console.log("Inside Register's useEffect");
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("Stored User: ", storedUser);
      if (storedUser && cameFromSettings) {
        setUser(storedUser);
        updateFieldsForEdit(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

  useEffect(() => {
    const filtered = countries.filter((country) =>
      country.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredCountries(filtered);
  }, [searchText, countries]);

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
    console.log("Inside handleStep1Press");
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

    if(user && cameFromSettings) {
      user.name = name;
      user.surName = surname;
      user.email = email;
      user.password = password;
      user.base = base;
      user.nationality = nationality; 
      
      try {
        if (!user.id) {
          throw new Error("User id is required for registration.");
        }
        setLoading(true);
        const userRef = doc(db, "Users", user.id); // Adjust the collection name as needed
        await updateDoc(userRef, {
          name,
          surName: surname,
          email,
          base,
          nationality,
        });

        router.push({
          pathname: "./Register2",
          params: { 
            user: JSON.stringify(user),  
            ...(cameFromSettings && { cameFromSettings: "true" }) 
          } 
        });

      } catch (error) {
        console.error("Error updating profile:", error);
        Alert.alert("Error", "Failed to update profile. Please try again.");
        return;
      }
      finally {
        setLoading(false);
      }
    }
    else {
      let user = createUser();
      user.name = name;
      user.surName = surname;
      user.email = email;
      user.password = password;
      user.base = base;
      user.nationality = nationality; 
      console.log("Going to Register1");
        router.push({
          pathname: "./Register1",
          params: { 
            user: JSON.stringify(user)
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
    <DismissKeyboardView>
      <Container>
        {loading && <LoadingIndicator />}
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
            <Input placeholder="Email" placeholderTextColor="#999999" keyboardType="email-address" value={email} onChangeText={setEmail} editable={!cameFromSettings} />
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
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <InputContainer>
              <StyledIconEmail name="map-marker" size={20} color="#999999" />
              <Input
                placeholder="Base"
                placeholderTextColor="#999999"
                editable={false}
                value={base}
                pointerEvents="none" // disables interaction so touch passes to TouchableOpacity
              />
              <Icon name="caret-down" size={20} color="#999999" />
            </InputContainer>
          </TouchableOpacity>
          <InputContainer>
            <StyledIconEmail name="flag" size={20} color="#999999" />
            <Input placeholder="Nationality" placeholderTextColor="#999999" keyboardType="default" value={nationality} onChangeText={setNationality} />
          </InputContainer>
          <GradientButtonWithArrow title={cameFromSettings ? "Save and Continue" : "Step 1 of 3"} onPress={handleStep1Press} />
        </Form>

        {/* Country Selection Modal */}
        <Modal transparent={true} visible={showModal} animationType="slide">
          <ModalOverlay>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: "flex-end" }} // ensures it sticks to bottom
              >
                <ModalContent>
                  <TextInput
                    placeholder="Search Country"
                    placeholderTextColor="#888"
                    value={searchText}
                    onChangeText={setSearchText}
                    style={{
                      padding: 10,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 8,
                      backgroundColor: "#fff",
                    }}
                  />
                  <FlatList
                    data={filteredCountries}
                    renderItem={({ item }) => (
                      <CountryOption onPress={() => handleCountrySelect(item)}>
                        <CountryText>{item}</CountryText>
                      </CountryOption>
                    )}
                    keyExtractor={(item) => item}
                    style={{ maxHeight: 300 }}
                    keyboardShouldPersistTaps="handled"
                  />
                  <CloseButton onPress={() => setShowModal(false)}>
                    <Text style={{ color: "#fff" }}>Cancel</Text>
                  </CloseButton>
                </ModalContent>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </ModalOverlay>
        </Modal>
      </Container>
    </DismissKeyboardView>
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

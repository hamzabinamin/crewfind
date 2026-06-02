import {
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  TextInputProps,
} from "react-native";
import React, { useEffect, useState } from "react";
import styled from "styled-components/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { User, createUser } from "../../../models/User";
import UtilFunctions from "@/utilities/UtilFunctions";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import LoadingIndicator from "../../../utilities/LoadingIndicator";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";

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

const nationalities = [
  "Afghan", "Albanian", "Algerian", "Andorran", "Angolan", "Antiguan and Barbudan", "Argentine", "Armenian", "Aruban", "Australian",
  "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese",
  "Bermudian", "Bhutanese", "Bolivian", "Bosnian and Herzegovinian", "Botswanan", "Brazilian", "Bruneian", "Bulgarian", "Burkinabé", "Burundian",
  "Cape Verdean", "Cambodian", "Cameroonian", "Canadian", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comorian",
  "Congolese", "Costa Rican", "Croatian", "Cuban", "Curaçaoan", "Cypriot", "Czech", "Congolese (Democratic Republic)", "Danish", "Djiboutian",
  "Dominican", "Ecuadorian", "Egyptian", "Salvadoran", "Equatorial Guinean", "Eritrean", "Estonian", "Swazi", "Ethiopian",
  "Faroese", "Fijian", "Finnish", "French", "French Guianese", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian",
  "Gibraltar", "Greek", "Greenlandic", "Grenadian", "Guadeloupean", "Guatemalan", "Channel Islander (Guernsey)", "Guinean", "Bissau-Guinean", "Guyanese",
  "Haitian", "Honduran", "Hong Konger", "Hungarian", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish",
  "Manx", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Channel Islander (Jersey)", "Jordanian", "Kazakh", "Kenyan",
  "Kiribati", "North Korean", "South Korean", "Kosovan", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Basotho",
  "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourgish", "Macanese", "Malagasy", "Malawian", "Malaysian", "Maldivian",
  "Malian", "Maltese", "Marshallese", "Martinican", "Mauritanian", "Mauritian", "Mahoran", "Mexican", "Micronesian", "Moldovan",
  "Monégasque", "Mongolian", "Montenegrin", "Moroccan", "Mozambican", "Burmese", "Namibian", "Nauruan", "Nepali", "Dutch",
  "New Caledonian", "New Zealander", "Nicaraguan", "Nigerien", "Nigerian", "Macedonian", "Northern Cypriot", "Norwegian", "Omani", "Pakistani",
  "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Filipino", "Polish", "Portuguese", "Puerto Rican",
  "Qatari", "Congolese (Republic)", "Romanian", "Russian", "Rwandan", "Kittitian and Nevisian", "Saint Lucian", "Saint-Pierrais and Miquelonnais", "Vincentian", "Samoan",
  "San Marinese", "São Toméan", "Saudi", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Sint Maartener", "Slovak",
  "Slovene", "Solomon Islander", "Somali", "South African", "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swedish",
  "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Timorese", "Togolese", "Tongan", "Trinidadian and Tobagonian",
  "Tunisian", "Turkish", "Turkmen", "Tuvaluan", "Ugandan", "Ukrainian", "Emirati", "British", "American", "Uruguayan",
  "Uzbek", "Ni-Vanuatu", "Vatican", "Venezuelan", "Vietnamese", "Sahrawi", "Yemeni", "Zambian", "Zimbabwean"
];

const positions = [
    "Captain", "First Officer", "Second Officer", "Cabin Crew", "Private Pilot"
];

const sexes = ["Male", "Female"];
const relationshipStatuses = ["Single", "Married", "Unspecified"];

interface InputFieldProps extends TextInputProps {
  label: string;
  icon: string;
  disabled?: boolean;
}

interface DropdownFieldProps {
  label: string;
  value: string;
  icon: string;
  onPress: () => void;
}

const Register = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [base, setBase] = useState("");
  const [nationality, setNationality] = useState("");
  const [position, setPosition] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [hobbies, setHobbies] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"base" | "nationality" | "position" | "sex" | "relationship">("base");
  const [searchText, setSearchText] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();
  const { cameFromLogin, cameFromSettings, role  } = useLocalSearchParams();
  const isFromSettings = cameFromSettings === "true";
  const isFromLogin = cameFromLogin === "true";
  const insets = useSafeAreaInsets();

  console.log('Route params:', { isFromSettings, isFromLogin, role });

  useEffect(() => {
    if (role) {
      if (role === "Cabin Crew") {
        setPosition("Cabin Crew");
      } else if (role === "Pilot") {
        // Set to first pilot option (Captain)
        setPosition("Captain");
      }
    }
  }, [role]);

  useEffect(() => {
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      if (storedUser && (isFromSettings || isFromLogin)) {
        setUser(storedUser);
        updateFieldsForEdit(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

  useEffect(() => {
    let options: string[] = [];
    switch (modalType) {
      case "base":
        options = countries;
        break;
      case "nationality":
        options = nationalities;
        break;
      case "position":
        options = positions;
        break;
      case "sex":
        options = sexes;
        break;
      case "relationship":
        options = relationshipStatuses;
        break;
    }

    if (options && options.length > 0) {
      const filtered = options.filter((item) =>
        item.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]); // Fallback to empty array
    }
  }, [searchText, modalType]);

   useEffect(() => {
    let headerTitle = "Create Account";

    if (isFromLogin) {
      headerTitle = "Complete Your Profile";
    }
    else if (isFromSettings) {
      headerTitle = "Profile Management";
    }
    navigation.setOptions({
      headerTitle: headerTitle
    });
  }, [navigation, isFromSettings, isFromLogin]);

  const updateFieldsForEdit = (user: User) => {
    setName(user.name);
    setSurname(user.surName);
    setEmail(user.email);
    setBase(user.base || "");
    setNationality(user.nationality || "");
    if (!role) {
      setPosition(user.position || "");
    }
    setCompanyName(user.companyName || "");
    setAge(user.age?.toString() || "");
    setSex(user.sex || "");
    setRelationshipStatus(user.relationshipStatus || "");
    setHobbies(user.hobbies.join(", "));
  };

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleNext = async () => {
    console.log("Inside handleNext");
    console.log(name);
    console.log(surname); 
    console.log(email); 
    console.log(base); 
    console.log(nationality); 
    console.log(position);
    console.log(companyName); 
    console.log(age);
    console.log(sex); 
    console.log(relationshipStatus);
    console.log(hobbies);

    // Updated validation - only require name, surname, email, password (if new), position, company, and hobbies
    if (
      !name || !surname || !email || (!password && !isFromSettings && !isFromLogin) || !position ||
      !companyName || !hobbies
    ) {
      Alert.alert("Validation Error", "Name, surname, email, position, company name, and hobbies are required!");
      return;
    }

    if (!isEmailValid(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address!");
      return;
    }

    if (!isFromSettings && !isFromLogin && password.length < 8) {
      Alert.alert("Validation Error", "Password must be at least 8 characters long!");
      return;
    }

    // Age validation - only if provided
    if (age && age !== "0" && (isNaN(Number(age)) || Number(age) <= 0)) {
      Alert.alert("Validation Error", "Age must be a positive number.");
      return;
    }

    // Sex validation - only if provided
    if (sex) {
      let sanitizedSex = sex.trim().toLowerCase();
      if (sanitizedSex === "male" || sanitizedSex === "female") {
        sanitizedSex = sanitizedSex.charAt(0).toUpperCase() + sanitizedSex.slice(1);
        setSex(sanitizedSex);
      } else {
        Alert.alert("Validation Error", "Sex must be either 'Male' or 'Female'.");
        return;
      }
    }

    const sanitizedHobbies = hobbies.trim();
    if (sanitizedHobbies.length > 100) {
      Alert.alert("Validation Error", "Hobbies must be less than 100 characters.");
      return;
    }
    
    if (sanitizedHobbies.endsWith(",") || sanitizedHobbies.includes(",,")) {
      Alert.alert(
        "Validation Error",
        "Hobbies must be a comma-separated list without a trailing comma or consecutive commas."
      );
      return;
    }

    const userData = {
      name,
      surName: surname,
      email,
      password,
      base: base || "",
      nationality: nationality || "",
      position,
      companyName,
      age: age ? Number(age) : 0,
      sex: sex || "",
      relationshipStatus: relationshipStatus || "",
      hobbies: sanitizedHobbies.split(",").map((hobby) => hobby.trim())
    };

    const userDataWithoutPW = {
      name,
      surName: surname,
      email,
      base: base || "",
      nationality: nationality || "",
      position,
      companyName,
      age: age ? Number(age) : 0,
      sex: sex || "",
      relationshipStatus: relationshipStatus || "",
      hobbies: sanitizedHobbies.split(",").map((hobby) => hobby.trim())
    };

    try {
      setLoading(true);
      if ((isFromSettings || isFromLogin) && user && user.id) {
        const userRef = doc(db, "Users", user.id);

        await updateDoc(userRef, userDataWithoutPW);

        const storedUser = await UtilFunctions.getUser();
        if (storedUser) {
          storedUser.name = name;
          storedUser.surName = surname;
          storedUser.base = base || "";
          storedUser.nationality = nationality || "";
          storedUser.position = position;
          storedUser.companyName = companyName;
          storedUser.age = age ? Number(age) : 0;
          storedUser.sex = sex || "";
          storedUser.relationshipStatus = relationshipStatus || "";
          storedUser.hobbies = hobbies ? hobbies.split(",").map((hobby) => hobby.trim()) : [];
          UtilFunctions.saveUser(storedUser);
        }

        if (isFromSettings) {
          router.push({
            pathname: "./Register3",
            params: {
              user: JSON.stringify({ ...user, ...userData }),
              cameFromSettings: isFromSettings ? "true" : "false",
            },
          });
        }
        else if (isFromLogin) {
          router.push({
            pathname: "./Register2",
            params: {
              user: JSON.stringify({ ...user, ...userData }),
              cameFromLogin: isFromLogin ? "true" : "false",
            },
          });
        }
      } else {
        const newUser = createUser();
        Object.assign(newUser, userData);
        router.push({
          pathname: "./Register2",
          params: { user: JSON.stringify(newUser) },
        });
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openDropdown = (type: typeof modalType) => {
    setModalType(type);
    setSearchText("");
    setModalVisible(true);
  };

  const handleSelect = (value: string) => {
    switch (modalType) {
      case "base": setBase(value); break;
      case "nationality": setNationality(value); break;
      case "position": setPosition(value); break;
      case "sex": setSex(value); break;
      case "relationship": setRelationshipStatus(value); break;
    }
    setModalVisible(false);
  };

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <View style={{ height: 0.5, backgroundColor: "#ccc", width: "100%" }} />
      
      {!isFromSettings && (
        <>
          <ProgressHeader>
            <StepText>Step 2 of 4</StepText>
            <StepPercentage>50%</StepPercentage>
          </ProgressHeader>
          <ProgressBarContainer>
            <ProgressBarFill widthPercentage={50} />
          </ProgressBarContainer>
        </>
      )}

      {/* Use KeyboardAwareScrollView instead of regular ScrollView with KeyboardAvoidingView */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }} // Increased padding for button space
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraHeight={Platform.OS === 'ios' ? 20 : 0}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
      >
        <SectionTitle isFromSettings={isFromSettings}>Personal Information</SectionTitle>
        <Subtitle>Tell us about yourself</Subtitle>

        <InputRow>
          <HalfInput style={{ marginLeft: -10 }}>
            <Label style={{ marginLeft: 8 }}>Name *</Label>
            <InputField label="First name" value={name} onChangeText={setName} icon="user" />
          </HalfInput>
          <HalfInput style={{ marginRight: -10 }}>
            <Label style={{ marginLeft: 8 }}>Surname *</Label>
            <InputField label="Last name" value={surname} onChangeText={setSurname} icon="user" />
          </HalfInput>
        </InputRow>

        <Label>Email *</Label>
        <InputField 
          label="your.email@example.com" 
          value={email} 
          onChangeText={setEmail} 
          icon="envelope" 
          editable={!isFromSettings && !isFromLogin} 
          disabled={isFromSettings || isFromLogin} 
          style={isFromSettings || isFromLogin ? { backgroundColor: '#f5f5f5', color: '#999' } : {}} 
        />

        {(!isFromSettings && !isFromLogin) && (
          <>
            <Label>Password *</Label>
            <InputField label="Enter password" secureTextEntry value={password} onChangeText={setPassword} icon="lock" />
          </>
        )}

        <Label>Base (Country) <OptionalText>(Optional)</OptionalText></Label>
        <DropdownField label="Select your base country" value={base} icon="map-marker" onPress={() => openDropdown("base")} />

        <Label>Nationality <OptionalText>(Optional)</OptionalText></Label>
        <DropdownField label="Select your nationality" value={nationality} icon="map-marker" onPress={() => openDropdown("nationality")} />

        <Label>Position *</Label>
        <DropdownField label="Select Position" value={position} icon="briefcase" onPress={() => openDropdown("position")} />

        <Label>Company Name *</Label>
        <InputField label="Enter airline/company name" value={companyName} onChangeText={setCompanyName} icon="building" />
        
        <InputRow>
          <HalfInput style={{ marginLeft: -10 }}>
            <Label style={{ marginLeft: 8 }}>Age <OptionalText>(Optional)</OptionalText></Label>
            <InputField
              label="25"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              icon="calendar"
            />
          </HalfInput>

          <HalfInput style={{ marginRight: -10 }}>
            <Label style={{ marginLeft: 8 }}>Sex <OptionalText>(Optional)</OptionalText></Label>
            <DropdownField
              label="Select"
              value={sex}
              icon="venus-mars"
              onPress={() => openDropdown("sex")}
            />
          </HalfInput>
        </InputRow>

        <Label>Relationship Status <OptionalText>(Optional)</OptionalText></Label>
        <DropdownField label="Select Status" value={relationshipStatus} icon="heart" onPress={() => openDropdown("relationship")} />

        <Label>Hobbies (max 100 characters) *</Label>
        <InputField
          label="This will appear on your profile..."
          value={hobbies}
          onChangeText={setHobbies}
          icon="star"
          maxLength={100}
        />
        <CharacterLimit>{`${hobbies.length}/100 characters`}</CharacterLimit>
      </KeyboardAwareScrollView>

      {/* Fixed button with safe area */}
      <ButtonContainer style={{ paddingBottom: insets.bottom + 30 }}>
        <NextButton onPress={handleNext}>
          <NextButtonText>{(isFromSettings) ? "Step 1 of 2" : "Next"}</NextButtonText>
        </NextButton>
      </ButtonContainer>

      {/* Dropdown Modal */}
      <Modal transparent visible={modalVisible} animationType="slide">
        <ModalOverlay>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 0 }}
          >
            <ModalContentBottom>
              <ModalHeader>
                <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center", color: "#1c1c88" }}>
                  Select {modalType === "base" ? "Country" : modalType === "nationality" ? "Nationality" : modalType === "position" ? "Position" : modalType === "sex" ? "Sex" : "Relationship Status"}
                </Text>
                
                <TextInput
                  placeholder="Search..."
                  placeholderTextColor="#888"
                  value={searchText}
                  onChangeText={setSearchText}
                  style={{ 
                    padding: 12, 
                    borderWidth: 1, 
                    borderColor: "#ddd", 
                    borderRadius: 8,
                    backgroundColor: "#f9f9f9",
                    fontSize: 16
                  }}
                />
              </ModalHeader>
              
              <View style={{ maxHeight: 300, minHeight: 200 }}>
                <FlatList
                  data={filteredOptions || []}
                  renderItem={({ item }) => (
                    <CountryOption onPress={() => handleSelect(item)}>
                      <CountryText>{item}</CountryText>
                    </CountryOption>
                  )}
                  keyExtractor={(item) => item}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  style={{ flex: 1 }}
                  ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#999', fontSize: 16 }}>
                        {searchText ? 'No results found' : 'Loading...'}
                      </Text>
                    </View>
                  }
                />
              </View>
              
              <View style={{ paddingTop: 15, borderTopWidth: 1, borderTopColor: "#eee" }}>
                <CloseButton onPress={() => setModalVisible(false)}>
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Cancel</Text>
                </CloseButton>
              </View>
            </ModalContentBottom>
          </KeyboardAvoidingView>
        </ModalOverlay>
      </Modal>

    </Container>
  );
};

const InputField: React.FC<InputFieldProps> = ({ label, icon, disabled, ...props }) => (
  <InputContainer style={disabled ? { backgroundColor: '#f5f5f5' } : {}}>
    <StyledIcon name={icon} size={20} color="#999999" />
    <Input placeholder={label} placeholderTextColor="#999999" {...props} />
  </InputContainer>
);

const DropdownField: React.FC<DropdownFieldProps> = ({ label, value, icon, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <InputContainer>
      <StyledIcon name={icon} size={20} color="#999999" />
      <Input
        placeholder={label}
        placeholderTextColor="#999999"
        editable={false}
        value={value}
        pointerEvents="none"
      />
      <Icon name="caret-down" size={20} color="#999999" />
    </InputContainer>
  </TouchableOpacity>
);

export default Register;

// Updated styled components
const Container = styled.View`
  flex: 1;
  background-color: #FFFFFF;
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

const SectionTitle = styled.Text<{ isFromSettings?: boolean }>`
  font-size: 24px;
  font-weight: bold;
  color: #1c1c88;
  margin: ${({ isFromSettings }) => (isFromSettings ? "5px 20px 5px 20px" : "0px 20px 5px 20px")};
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #5c5c5c;
  margin: 0 20px 20px 20px;
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #1c1c88;
  margin: 8px 20px 4px 20px;
`;

const OptionalText = styled.Text`
  font-size: 12px;
  font-weight: 400;
  color: #999;
  font-style: italic;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  width: 90%;
  height: 50px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #eee;
  padding-horizontal: 12px;
  margin: 6px auto;
`;

const StyledIcon = styled(Icon)`
  margin-right: 10px;
`;

const Input = styled.TextInput`
  flex: 1;
  height: 100%;
  font-size: 16px;
  color: #000;
`;

const InputRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 90%;
  align-self: center;
`;

const HalfInput = styled.View`
  width: 48%;
`;

const CharacterLimit = styled.Text`
  font-size: 12px;
  color: #999;
  margin-left: 20px;
`;

// New styled component for button container
const ButtonContainer = styled.View`
  padding: 20px;
  padding-bottom: 30px;
  background-color: #fff;
  border-top-width: 1px;
  border-top-color: #eee;
`;

const NextButton = styled.TouchableOpacity`
  background-color: #1c1c88;
  padding: 14px;
  border-radius: 10px;
  align-items: center;
`;

const NextButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
`;

const CountryOption = styled.TouchableOpacity`
  padding: 16px 10px;
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const CountryText = styled.Text`
  font-size: 16px;
  color: #333;
`;

const CloseButton = styled.TouchableOpacity`
  padding: 15px;
  background-color: #DD3333;
  border-radius: 8px;
  align-items: center;
`;

const ModalContentBottom = styled.View`
  background-color: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  elevation: 10;
  shadow-color: #000;
  shadow-offset: 0px -3px;
  shadow-opacity: 0.3;
  shadow-radius: 5px;
`;

const ModalHeader = styled.View`
  margin-bottom: 15px;
`;
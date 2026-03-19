import {
  View,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  TouchableOpacity,
  Text,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView
} from "react-native";
import React, { useState, useEffect } from "react";
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { User } from "../../models/User";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../../../FirebaseConfig';

const licenseOptions = [
  "ICAO", "FAA", "EASA", "Transport Canada",
  "DGCA", "ANAC", "CASA", "JAA"
];
const licenseTypeOptions = [
  "Airline", "Commercial", "Private", "Cabin Crew"
];
const experienceOptions = [
  "Boeing Widebody", "Airbus Widebody",
  "Boeing Narrowbody", "Airbus Narrowbody",
  "Single Piston", "Multi Piston",
  "Single Turbine", "Multi Turbine",
  "Corporate Jets < 20 Tons", "Corporate Jets > 20 Tons", "Military Jets"
];

type SelectModalProps = {
  visible: boolean;
  options: string[];
  onSelect: (option: string) => void;
  onClose: () => void;
  selectedItems?: string[];
  maxSelections?: number;
  allowMultiple?: boolean;
};

const Register2 = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const userParam = typeof params.user === "string" ? JSON.parse(params.user) : {};
  const { cameFromLogin, cameFromSettings } = useLocalSearchParams();
  const isFromSettings = cameFromSettings === "true";
  const isFromLogin = cameFromLogin === "true";

  const [user, setUser] = useState<User>(userParam);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [licenseType, setLicenseType] = useState("");
  const [experiences, setExperiences] = useState<string[]>([]);
  const [flyingHoursPIC, setFlyingHoursPIC] = useState("");
  const [flyingHoursTotal, setFlyingHoursTotal] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showLicenseTypeModal, setShowLicenseTypeModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const stored = await UtilFunctions.getUser();
      if (stored && (isFromSettings || isFromLogin)) {
        setUser(stored);
        loadFields(stored);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    let headerTitle = "Create Account";

    if (isFromLogin) {
      headerTitle = "Complete Your Profile";
    }
    else if (isFromSettings) {
      headerTitle = "Experience Management";
    }
    navigation.setOptions({
      headerTitle: headerTitle
    });
  }, [navigation, isFromSettings, isFromLogin]);

  const loadFields = (u: User) => {
    setLicenses(u.licenses || []);
    setLicenseType(u.licenseType || "");
    setExperiences(u.experiences || []);
    setFlyingHoursPIC(u.flyingHoursPIC?.toString() || "");
    setFlyingHoursTotal(u.flyingHoursTotal?.toString() || "");
    setYearsOfExperience(u.yearsOfExperience?.toString() || "");
  };

  const validateAndContinue = async () => {
    if (licenses.length === 0) return Alert.alert("Pick at least one license.");
    if (licenses.length > 3) return Alert.alert("Max 3 licenses.");
    if (!licenseType) return Alert.alert("Pick a license type.");
    if (experiences.length === 0) return Alert.alert("Pick at least one experience.");
    if (experiences.length > 5) return Alert.alert("Max 5 experiences.");
    if (user.position !== "Cabin Crew") {
      if (!flyingHoursPIC || isNaN(Number(flyingHoursPIC))) return Alert.alert("Enter valid PIC hours.");
      if (!flyingHoursTotal || isNaN(Number(flyingHoursTotal))) return Alert.alert("Enter valid total hours.");
    } else {
      if (!yearsOfExperience || isNaN(Number(yearsOfExperience))) return Alert.alert("Enter valid years of experience.");
    } 

    setLoading(true);
    const data = {
      licenses,
      licenseType,
      experiences,
      ...(user.position !== "Cabin Crew"
        ? {
            flyingHoursPIC: Number(flyingHoursPIC),
            flyingHoursTotal: Number(flyingHoursTotal),
          }
        : {
            yearsOfExperience: Number(yearsOfExperience),
          }),
    };

    try {
      const updated = { ...user, ...data };
      if (isFromSettings && user && user.id) {
        await updateDoc(doc(db, "Users", user.id), data);
        Alert.alert("Saved experience information");
      } 
      else if (isFromLogin && user && user.id) {
        await updateDoc(doc(db, "Users", user.id), data);
        router.push({
          pathname: "./Register3",
          params: { user: JSON.stringify(updated), ...(isFromLogin && { cameFromLogin: "true" }) }
        });
      }
      else  {
        router.push({
          pathname: "./Register3",
          params: { user: JSON.stringify(updated), ...(isFromLogin && { cameFromLogin: "true" }) }
        });
      } 
      UtilFunctions.saveUser(updated);
      setUser(updated);
    } catch (e) {
      Alert.alert("Error saving data", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Updated handler for multi-select items (licenses and experiences)
  const handleMultiSelect = (option: string, setState: React.Dispatch<React.SetStateAction<string[]>>, max: number, current: string[]) => {
    if (current.includes(option)) {
      // Remove if already selected
      setState(current.filter(item => item !== option));
    } else {
      // Add if not selected and under max limit
      if (current.length >= max) {
        Alert.alert(`Maximum ${max} selections allowed`);
        return;
      }
      setState([...current, option]);
    }
  };

  const deleteTag = (option: string, setter: any) => setter((prev: string[]) => prev.filter(x => x !== option));

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <View style={{ height: 0.5, backgroundColor: "#ccc", width: "100%" }} />
      
      {!isFromSettings && (
        <>
          <ProgressHeader>
            <StepText>Step 3 of 4</StepText>
            <StepPercentage>75%</StepPercentage>
          </ProgressHeader>
          <ProgressBarContainer>
            <ProgressBarFill widthPercentage={75} />
          </ProgressBarContainer>
        </>
      )}

      {/* Use KeyboardAwareScrollView instead of regular ScrollView */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }} // Increased padding for button space
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraHeight={Platform.OS === 'ios' ? 20 : 0}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
      >
        <SectionTitle>Experience</SectionTitle>
        <Subtitle>Share your aviation qualifications and experience</Subtitle>

        {/* License */}
        <GroupLabel>License (Select up to 3)</GroupLabel>
        <TouchableOpacity onPress={() => setShowLicenseModal(true)}>
          <InputContainer>
            <StyledIconEmail name="id-card" size={20} color="#999999" />
            <Input pointerEvents="none" placeholder="Select License(s)" value={licenses.join(", ")} editable={false} placeholderTextColor="#999999" />
            <Icon name="caret-down" size={20} color="#999999" />
          </InputContainer>
        </TouchableOpacity>
        <TagsContainer>
          {licenses.map(l => (
            <Tag key={l}>
              <TagText>{l}</TagText>
              <TagDeleteButton onPress={() => deleteTag(l, setLicenses)}>
                <Icon name="times" size={14} color="#FFF" />
              </TagDeleteButton>
            </Tag>
          ))}
        </TagsContainer>

        {/* License Type */}
        <GroupLabel>License Type</GroupLabel>
        <TouchableOpacity onPress={() => setShowLicenseTypeModal(true)}>
          <InputContainer>
            <StyledIconEmail name="clipboard" size={20} color="#999999" />
            <Input pointerEvents="none" placeholder="Select License Type" value={licenseType} editable={false} placeholderTextColor="#999999" />
            <Icon name="caret-down" size={20} color="#999999" />
          </InputContainer>
        </TouchableOpacity>

        {/* Experience */}
        <GroupLabel>Experience (Select up to 5)</GroupLabel>
        <TouchableOpacity onPress={() => setShowExperienceModal(true)}>
          <InputContainer>
            <StyledIconEmail name="briefcase" size={20} color="#999999" />
            <Input pointerEvents="none" placeholder="Select Experience" value={experiences.join(", ")} editable={false} placeholderTextColor="#999999" />
            <Icon name="caret-down" size={20} color="#999999" />
          </InputContainer>
        </TouchableOpacity>
        <TagsContainer>
          {experiences.map(e => (
            <Tag key={e}>
              <TagText>{e}</TagText>
              <TagDeleteButton onPress={() => deleteTag(e, setExperiences)}>
                <Icon name="times" size={14} color="#FFF" />
              </TagDeleteButton>
            </Tag>
          ))}
        </TagsContainer>

        {/* Hours or Years */}
        {user.position !== "Cabin Crew" ? (
          <>
            <GroupLabel>Flying Hours PIC</GroupLabel>
            <InputContainer>
              <StyledIconEmail name="tachometer" size={20} color="#999999" />
              <Input placeholder="e.g., 500" keyboardType="number-pad" value={flyingHoursPIC} onChangeText={setFlyingHoursPIC} />
            </InputContainer>
            <GroupLabel>Flying Hours Total</GroupLabel>
            <InputContainer>
              <StyledIconEmail name="tachometer" size={20} color="#999999" />
              <Input placeholder="e.g., 1200" keyboardType="number-pad" value={flyingHoursTotal} onChangeText={setFlyingHoursTotal} />
            </InputContainer>
          </>
        ) : (
          <>
            <GroupLabel>Years of Experience</GroupLabel>
            <InputContainer>
              <StyledIconEmail name="history" size={20} color="#999999" />
              <Input placeholder="e.g., 5" keyboardType="number-pad" value={yearsOfExperience} onChangeText={setYearsOfExperience} />
            </InputContainer>
          </>
        )}
      </KeyboardAwareScrollView>

      {/* Fixed button with safe area */}
      <ButtonContainer style={{ paddingBottom: insets.bottom + 30 }}>
        <NextButton onPress={validateAndContinue}>
          <NextButtonText>{(isFromSettings) ? "Save" : "Next"}</NextButtonText>
        </NextButton>
      </ButtonContainer>

      {/* Modals */}
      <SelectModal
        visible={showLicenseModal}
        options={licenseOptions}
        selectedItems={licenses}
        maxSelections={3}
        allowMultiple={true}
        onSelect={o => handleMultiSelect(o, setLicenses, 3, licenses)}
        onClose={() => setShowLicenseModal(false)}
      />
      <SelectModal
        visible={showLicenseTypeModal}
        options={licenseTypeOptions}
        allowMultiple={false}
        onSelect={o => { setLicenseType(o); setShowLicenseTypeModal(false); }}
        onClose={() => setShowLicenseTypeModal(false)}
      />
      <SelectModal
        visible={showExperienceModal}
        options={experienceOptions}
        selectedItems={experiences}
        maxSelections={5}
        allowMultiple={true}
        onSelect={o => handleMultiSelect(o, setExperiences, 5, experiences)}
        onClose={() => setShowExperienceModal(false)}
      />
    </Container>
  );
};

// Enhanced Modal component with selection numbers
const SelectModal: React.FC<SelectModalProps> = ({ 
  visible, 
  options, 
  onSelect, 
  onClose, 
  selectedItems = [], 
  maxSelections = 1, 
  allowMultiple = false 
}) => {
  const [searchText, setSearchText] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

  useEffect(() => {
    if (options && options.length > 0) {
      const filtered = options.filter((item) =>
        item.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }
  }, [searchText, options]);

  useEffect(() => {
    if (visible) {
      setSearchText("");
      setFilteredOptions(options || []);
    }
  }, [visible, options]);

  const getModalTitle = () => {
    if (options === licenseOptions) return "Select License";
    if (options === licenseTypeOptions) return "Select License Type";
    if (options === experienceOptions) return "Select Experience";
    return "Select Option";
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <ModalOverlay>
        <TouchableWithoutFeedback onPress={() => onClose()}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 0 }}
        >
          <ModalContentBottom>
            <ModalHeader>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center", color: "#1c1c88" }}>
                {getModalTitle()}
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

              {allowMultiple && (
                <Text style={{ 
                  fontSize: 14, 
                  color: "#666", 
                  textAlign: "center", 
                  marginTop: 8 
                }}>
                  Selected: {selectedItems.length}/{maxSelections}
                </Text>
              )}
            </ModalHeader>
            
            <View style={{ maxHeight: 300, minHeight: 200 }}>
              <FlatList
                data={filteredOptions || []}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = selectedItems.includes(item);
                  const selectionIndex = selectedItems.indexOf(item);
                  
                  return (
                    <Option onPress={() => onSelect(item)} style={{
                      backgroundColor: isSelected ? '#f0f0ff' : '#fff'
                    }}>
                      <OptionText style={{
                        color: isSelected ? '#1c1c88' : '#333333',
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }}>
                        {item}
                      </OptionText>
                      {allowMultiple && isSelected && (
                        <SelectionBadge>
                          <SelectionNumber>{selectionIndex + 1}</SelectionNumber>
                        </SelectionBadge>
                      )}
                      {!allowMultiple && isSelected && (
                        <Icon name="check" size={16} color="#1c1c88" />
                      )}
                    </Option>
                  );
                }}
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
              <CloseButton onPress={() => onClose()}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
                  {allowMultiple ? 'Done' : 'Cancel'}
                </Text>
              </CloseButton>
            </View>
          </ModalContentBottom>
        </KeyboardAvoidingView>
      </ModalOverlay>
    </Modal>
  );
};

export default Register2;

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

const SectionTitle = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #1c1c88;
  margin: 0px 20px 5px 20px;
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #5c5c5c;
  margin: 0 20px 20px 20px;
`;

const GroupLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #1c1c88;
  margin: 8px 20px 4px 20px;
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

const StyledIconEmail = styled(Icon)`
  margin-right: 10px;
`;

const Input = styled.TextInput`
  flex: 1;
  height: 100%;
  font-size: 16px;
  color: #000000;
`;

const TagsContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  width: 85%;
  align-self: center;
  margin-top: 5px;
`;

const Tag = styled.View`
  background-color: #1c1c88;
  border-radius: 16px;
  padding: 6px 10px;
  margin: 4px;
  flex-direction: row;
  align-items: center;
`;

const TagText = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
`;

const TagDeleteButton = styled.TouchableOpacity`
  margin-left: 6px;
`;

// New styled component for button container (same as Register)
const ButtonContainer = styled.View`
  padding: 20px;
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
  background-color: rgba(0,0,0,0.5);
`;

const ModalContent = styled.View`
  background-color: #FFFFFF;
  padding: 20px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  max-height: 60%;
`;

const Option = styled.TouchableOpacity`
  padding: 16px 10px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const OptionText = styled.Text`
  font-size: 16px;
  color: #333333;
  flex: 1;
`;

const SelectionBadge = styled.View`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #1c1c88;
  justify-content: center;
  align-items: center;
  margin-left: 10px;
`;


const SelectionNumber = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
`;

const CloseButton = styled.TouchableOpacity`
  padding: 14px 10px;
  background-color: #DD3333;
  border-radius: 8px;
  align-items: center;
  margin-top: 10px;
`;

const CloseText = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
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



import React, { useEffect, useState, useRef } from "react";
import { FlatList, Dimensions, Text, View, Alert, Linking, TouchableOpacity, Modal, TouchableWithoutFeedback, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import styled from "styled-components/native";
import { Ionicons } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/FontAwesome5';
import * as Location from 'expo-location';
import { User } from "../../models/User";
import eventEmitter from "../../utilities/eventEmitter";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import FastImage from "react-native-fast-image";
import { baseCoordinates } from "@/app/utilities/baseCoordinates";
import haversine from "haversine-distance";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import usePushNotifications from "../../../hooks/usePushNotifications";
import { collection, doc, getDocs, updateDoc, arrayUnion, arrayRemove, getDoc, query, where } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";

const SCREEN_WIDTH = Dimensions.get("window").width;

const CrewFind = () => {
  usePushNotifications(); 
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [crew, setCrew] = useState<User[]>([]);
  const [originalCrew, setOriginalCrew] = useState<User[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<User | null>(null);
  const [chatIds, setChatIds] = useState<{ [key: string]: string | null }>({});
  const [user, setUser] = useState<User | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
//  const [isFriend, setIsFriend] = useState(false);
//  const [isBlocked, setIsBlocked] = useState(false);
  const [crewModalVisible, setCrewModalVisible] = useState(false);
 // const [selectedOption, setSelectedOption] = useState("All");
  const [selectedPosition, setSelectedPosition] = useState<"All" | "Pilot" | "Cabin Crew">("All");
  const [selectedFriendsOnly, setSelectedFriendsOnly] = useState<"All" | "Friends Only">("All");
  const [selectedSex, setSelectedSex] = useState<"All" | "Male" | "Female">("All");
  const [selectedRelationshipStatus, setSelectedRelationshipStatus] = useState<"All" | "Single" | "Married" | "Unspecified">("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const menuButtonRef = useRef<View>(null); // ✅ Explicitly type the ref
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const router = useRouter();

    // Helper function to validate coordinates
  const isValidCoordinates = (
    coords: { latitude?: number; longitude?: number } | null | undefined
  ): coords is { latitude: number; longitude: number } => {
    if (!coords) return false; 
    return (
      coords !== null &&
      typeof coords.latitude === 'number' &&
      typeof coords.longitude === 'number' &&
      coords.latitude >= -90 &&
      coords.latitude <= 90 &&
      coords.longitude >= -180 &&
      coords.longitude <= 180
    );
  };

  // Helper function to check if crew member is within 150km
  const isWithin150km = (userLoc: any, crewLoc: any) => {
    if (!isValidCoordinates(userLoc) || !isValidCoordinates(crewLoc)) {
      return false;
    }

    const distance = haversine(userLoc, crewLoc); // distance in meters
    return distance <= 150000 || (crewLoc.latitude === 0 && crewLoc.longitude === 0);
  };

  // Function to get location coordinates from base name
  const getLocationFromBase = (baseName: string) => {
    return baseCoordinates[baseName] || null;
  };

  useEffect(() => {
    console.log("Inside Home's useEffect");
    fetchUserFromStorage();
  }, []);
  
  useEffect(() => {
    fetchUserLocationAndCrew();
  }, [user]);

  useEffect(() => {
    const handleFriendsChanged = () => {
      console.log("friendsChanged event received");
      fetchUserFromStorage();
      fetchUserLocationAndCrew();
    };
    eventEmitter.on("friendsChanged", handleFriendsChanged);
  
    return () => {
      eventEmitter.off("friendsChanged", handleFriendsChanged);
    };
  }, []);

  useEffect(() => {
    const handleBlockedChanged = () => {
      console.log("blockedChanged event received");
      fetchUserFromStorage();
      fetchUserLocationAndCrew();
    };
    eventEmitter.on("blockedChanged", handleBlockedChanged);
  
    return () => {
      eventEmitter.off("blockedChanged", handleBlockedChanged);
    };
  }, []);

  useEffect(() => {
    const listener = () => {
      console.log("Filter event received in Home!");
      setCrewModalVisible(true);
    };
    eventEmitter.on("openFilter:CrewFind", listener);
  
    return () => {
      eventEmitter.off("openFilter:CrewFind", listener);
    };
  }, []);

  useEffect(() => {
  if (search.trim() === "") {
    setCrew(originalCrew); // Reset if no search term
    return;
  }

  const searchTerm = search.toLowerCase();

  const filtered = originalCrew.filter((item) => {
    const fullName = `${item.name} ${item.surName}`.toLowerCase();
    const position = item.position?.toLowerCase() ?? "";
    const company = item.companyName?.toLowerCase() ?? "";
    const base = item.base?.toLowerCase() ?? "";

    return (
      fullName.includes(searchTerm) ||
      position.includes(searchTerm) ||
      company.includes(searchTerm) ||
      base.includes(searchTerm)
    );
  });

  setCrew(filtered);
  }, [search, originalCrew]);

  const fetchUserFromStorage = async () => {
    const storedUser = await UtilFunctions.getUser();
    console.log("Stored User: ", storedUser);
    if (storedUser) {
      setUser(storedUser);
    }
  };

 const fetchUserLocationAndCrew = async () => {
    console.log("Inside fetchUserLocationAndCrew");
    if (!user) return;
    
    try {
      setRefreshing(true);
      setLoading(true);

      // Get user's location permission and coordinates
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      if (existingStatus !== "granted") {
        // Show a helpful explanation
        const userAgreed = await new Promise((resolve) => {
          Alert.alert(
            "Location Access Needed",
            "We need your location to show nearby crew members. Allow location access?",
            [
              { text: "Not Now", style: "cancel", onPress: () => resolve(false) },
              { text: "Allow", onPress: () => resolve(true) },
            ]
          );
        });
    
        if (!userAgreed) {
          setRefreshing(false);
          setLoading(false);
          return;
        }
    
        const { status } = await Location.requestForegroundPermissionsAsync();
    
        if (status !== "granted") {
          Alert.alert(
            "Enable Location in Settings",
            "To show nearby crew members, please allow location access from Settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
          setRefreshing(false);
          setLoading(false);
          return;
        }
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userLoc);
      console.log("User's location:", userLoc);

      UtilFunctions.updateUserCoordinates(userLoc.latitude, userLoc.longitude);

      // Fetch crew members
      console.log("Fetching crew");
      const chatIdsStore: { [key: string]: string | null } = {};
      const crewSnapshot = await getDocs(collection(db, "Users"));
      const filteredCrewDocs = crewSnapshot.docs.filter((crewDoc) => crewDoc.id !== user.id);
      
      const crewData: (User | null)[] = await Promise.all(
        filteredCrewDocs.map(async (crewDoc) => {
          const crewData = crewDoc.data();
          console.log("Fetched Crew: ", crewData);

          // Get crew member's location from their base
          const crewLocation = crewData.userCoordinates
          ? {
              latitude: crewData.userCoordinates.latitude,
              longitude: crewData.userCoordinates.longitude,
            }
          : null;

          console.log("Crew's location:", crewLocation);
          
          // Filter out crew members not within 150km
          if (userLoc && crewLocation && !isWithin150km(userLoc, crewLocation)) {
            console.log(`Crew member ${crewData.name} is not within 150km, excluding`);
            return null;
          }

          // Helper function to check if URL is external (Google, etc.) or Firebase Storage
         
          let profileImageUrl = "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png";
          if (crewData.profileImage) {
            if (UtilFunctions.isExternalUrl(crewData.profileImage)) {
              profileImageUrl = crewData.profileImage;
            } else {
              try {
                profileImageUrl = await UtilFunctions.fetchLogoUrl(crewData.profileImage);
              } catch (error) {
                console.error("Error fetching profile image from Firebase Storage:", error);
              }
            }
          }

          let backgroundImageUrl = "https://dummyimage.com/300/fff/fff";
          if (crewData.backgroundImage) {
            if (UtilFunctions.isExternalUrl(crewData.backgroundImage)) {
              backgroundImageUrl = crewData.backgroundImage;
            } else {
              try {
                backgroundImageUrl = await UtilFunctions.fetchLogoUrl(crewData.backgroundImage);
              } catch (error) {
                console.error("Error fetching background image from Firebase Storage:", error);
              }
            }
          }

          const crewId = crewDoc.id;

          if (user) {
            const chatQuery = query(
              collection(db, "Chats"),
              where("participants", "array-contains", user.id)
            );

            const chatSnapshot = await getDocs(chatQuery);
            chatIdsStore[crewId] = null;
  
            for (const chatDoc of chatSnapshot.docs) {
              const chatData = chatDoc.data();
              if (Array.isArray(chatData.participants) && chatData.participants.includes(crewId)) {
                chatIdsStore[crewId] = chatDoc.id;
                console.log("chatIdsStore: ", chatIdsStore);
                break;
              }
            }
            setChatIds(chatIdsStore);
          }
          
          return {
            id: crewDoc.id,
            name: crewData.name,
            surName: crewData.surName,
            email: crewData.email,
            password: "",
            isVerified: crewData.isVerified || "false",
            base: crewData.base,
            nationality: crewData.nationality,
            position: crewData.position,
            companyName: crewData.companyName,
            age: crewData.age,
            sex: crewData.sex,
            relationshipStatus: crewData.relationshipStatus,
            hobbies: crewData.hobbies,
            profileImage: profileImageUrl,
            backgroundImage: backgroundImageUrl,
            licenses: crewData.licenses,
            licenseType: crewData.licenseType,
            experiences: crewData.experiences,
            flyingHoursPIC: crewData.flyingHoursPIC,
            flyingHoursTotal: crewData.flyingHoursTotal,
            yearsOfExperience: crewData.yearsOfExperience,
            friends: crewData.friends,
            blocked: crewData.blocked,
            userCoordinates: crewData.userCoordinates,
            lastSeen: crewData.lastSeen ? crewData.lastSeen.toDate?.() ?? new Date(crewData.lastSeen) : null,
            createdAt: new Date(crewData.createdAt),
            updatedAt: new Date(crewData.updatedAt),
          };
        })
      );

      // Filter out null values (crew members not within 150km)
      const validCrewData = crewData.filter(Boolean) as User[];

      // Filter out users who were last seen more than 12 hours ago
      const filteredCrewData = validCrewData.filter((crewMember) => {
        if (!crewMember.lastSeen) return false;
        
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - crewMember.lastSeen.getTime()) / 60000);
        
        return diffInMinutes <= 720;
      });

      setCrew(filteredCrewData);
      setOriginalCrew(filteredCrewData);
      console.log("Chat Ids: ", chatIds);
    } catch (error) {
      console.error("Error fetching crew or location:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
      UtilFunctions.updateLastSeen();
    }
  };

  const toggleFriend = async (user: User, crewMemberId: string) => {
    console.log("Got inside toggleFriend");
    try {
      setLoading(true);
      const userRef = doc(db, "Users", user.id ?? "");
      console.log("Before getDoc");
      const userSnap = await getDoc(userRef);
      console.log("After getDoc");
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let friendsList = userData.friends || []; // Ensure friends exist
  
        if (friendsList.includes(crewMemberId)) {
          // Remove friend
          friendsList = friendsList.filter((id: string) => id !== crewMemberId);
          console.log("Before updateDoc");
          await updateDoc(userRef, {
            friends: arrayRemove(crewMemberId),
          });
          console.log("After updateDoc");
         // setIsFriend(false);
        } else {
          // Add friend
          friendsList.push(crewMemberId);
          console.log("Before updateDoc");
          await updateDoc(userRef, {
            friends: arrayUnion(crewMemberId),
          });
          console.log("After updateDoc");
         // setIsFriend(true);
        }
        const updatedUser = { ...user, friends: friendsList };
        setUser(updatedUser); 
        await UtilFunctions.saveUser(updatedUser);
        console.log("After friends update (CrewFind): ", updatedUser.friends);
        eventEmitter.emit("friendsChanged", { updatedFriends: friendsList });
      }
    } catch (error) {
      console.error("Error updating friends list:", error);
    }
    finally {
      setLoading(false);
    } 
  };

  const blockUser = async (user: User, crewMemberId: string) => {
    console.log("Got inside blockUser");
    try {
      setLoading(true);
      const userRef = doc(db, "Users", user.id ?? "");
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let blockedList = userData.blocked || []; // Ensure blocked list exists
        let friendsList = userData.friends || []; // Ensure friends list exists
  
        if (blockedList.includes(crewMemberId)) {
          // Unblock user
          blockedList = blockedList.filter((id: string) => id !== crewMemberId);
          await updateDoc(userRef, {
            blocked: arrayRemove(crewMemberId),
          });
         // setIsBlocked(false);
        } else {
          // Block user
          blockedList.push(crewMemberId);
          await updateDoc(userRef, {
            blocked: arrayUnion(crewMemberId),
          });
         // setIsBlocked(true);
  
          // Remove from friends list if they were friends
          if (friendsList.includes(crewMemberId)) {
            friendsList = friendsList.filter((id: string) => id !== crewMemberId);
            await updateDoc(userRef, {
              friends: arrayRemove(crewMemberId),
            });
          }
        }
        // Update local state and storage
        const updatedUser = { 
          ...user, 
          blocked: blockedList,
          friends: friendsList,  // 🔥 Ensure local friends list is updated
        };
  
        setUser(updatedUser);
        UtilFunctions.saveUser(updatedUser);
        eventEmitter.emit("blockedChanged", { updatedBlocked: blockedList });
      }
    } catch (error) {
      console.error("Error updating blocked list:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = (recipientId: string, chatId: string, otherParticipant: User) => {   
    console.log("Profile Image before sending to chat: ", otherParticipant.profileImage); 
    closeModal();
    const fullName = `${otherParticipant.name ?? ""} ${otherParticipant.surName ?? ""}`.trim();
    router.push({
      pathname: "../../screens/MessageDetail",
      params: { recipientId, chatId, otherParticipantName: fullName, otherParticipantImage: encodeURIComponent(otherParticipant.profileImage ?? "") }
    });
  };
    
  const closeModal = () => {
    setModalVisible(false);
  };

  const openMenu = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({ top: pageY + height, left: pageX });
        console.log("Menu is visible now at", pageX, pageY);
        setMenuVisible(true);
      });
    } else {
      console.log("Got in else - menuButtonRef is null");
    }
  };

  const closeMenu = () => setMenuVisible(false);

  type CrewFilter = {
    position: string | string[] | null;
    friendsOnly: boolean;
    sex: string | null;
    relationshipStatus: string | null;
  };  

  const [filters, setFilters] = useState<{
    position: "All" | "Captain" | "First Officer" | "Second Officer" |  "Private Pilot" | "Pilot" | "Cabin Crew" | string[] | null;
    friendsOnly: boolean;
    sex: "All" | "Male" | "Female" | null;
    relationshipStatus: "All" | "Single" | "Married" | "Unspecified" | null;
  }>({
    position: null,
    friendsOnly: false,
    sex: null,
    relationshipStatus: null,
  });
  
  //const [selectedFilterOption, setSelectedOption] = useState("All");
  
  const resetFilters = () => {
    setFilters({
      position: null,
      friendsOnly: false,
      sex: null,
      relationshipStatus: null,
    });
    setSelectedPosition("All");
    setSelectedFriendsOnly("All");
    setSelectedSex("All");
    setSelectedRelationshipStatus("All");
    setCrew(originalCrew);
  };

  const applyCrewFilter = (filters: CrewFilter) => {
    console.log("Applying crew filters:", filters);
  
    let filtered = [...originalCrew];
  
    if (filters.position && filters.position !== "All") {
      console.log("Applying position filter");
      if (Array.isArray(filters.position)) {
        const positionArray = filters.position; 
        filtered = filtered.filter((crew) => 
          positionArray.includes(crew.position)
        );
      }
      else {
        filtered = filtered.filter((crew) => crew.position === filters.position);
      }
    }
  
    if (filters.friendsOnly) {
      filtered = filtered.filter((crew) => user?.friends.includes(crew.id ?? ""));
    }
  
    if (filters.sex && filters.sex !== "All") {
      filtered = filtered.filter((crew) => crew.sex === filters.sex);
    }

    if (filters.relationshipStatus && filters.relationshipStatus !== "All") {
      filtered = filtered.filter((crew) => crew.relationshipStatus === filters.relationshipStatus);
    }

    setCrew(filtered);
  };

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: User }) => {
    const isExpanded = expandedId === item.id;
    const isFriend = user?.friends?.includes(item.id ?? "") ?? false;
    const isBlocked = user?.blocked?.includes(item.id ?? "") ?? false;

    const userCoords = userLocation ?? { latitude: 0, longitude: 0 };
   // const userCoords = user?.base ? baseCoordinates[user.base] : undefined;
    const itemCoords = item.userCoordinates ?? { latitude: 0, longitude: 0 };
   // const itemCoords = baseCoordinates[item.base];

    let distanceText = "";

    if (userCoords && itemCoords) {
      const distanceMeters = haversine(userCoords, itemCoords);
      const distanceKm = Math.round(distanceMeters / 1000);
      distanceText = `${distanceKm} km away`;
    }

    return (
      <TouchableOpacity onPress={() => handleExpand(item.id ?? "")}>
        {/* Wrapper container that handles the overall styling */}
        <View style={{
          backgroundColor: '#fff', // Or whatever your card background color is
          borderRadius: isExpanded ? 0 : 12, // Remove border radius when expanded
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          marginVertical: 8,
        }}>
          {/* Main compact view - always visible */}
          <CompactCard>
            <ProfileImageWrapper>
              <ProfileImage
                source={
                  item.profileImage
                    ? {
                        uri: item.profileImage,
                        priority: FastImage.priority.high,
                        cache: FastImage.cacheControl.immutable,
                      }
                    : {
                        uri: "https://www.pngfind.com/pngs/m/610-6104451_image-placeholder-png-user-profile-placeholder-image-png.png", // fallback placeholder
                        priority: FastImage.priority.low,
                      }
                }
                resizeMode={FastImage.resizeMode.cover}
              />
              {UtilFunctions.getLastSeenText(item.lastSeen) === "NOW" && <OnlineDot />}
            </ProfileImageWrapper>
            
            <InfoContainer>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <NameText>
                  {item.name} {item.surName}
                </NameText>
                {(item.isVerified === "true") && <VerifiedBadge />}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Icon
                  name={UtilFunctions.getPositionIcon(item.position)}
                  size={14}
                  color="#777"
                  style={{ marginRight: 5 }}
                />
                <PositionText>{item.position}</PositionText> 
                <SeparatorText> • </SeparatorText> 
                <SubText>{item.age}</SubText>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 0 }}>
                <SubText>{item.companyName}</SubText>
                <Icon
                  name="map-marker-alt"
                  size={14}
                  color="#777"
                  style={{ marginHorizontal: 5 }}
                />
                <SubText>{item.base}</SubText>
              </View>
              <View style={{ marginTop: 5, flexDirection: "row", alignItems: "center" }}>
                {distanceText && (
                <SubText style={{ fontSize: 12, marginRight: 5 }}>
                  {distanceText}
                </SubText>
                )}
                <Icon
                  name="clock"
                  size={12}
                  color="#777"
                  style={{ marginRight: 2 }}
                />
                <SubText style={{ fontSize: 12 }}>
                  Last Seen: {UtilFunctions.getLastSeenText(item.lastSeen)}
                </SubText>
              </View>
            </InfoContainer>
            
            {/* Expand/Collapse arrow */}
            <Icon 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#1c1c88" 
            />
          </CompactCard>

          {/* Expanded content - only shows when expanded */}
          {isExpanded && (
            <ExpandedContent>
              {/* Separator line with proper spacing */}
              <View style={{
                height: 1,
                backgroundColor: "#e0e0e0",
                marginHorizontal: 4, 
                marginTop: -25,
                marginBottom: 15
              }} />
              
              {/* Background image section */}
              <BackgroundImageSection>
                <BackgroundImage
                  source={{
                    uri: item.backgroundImage,
                    priority: FastImage.priority.high,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </BackgroundImageSection>

              {/* Detail Section */}
              <DetailSection>
                <DetailRow>
                  <DetailIcon name="building" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Airline</DetailLabel>
                    <DetailValue>{item.companyName}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>

                <DetailRow>
                  <DetailIcon name="flag" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Nationality</DetailLabel>
                    <DetailValue>{item.nationality}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>

                <DetailRow>
                  <DetailIcon name="heart" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Relationship Status</DetailLabel>
                    <DetailValue>{item.relationshipStatus}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>

                <DetailRow>
                  <DetailIcon name="user" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Sex</DetailLabel>
                    <DetailValue>{item.sex}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>

                <DetailRow>
                  <DetailIcon name="calendar" size={18} color="#1c1c88" />
                  <DetailTextContainer>
                    <DetailLabel>Age</DetailLabel>
                    <DetailValue>{item.age}</DetailValue>
                  </DetailTextContainer>
                </DetailRow>
              </DetailSection>

              {/* Hobbies Section */}
              <HobbySection>
                <HobbyTitle>Interests & Hobbies</HobbyTitle>
                <HobbyList>
                  {item.hobbies?.map((hobby, index) => (
                    <HobbyChip key={index}>{hobby}</HobbyChip>
                  ))}
                </HobbyList>
              </HobbySection>

              {/* Action Buttons */}
              {user && (
                <ActionRow>
                  <ActionButton onPress={() => navigateToChat(item.id ?? "", chatIds[item.id ?? ""] ?? "", item)} disabled={isBlocked}>
                    <Icon name="comment" size={16} color="#fff" />
                    <ActionText>Message</ActionText>
                  </ActionButton>
                  <ActionButton outline onPress={() => toggleFriend(user, item.id ?? "")} disabled={isBlocked}>
                    <Icon name={isFriend ? "user-times" : "user-plus"} size={16} color="#1c1c88" />
                    <ActionTextOutline>{isFriend ? "Remove Friend" : "Add Friend"}</ActionTextOutline>
                  </ActionButton>
                  <ActionButton outline onPress={() => blockUser(user, item.id ?? "")}>
                    <Icon name={isBlocked ? "user" : "user-times"} size={16} color="#1c1c88" />
                    <ActionTextOutline>{isBlocked ? "Unblock" : "Block"}</ActionTextOutline>
                  </ActionButton>
                </ActionRow>
              )}
            </ExpandedContent>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Container>
      {loading && <LoadingIndicator />}
      <View style={{ backgroundColor: "#fff", padding: 15, borderRadius: 15, marginBottom: 15 }}>
        <SearchBarContainer>
          <Icon name="search" size={18} color="#999" style={{ marginRight: 10 }} />
          <SearchInput
            placeholder="Search for crew..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </SearchBarContainer>

        <InfoBox>
          <InfoText>Only crew members within 150km of your location will appear here</InfoText>
        </InfoBox>
      </View>

      <FlatList
        data={crew}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id ?? index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchUserLocationAndCrew}
        ListEmptyComponent={() => (
        <EmptyWrapper>
          <EmptyContainer>
            <EmptyIconContainer>
              <Icon name="users" size={80} color="#ccc" />
            </EmptyIconContainer>
            <EmptyTitle>No crew members found</EmptyTitle>
            <EmptyMessage>
              {search.trim() 
                ? "No crew members match your search criteria" 
                : "No crew members are currently active within the last 12 hours"
              }
            </EmptyMessage>
          </EmptyContainer>
        </EmptyWrapper>
      )}
      />
      {/* Menu moved outside of the Modal */}
      <Modal visible={crewModalVisible} transparent animationType="slide" onRequestClose={() => setCrewModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setCrewModalVisible(false)}>
          <ModalFilterOverlay>
            <TouchableWithoutFeedback>
              <ModalBox>        
                {/* Header */}
                <HeaderRow>
                  <IconWrapper>
                    <Icon name="filter" size={16} color="#fff" />
                  </IconWrapper>
                  <HeadingFilterModalText>Filter Crew</HeadingFilterModalText>
                </HeaderRow>

                {/* Position */}
                <SectionContainer>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon name="users" size={16} color="#1c1c88" />
                    <SectionTitle>Position</SectionTitle>
                  </View>
                  <OptionsRow>
                    {["All", "Pilot", "Cabin Crew"].map((option) => (
                      <OptionButton
                        key={option}
                        selected={selectedPosition === option}
                        onPress={() => {
                          const pilotTypes = ["Captain", "First Officer", "Second Officer", "Private Pilot"] as const;

                          let newFilters;
                          if (option === "Pilot") {
                            // When Pilot is selected, include all pilot types
                            newFilters = { ...filters, position: [...pilotTypes] };
                          } else if (option === "All") {
                            // When All is selected, don't filter by position
                            newFilters = { ...filters, position: null };
                          } else {
                            // For Cabin Crew or other specific positions
                            newFilters = { ...filters, position: option as "Cabin Crew" };
                          }

                         // const newFilters = { ...filters, position: option as "Pilot" | "Cabin Crew" };
                          setFilters(newFilters);
                          setSelectedPosition(option as any);
                         // applyCrewFilter(newFilters);
                        }}
                      >
                        <OptionFilterModalText selected={selectedPosition === option}>{option}</OptionFilterModalText>
                      </OptionButton>
                    ))}
                  </OptionsRow>
                </SectionContainer>

                {/* Friends Only */}
                <SectionContainer>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon name="user-plus" size={16} color="#1c1c88" />
                    <SectionTitle>Show Friends Only</SectionTitle>
                  </View>
                  <OptionsRow>
                    {["All", "Friends Only"].map((option) => (
                      <OptionButton
                        key={option}
                        selected={selectedFriendsOnly === option}
                        onPress={() => {
                          let newFilters;
                          if (option === "Friends Only") {
                            newFilters = { ...filters, friendsOnly: true };
                          } else { // option === "All"
                            newFilters = { ...filters, friendsOnly: false };
                          }
                          setFilters(newFilters);
                          setSelectedFriendsOnly(option as any);
                         // applyCrewFilter(newFilters);
                        }}
                      >
                        <OptionFilterModalText selected={selectedFriendsOnly === option}>{option}</OptionFilterModalText>
                      </OptionButton>
                    ))}
                  </OptionsRow>
                </SectionContainer>

                {/* Sex */}
                <SectionContainer>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon name="user" size={16} color="#1c1c88" />
                    <SectionTitle>Sex</SectionTitle>
                  </View>
                  <OptionsRow>
                    {["All", "Male", "Female"].map((option) => (
                      <OptionButton
                        key={option}
                        selected={selectedSex === option}
                        onPress={() => {
                          const newFilters = { ...filters, sex: option as "Male" | "Female" };
                          setFilters(newFilters);
                          setSelectedSex(option as any);
                         // applyCrewFilter(newFilters);
                        }}
                      >
                        <OptionFilterModalText selected={selectedSex === option}>{option}</OptionFilterModalText>
                      </OptionButton>
                    ))}
                  </OptionsRow>
                </SectionContainer>

                {/* Relationship Status */}
                <SectionContainer>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon name="heart" size={16} color="#1c1c88" />
                    <SectionTitle>Relationship Status</SectionTitle>
                  </View>
                  <OptionsRow>
                    {["All", "Single", "Married", "Unspecified"].map((option) => (
                      <OptionButton
                        key={option}
                        selected={selectedRelationshipStatus === option}
                        onPress={() => {
                          const newFilters = { ...filters, relationshipStatus: option as "Single" | "Married" | "Unspecified" };
                          setFilters(newFilters);
                          setSelectedRelationshipStatus(option as any);
                         // applyCrewFilter(newFilters);
                        }}
                      >
                        <OptionFilterModalText selected={selectedRelationshipStatus === option}>{option}</OptionFilterModalText>
                      </OptionButton>
                    ))}
                  </OptionsRow>
                </SectionContainer>

                {/* Footer Buttons */}
                <FooterButtons>
                  <ResetButton onPress={() => {
                    const reset = {
                      position: null,
                      friendsOnly: false,
                      sex: null,
                      relationshipStatus: null,
                    };
                    resetFilters();
                    applyCrewFilter(reset);
                   // setCrewModalVisible(false);
                  }}>
                    <ResetButtonText>Reset</ResetButtonText>
                  </ResetButton>
                  <ApplyButton onPress={() => {
                    applyCrewFilter(filters);
                    setCrewModalVisible(false);
                  }}>
                    <ApplyButtonText>Apply Filters</ApplyButtonText>
                  </ApplyButton>
                </FooterButtons>
              </ModalBox>
            </TouchableWithoutFeedback>
          </ModalFilterOverlay>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
};

export default CrewFind;

const Container = styled.View`
  flex: 1;
  background-color: #F2F3F5;
  padding: 20px;
`;

const SearchBarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #F2F3F5;
  border-radius: 10px;
  padding: 10px 15px;
  margin-bottom: 10px;
`;

const SearchInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
`;

const InfoBox = styled.View`
  background-color: #fff;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ccc;
  margin-bottom: 15px;
`;

const InfoText = styled.Text`
  font-size: 14px;
  color: #555;
  text-align: center;
`;

const CompactCard = styled.View`
  background-color: #fff;
  flex-direction: row;
  align-items: center;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 10px;
  elevation: 2;
`;

const ProfileImageWrapper = styled.View`
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 12px;
`;

const ProfileImage = styled(FastImage)`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background-color: #1c1c88;
  border-width: 1px;
  border-color: #1c1c88;
  margin-right: 12px;
  margin-top: -15px;
`;

const VerifiedBadge = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: require("../../../assets/images/verified-badge.png"),
})`
  width: 20px;
  height: 20px;
  margin-left: 2px;
`;

const OnlineDot = styled.View`
  position: absolute;
  bottom: 8;
  right: -5;
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #4cd137; /* bright green */
  border: 2px solid white;
`;

const InfoContainer = styled.View`
  flex: 1;
`;

const NameText = styled.Text`
  font-weight: bold;
  font-size: 16px;
  color: #000;
`;

const PositionText = styled.Text`
  color: #1c1c88;
  font-weight: 500;
`;

const SeparatorText = styled.Text`
  color: #777;
  font-size: 13px;
`;

const SubText = styled.Text`
  font-size: 14px;
  color: #555;
`;

const ExpandedContent = styled.View`
  margin-top: 0;
  background-color: #ffffff;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px; 
  padding: 18px;
`;

const BackgroundImageSection = styled.View`
  background-color: #1c1c88;
  height: 125px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
`;

const BackgroundImage = styled(FastImage)`
  width: 100%;
  height: 100%;
  resize-mode: cover;
`;

const Placeholder = styled.Image`
  width: 50px;
  height: 50px;
`;

const DetailSection = styled.View`
  margin-top: 15px;
`;

const DetailRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 18px;
`;

const DetailTextContainer = styled.View`
  flex-direction: column;
`;

const DetailLabel = styled.Text`
  font-weight: 600;
  font-size: 15px;
  color: #000;
`;

const DetailValue = styled.Text`
  font-size: 14px;
  color: #777;
`;

const DetailIcon = styled(Icon)`
  margin-right: 14px;
  margin-top: 2px;
  width: 22px;
`;

const HobbySection = styled.View`
  margin-bottom: 12px;
`;

const HobbyTitle = styled.Text`
  font-weight: bold;
  margin-bottom: 5px;
`;

const HobbyList = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
`;

const HobbyChip = styled.Text`
  background-color: #E1E4F0;
  color: #3E4784;
  padding: 6px 10px;
  border-radius: 15px;
  margin-right: 6px;
  margin-bottom: 6px;
  font-size: 12px;
`;

const ActionRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 10px;
`;

const ActionButton = styled.TouchableOpacity<{ outline?: boolean; disabled?: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  background-color: ${({ outline, disabled }) => {
    if (disabled) return '#ccc'; // grey background when disabled
    return outline ? '#fff' : '#1c1c88';
  }};
  border: ${({ outline }) => (outline ? '1px solid #1c1c88' : 'none')};
`;

const ActionText = styled.Text`
  color: #fff;
  margin-left: 6px;
`;

const ActionTextOutline = styled.Text`
  color: #1c1c88;
  margin-left: 6px;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
`;

const ModalOverlay = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalPaddingDiv = styled.View`
  padding: 20px;
`;

const ModalContainer = styled.View`
  width: 90%;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  padding: 0px;
  align-items: center;
`;


const ProfileHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 10px;
`;

const HeadingTextModal = styled.Text`
  font-size: 20px;
  font-weight: bold;
`;

const Divider = styled.View`
  width: 100%;
  height: 1px;
  background-color: #ccc;
  margin-vertical: 15px;
`;

const DetailsContainer = styled.View`
  align-items: flex-start;
  width: 100%;
`;

const DetailTextModal = styled.Text`
  font-size: 16px;
  margin-bottom: 5px;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  margin-top: 20px;
`;

const OptionText = styled.Text`
  font-size: 14px;
  color: #333;
`;

// Filter Modal

export const ModalFilterOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

export const ModalBox = styled.View`
  background-color: #fff;
  padding: 20px;
  width: ${SCREEN_WIDTH - 40}px;
  border-radius: 16px;
`;

export const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 20px;
`;

export const IconWrapper = styled.View`
  background-color: #1c1c88;
  padding: 8px;
  border-radius: 8px;
  margin-right: 10px;
  flex-shrink: 0; 
  align-self: flex-start;  
`;

export const HeadingFilterModalText = styled.Text`
  font-size: 18px;
  font-weight: bold;
`;

export const SectionContainer = styled.View`
  margin-bottom: 20px;
`;

export const SectionTitle = styled.Text`
  font-size: 15px;
  font-weight: 600;
  margin-left: 8px;
`;

export const OptionsRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
`;

export const OptionButton = styled.TouchableOpacity<{ selected: boolean }>`
  padding: 10px 20px;
  border-radius: 20px;
  background-color: ${({ selected }) => (selected ? "#1c1c88" : "#fff")};
  border: 1px solid ${({ selected }) => (selected ? "#1c1c88" : "#ccc")};
  margin-bottom: 10px;
`;

export const OptionFilterModalText = styled.Text<{ selected: boolean }>`
  color: ${({ selected }) => (selected ? "#fff" : "#555")};
  font-weight: 500;
`;

const FooterButtons = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0 20px;
`;

const ButtonBase = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 6px;
  align-items: center;
`;

export const ResetButtonText = styled.Text`
  color: #1c1c88;
  font-weight: bold;
`;

const ResetButton = styled(ButtonBase)`
  border: 1px solid #1c1c88;  
  margin-right: 10px;
  border-radius: 20px;
`;

const ApplyButton = styled(ButtonBase)`
  background-color: #1c1c88;
  margin-left: 10px;
  border-radius: 20px;
`;

export const ApplyButtonText = styled.Text`
  color: #fff;
  font-weight: bold;
`;

const EmptyWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
  min-height: 400px;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 12px;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
  width: 100%;
  max-width: 320px;
  max-height: 350px;
`;

const EmptyIconContainer = styled.View`
  margin-bottom: 20px;
`;

const EmptyTitle = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
`;

const EmptyMessage = styled.Text`
  text-align: center;
  font-size: 16px;
  color: #666;
  line-height: 24px;
  max-width: 280px;
`; 
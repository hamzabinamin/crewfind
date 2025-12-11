import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  Dimensions,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Animated,
  LayoutAnimation,
  Modal,
  ActionSheetIOS
} from "react-native";
import { FontAwesome5 } from '@expo/vector-icons'; 
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import { useRouter } from "expo-router";
import { Special } from "../../models/Special";
import UtilFunctions from "@/app/utilities/UtilFunctions";
import FastImage from "react-native-fast-image";
import LoadingIndicator from "../../utilities/LoadingIndicator";
import { User } from "../../models/User";
import { db } from "../../../FirebaseConfig";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;
const { height: screenHeight } = Dimensions.get('window');

interface CustomActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectMaps: (option: string) => void;
  title: string;
}

export default function Specials() {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [originalSpecials, setOriginalSpecials] = useState<Special[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Special | null>(null);

  const categories = [
    { id: "All", name: "All", icon: "star" },
    { id: "Hotel", name: "Hotel", icon: "building" },
    { id: "Food", name: "Food", icon: "utensils" },
    { id: "Car Rental", name: "Car Rental", icon: "car" },
    { id: "Activities", name: "Activities", icon: "wave-square" },
  ];

  const getIconForDealType = (dealType: string) => {
    const category = categories.find(cat => cat.name === dealType);
    return category ? category.icon : 'star'; // fallback icon
  };

  const isWithin150km = (userLoc: any, specialLoc: any) => {
    if (!isValidCoordinates(userLoc) || !isValidCoordinates(specialLoc)) {
      return false;
    }

    const distance = haversine(userLoc, specialLoc); // distance in meters
    return distance <= 150000 || (specialLoc.latitude === 0 && specialLoc.longitude === 0);
  };
  
  const fetchUserLocationAndSpecials = async (currentUser: User | null) => {
    try {
      setRefreshing(true);
      setLoading(true);

      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      if (existingStatus !== "granted") {
        // Show a helpful explanation
        const userAgreed = await new Promise((resolve) => {
          Alert.alert(
            "Location Access Needed",
            "We need your location to show nearby specials and offers. Allow location access?",
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
          // 🛑 NOW the user has seen the system permission prompt
          Alert.alert(
            "Enable Location in Settings",
            "To show nearby specials, please allow location access from Settings.",
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

      const specialsSnapshot = await getDocs(collection(db, "Specials"));

      const specialsData: (Special | null)[] = await Promise.all(
        specialsSnapshot.docs.map(async (specialDoc) => {
          const specialData = specialDoc.data();
          const location = specialData.companyCoordinates || { latitude: 0, longitude: 0 };

          console.log("User Location: ", userLoc);
          console.log("Special Location: ", location);
          console.log("Are they within 150km: ", isWithin150km(userLoc, location));

          if (userLoc && !isWithin150km(userLoc, location)) return null;

          const companyImageUrl = currentUser && specialData.companyImage
            ? await UtilFunctions.fetchLogoUrl(specialData.companyImage)
            : "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png";

          const backgroundImageUrl = currentUser && specialData.backgroundImage
            ? await UtilFunctions.fetchLogoUrl(specialData.backgroundImage)
            : "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png";

          return {
            id: specialDoc.id,
            companyName: specialData.companyName,
            dealExpiration: specialData.dealExpiration,
            dealDescription: specialData.dealDescription,
            phoneNumber: specialData.phoneNumber,
            companyCoordinates: specialData.companyCoordinates,
            dealType: specialData.dealType,
            location,
            companyImageUrl,
            backgroundImageUrl,
            createdAt: new Date(specialData.createdAt),
            updatedAt: new Date(specialData.updatedAt),
          };
        })
      );

      const filteredSpecials = specialsData.filter(Boolean) as Special[];
      setSpecials(filteredSpecials);
      setOriginalSpecials(filteredSpecials);
    } catch (error) {
      console.error("Error fetching specials or location:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const isValidPhoneNumber = (number: string | undefined | null) => {
    return typeof number === 'string' && /^\+?[0-9]{7,15}$/.test(number);
  };

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

  useEffect(() => {
    console.log("Inside Home's useEffect");

    const init = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("Stored User: ", storedUser);

      if (storedUser) {
        setUser(storedUser);
      }

      // ✅ Guaranteed to run AFTER fetchUserFromStorage
      await fetchUserLocationAndSpecials(storedUser ?? null);
    };

    init();
  }, []);

  const CustomActionSheet: React.FC<CustomActionSheetProps> = ({ visible, onClose, onSelectMaps, title }) => {
    const [slideAnim] = useState(new Animated.Value(screenHeight));

    React.useEffect(() => {
      if (visible) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [visible]);

    const handleOptionPress = (option: any) => {
      onSelectMaps(option);
      onClose();
    };

    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.actionSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.headerActionSheet}>
                <Text style={styles.title}>{title}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('apple')}
              >
                <Text style={styles.optionText}>Apple Maps</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('google')}
              >
                <Text style={styles.optionText}>Google Maps</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.option, styles.cancelOption]}
                onPress={onClose}
              >
                <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderDescription = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Ensure it has a protocol so Linking works
        const url = part.startsWith("http") ? part : `https://${part}`;
        return (
          <Text
            key={index}
            style={{ color: "#1c1c88", textDecorationLine: "underline" }}
            onPress={() => Linking.openURL(url)}
          >
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const openAppleMaps = async (latitude: number, longitude: number) => {
    const appleUrl = `maps:0,0?q=${latitude},${longitude}`;
    try {
      const canOpen = await Linking.canOpenURL(appleUrl);
      if (canOpen) {
        await Linking.openURL(appleUrl);
      } else {
        Alert.alert('Error', 'Unable to open Apple Maps');
      }
    } catch (error) {
      console.log('Failed to open Apple Maps:', error);
      Alert.alert('Error', 'Unable to open Apple Maps');
    }
  };

  const openGoogleMaps = async (latitude: number, longitude: number) => {
    // Try different Google Maps URL schemes
    const googleMapsUrls = [
      `comgooglemaps://?center=${latitude},${longitude}&q=${latitude},${longitude}&zoom=14`,
      `comgooglemaps://?q=${latitude},${longitude}`,
      `googlemaps://?center=${latitude},${longitude}&q=${latitude},${longitude}`,
      `https://maps.google.com/?q=${latitude},${longitude}` // Web fallback
    ];

    for (const url of googleMapsUrls) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return; // Successfully opened, exit the function
        }
      } catch (error) {
        console.log(`Failed to open ${url}:`, error);
        continue; // Try next URL
      }
    }

    // If all URLs failed
    Alert.alert('Error', 'Unable to open Google Maps. Please make sure Google Maps is installed.');
  };

  const handleMapsSelection = (option: string) => {
    if (!selectedItem || !selectedItem.companyCoordinates) return;
    
    const { latitude, longitude } = selectedItem.companyCoordinates;
    
    if (option === 'apple') {
      openAppleMaps(latitude, longitude);
    } else if (option === 'google') {
      openGoogleMaps(latitude, longitude);
    }
  };

  const toggleExpanded = (itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const handleCallPress = (item: Special) => {
    if (item?.phoneNumber && isValidPhoneNumber(item.phoneNumber)) {
      Linking.openURL(`tel:${item.phoneNumber}`);
    } else {
      Alert.alert("Error", "No valid phone number available");
    }
  };

  const handleDirectionsPress = (item: Special) => {
    if (item?.companyCoordinates && isValidCoordinates(item.companyCoordinates)) {
      setSelectedItem(item); // Store the selected item for later use
      
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Apple Maps', 'Google Maps'],
            cancelButtonIndex: 0,
            title: 'Open directions in',
          },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              openAppleMaps(item.companyCoordinates.latitude, item.companyCoordinates.longitude);
            } else if (buttonIndex === 2) {
              openGoogleMaps(item.companyCoordinates.latitude, item.companyCoordinates.longitude);
            }
          }
        );
      } else {
        // Android - show custom action sheet
        setShowActionSheet(true);
      }
    } else {
      Alert.alert("Error", "No location coordinates available");
    }
  };

  const filteredData = specials.filter(item => {
    const matchesSearch = item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.dealDescription || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || 
                         item.dealType?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
    return matchesSearch && matchesCategory;
  });

  const renderCategoryButton = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <FontAwesome5 name={category.icon} style={styles.categoryIcon} size={18} color={"#666"} />
      <Text style={[
        styles.categoryText,
        selectedCategory === category.id && styles.selectedCategoryText
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Special }) => {
    const isExpanded = expandedItemId === item.id;
    
    return (
      <View style={[styles.card, isExpanded && styles.expandedCard]}>
        <TouchableOpacity onPress={() => toggleExpanded(item.id)}>
          <View style={styles.cardHeader}>
            <FastImage
              source={{
                uri: item.companyImageUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.companyIcon}
              resizeMode={FastImage.resizeMode.cover}
            />
            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>{item.companyName}</Text>
              <Text style={styles.cardDescription}  numberOfLines={2} ellipsizeMode="tail">{item.dealDescription}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <FontAwesome5
                name={getIconForDealType(item.dealType)}
                size={14}
                color="#1c1c88"
                style={styles.categoryBadgeIcon}
              />
              <Text style={styles.categoryBadgeText}>{item.dealType}</Text>
            </View>
          </View>
          
          {item.dealExpiration && (
            <View style={styles.validityRow}>
              <FontAwesome5 name="clock" size={16} color="#1c1c88" style={styles.validityIcon} />
              <Text style={styles.validityText}>Until {item.dealExpiration}</Text>
            </View>
          )}
          
          <View style={styles.viewButton}>
            <FontAwesome5 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#1c1c88" 
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Company Logo Banner */}
            <View style={styles.expandedBanner}>
              <FastImage
                source={{
                  uri: item.backgroundImageUrl,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.expandableBannerImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            </View>

            {/* Description Section */}
            <View style={styles.expandedSection}>
              <Text style={styles.expandedSectionTitle}>Description</Text>
              <Text style={styles.expandedDescription}>{renderDescription(item.dealDescription)}</Text>
            </View>

            {/* Expiry Section */}
            <View style={styles.expandedExpirySection}>
              <FontAwesome5 name="calendar-alt" size={16} color="#1c1c88" />
              <Text style={styles.expandedExpiryLabel}>Expires:</Text>
              <Text style={styles.expandedExpiryDate}>
                {item.dealExpiration || "No expiration date"}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {isValidPhoneNumber(item.phoneNumber) && (
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleCallPress(item)}
                >
                  <FontAwesome5 name="phone" size={16} color="#fff" />
                  <Text style={styles.actionText}>Call</Text>
                </TouchableOpacity>
              )}
              
              {isValidCoordinates(item.companyCoordinates) && (
                <TouchableOpacity 
                  style={styles.actionButtonOutline} 
                  onPress={() => handleDirectionsPress(item)}
                >
                  <FontAwesome5 name="directions" size={16} color="#1c1c88" />
                  <Text style={styles.actionTextOutline}>Directions</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateCard}>
        <View style={styles.emptyStateIcon}>
          <Text style={styles.emptyStateIconText}>⭐</Text>
        </View>
        <Text style={styles.emptyStateTitle}>No matching specials found</Text>
        <Text style={styles.emptyStateSubtitle}>Try adjusting your filters or search terms</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Info Section */}
      <View style={styles.searchInfoSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={16} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for specials..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            <Text style={styles.infoBannerBold}>Companies:</Text> List your crew exclusive deals here at no cost. Contact{" "}
            <Text style={styles.infoBannerLink}>info@crewfind.app</Text> to get started.{"\n"}
            Only crew specials within 150km of your location will appear here
          </Text>
        </View>
        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(renderCategoryButton)}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingIndicator />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id ?? index.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          onRefresh={() => fetchUserLocationAndSpecials(user)}
          ListEmptyComponent={renderEmptyState} // ✅ Empty state handled here
        />
      )}

      {/* Custom Action Sheet for Android */}
      <CustomActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onSelectMaps={handleMapsSelection}
        title="Open directions in:"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  logoContainer: {
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1c1c88",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1c1c88",
    justifyContent: "center",
    alignItems: "center",
  },
  profileButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  searchInfoSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F5",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: "#999",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#999",
  },
  infoBanner: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
  },
  infoBannerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  infoBannerBold: {
    fontWeight: "bold",
    color: "#1c1c88",
  },
  infoBannerLink: {
    color: "#1c1c88",
    fontWeight: "500",
  },
  categoriesContainer: {
    marginTop: 15,
    marginBottom: 5,
    height: 50,
  },
  categoriesContent: {
    alignItems: "center",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 36,
  },
  selectedCategoryButton: {
    backgroundColor: "#1c1c88",
    borderColor: "#1c1c88",
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyStateContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },
  emptyStateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: "100%",
    maxWidth: 320,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffd700",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateIconText: {
    fontSize: 32,
    color: "#333",
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: "relative",
  },
  expandedCard: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  companyIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#1c1c88",
    borderWidth: 1,
    borderColor: "#1c1c88",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -5,
    marginRight: 15,
  },
  companyLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: "#1c1c88",
    fontWeight: "600",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 20,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 3,
    marginRight: 15,
  },
  categoryBadgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  validityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginLeft: 65,
  },
  validityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  validityText: {
    fontSize: 12,
    color: "#666",
  },
  viewButton: {
    position: "absolute",
    top: 0,
    right: -15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  // Expanded Content Styles
  expandedContent: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  expandedBanner: {
    backgroundColor: "#1c1c88",
    borderRadius: 12,
    padding: 0,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 125,
    overflow: "hidden"
  },
  expandableBannerImage: {
    width: "100%",
    height: "100%",
    position: "absolute", // fills the parent
  },
  expandedBannerCompany: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  expandedSection: {
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  expandedSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  expandedDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  expandedExpirySection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  expandedExpiryLabel: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
    marginRight: 6,
  },
  expandedExpiryDate: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1c1c88',
  },
  actionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1c1c88',
  },
  actionText: {
    color: '#fff',
    marginLeft: 6,
  },
  actionTextOutline: {
    color: '#1c1c88',
    marginLeft: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34, // Safe area padding for newer Android devices
  },
  headerActionSheet: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 8,
    backgroundColor: '#F8F8F8',
  },
  optionText: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '400',
  },
  cancelText: {
    fontWeight: '600',
  },

});
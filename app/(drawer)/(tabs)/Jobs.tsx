import React, { useEffect, useState } from "react";
import { 
  FlatList, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback, 
  Alert, 
  Linking,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import LoadingIndicator from "../../../utilities/LoadingIndicator";
import { User } from "../../../models/User";
import { JobPost } from "../../../models/JobPost";
import { Airline } from "../../../models/Airline";
import eventEmitter from "../../../utilities/eventEmitter";
import UtilFunctions from "@/utilities/UtilFunctions";
import { Image } from "expo-image";
import { getAuth } from "firebase/auth";
import { db } from "../../../FirebaseConfig";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const screenWidth = Dimensions.get("window").width;

const Jobs = () => {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [originalJobs, setOriginalJobs] = useState<JobPost[]>([]);
  const [chatIds, setChatIds] = useState<{ [key: string]: string | null }>({});
  const [user, setUser] = useState<User | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const router = useRouter();

  // Filter categories similar to Specials screen
  const filterOptions = [
    { id: "All", name: "All", icon: "briefcase" },
    { id: "Pilot", name: "Pilot", icon: "plane" },
    { id: "Cabin Crew", name: "Cabin Crew", icon: "users" },
    { id: "Exclude my Country", name: "Exclude my Country (Base)", icon: "map-marker-alt" },
  ];

  const getIconForJobType = (jobFor: string) => {
    if (jobFor?.toLowerCase().includes('pilot')) return 'plane';
    if (jobFor?.toLowerCase().includes('cabin') || jobFor?.toLowerCase().includes('crew')) return 'users';
    return 'briefcase';
  };

  const toggleExpanded = (itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  useEffect(() => {
    console.log("Inside Home's useEffect");
    const fetchUserFromStorage = async () => {
      const storedUser = await UtilFunctions.getUser();
      console.log("Stored User: ", storedUser);
      if (storedUser) {
        setUser(storedUser);
      }
    };
    fetchUserFromStorage();
  }, []);

  useEffect(() => {
   // if (user) {
      fetchJobs();
   // }
  }, [user]);

  useEffect(() => {
    const listener = () => {
      console.log("Filter event received in Jobs!");
      setFilterModalVisible(true);
    };
  
    eventEmitter.on("openFilter:Jobs", listener);
  
    return () => {
      eventEmitter.off("openFilter:Jobs", listener);
    };
  }, []);

  const navigateToChat = (recipientId: string, chatId: string) => {    
    router.push({
      pathname: "../../screens/MessageDetail",
      params: { recipientId, chatId }
    });
  };

  const fetchJobs = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const chatIdsStore: { [key: string]: string | null } = {};
      const jobsSnapshot = await getDocs(collection(db, "JobPosts"));
      const jobsData: JobPost[] = await Promise.all(
        jobsSnapshot.docs.map(async (jobDoc) => {
          const jobData = jobDoc.data();
          const airlineID = jobData.airlineID;
          console.log("Fetched Jobs: ", jobData);

          let airlineData: Airline;

          if (airlineID) {
            // Fetch airline details
            const airlineRef = doc(db, "Airlines", airlineID);
            const airlineSnap = await getDoc(airlineRef);

            if (airlineSnap.exists()) {
              const data = airlineSnap.data();
              console.log("Airline data: ", data);

              const [logoUrl, backgroundUrl] = await Promise.all([
                data.logoImage 
                  ? UtilFunctions.fetchLogoUrl(data.logoImage) 
                  : Promise.resolve("https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png"),
                data.backgroundImage 
                  ? UtilFunctions.fetchLogoUrl(data.backgroundImage) 
                  : Promise.resolve("https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png")
              ]);

              airlineData = {
                id: airlineSnap.id,
                name: data.name || "Unknown Airline",
                logoImageUrl: logoUrl,
                backgroundImageUrl: backgroundUrl,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
              };

              if (user) {
                console.log("user (Jobs): ", user);
                const chatQuery = query(
                  collection(db, "Chats"),
                  where("participants", "array-contains", user.id)
                );
    
                const chatSnapshot = await getDocs(chatQuery);
                chatIdsStore[airlineSnap.id] = null;
      
                for (const chatDoc of chatSnapshot.docs) {
                  const chatData = chatDoc.data();
                  if (Array.isArray(chatData.participants) && chatData.participants.includes(airlineSnap.id)) {
                    chatIdsStore[airlineSnap.id] = chatDoc.id;
                    console.log("chatIdsStore: ", chatIdsStore);
                    break;
                  }
                }
                setChatIds(chatIdsStore);
              }
            } else {
              console.log("Using unknown airline 1");
              airlineData = {
                id: airlineID,
                name: "Unknown Airline",
                logoImageUrl: "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png",
                backgroundImageUrl: "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png",
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
          } else {
            console.log("Using unknown airline 2");
            airlineData = {
              id: "unknown",
              name: "Unknown Airline",
              logoImageUrl: "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png",
              backgroundImageUrl: "https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }

          return {
            id: jobDoc.id,
            title: jobData.title,
            base: jobData.base,
            jobFor: jobData.jobFor || "N/A",
            jobExpiration: jobData.jobExpiration,
            description: jobData.description,
            jobURL: jobData.jobURL,
            airline: airlineData,
            createdAt: new Date(jobData.createdAt),
            updatedAt: new Date(jobData.updatedAt),
          };
        })
      );

      const sortedJobs = jobsData.sort((a, b) => {
        const nameA = a.airline?.name?.toLowerCase() || '';
        const nameB = b.airline?.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });      

      setJobs(sortedJobs);
      setOriginalJobs(sortedJobs);
      console.log("Chat Ids: ", chatIds);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  
  const applyJobFilter = (option: string) => {
    console.log("Filtering jobs for:", option);
  
    let filtered = [...originalJobs];
  
    if (option === "Pilot" || option === "Cabin Crew") {
      filtered = originalJobs.filter((job) =>
        job.jobFor?.toLowerCase() === option.toLowerCase()
      );
    }
    else if (option === "Exclude my Country" && user) {
      const userCountry = user.base;
      filtered = originalJobs.filter((job) => !job.base.includes(userCountry));
    }
    else {
      filtered = originalJobs;
    }
  
    setJobs(filtered);
  };

  // Filter jobs based on search and selected category
  const filteredData = jobs.filter(item => {
    const matchesSearch = item.airline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedOption === "All" || 
                           (selectedOption === "Pilot" && item.jobFor?.toLowerCase() === "pilot") ||
                           (selectedOption === "Cabin Crew" && item.jobFor?.toLowerCase() === "cabin crew") ||
                           (selectedOption === "Exclude my Country" && user && !item.base.includes(user.base));
    
    return matchesSearch && matchesCategory;
  });

  const renderCategoryButton = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedOption === category.id && styles.selectedCategoryButton
      ]}
      onPress={() => {
        setSelectedOption(category.id);
        applyJobFilter(category.id);
      }}
    >
      <FontAwesome5 name={category.icon} style={styles.categoryIcon} size={18} color={"#666"} />
      <Text style={[
        styles.categoryText,
        selectedOption === category.id && styles.selectedCategoryText
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: JobPost }) => {
    const isExpanded = expandedItemId === item.id;
    
    return (
      <View style={[styles.card, isExpanded && styles.expandedCard]}>
        <TouchableOpacity onPress={() => toggleExpanded(item.id)}>
          <View style={styles.cardHeader}>
           <Image
              source={{
                uri: item.airline.logoImageUrl
              }}
              style={styles.companyIcon}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>{item.airline.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={2} ellipsizeMode="tail">
                {item.title}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <FontAwesome5
                name={getIconForJobType(item.jobFor ?? "")}
                size={14}
                color="#1c1c88"
                style={styles.categoryBadgeIcon}
              />
              <Text style={styles.categoryBadgeText}>{item.jobFor}</Text>
            </View>
          </View>
          
          {item.jobExpiration && (
            <View style={styles.validityRow}>
              <FontAwesome5 name="clock" size={16} color="#1c1c88" style={styles.validityIcon} />
              <Text style={styles.validityText}>Expires {item.jobExpiration}</Text>
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
            {/* Company Banner */}
            <View style={styles.expandedBanner}>
              <Image
                source={{
                  uri: item.airline.backgroundImageUrl
                }}
                style={styles.expandableBannerImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>

            {/* Job Details Section */}
           {item.description && (
            <View style={styles.expandedSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.expandedDescription}>{item.description}</Text>
            </View>
            )}

            {/* Position and Base Section */}
            <View style={styles.positionBaseSection}>
              <View style={styles.positionBaseItem}>
                <Text style={styles.positionBaseLabel}>
                  Position: <Text style={styles.positionBaseValue}>{item.title}</Text>
                </Text>
              </View>
              <View style={styles.positionBaseItem}>
                <Text style={[styles.positionBaseLabel, { textAlign: "right" }]}>
                  Base: <Text style={styles.positionBaseValue}>{item.base}</Text>
                </Text>
              </View>
            </View>

            {/* Expiry Section */}
            <View style={styles.expandedExpirySection}>
              <FontAwesome5 name="calendar-alt" size={16} color="#1c1c88" />
              <Text style={styles.expandedExpiryLabel}>Expires:</Text>
              <Text style={styles.expandedExpiryDate}>
                {item.jobExpiration || "No expiration date"}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => {
                  const url = item?.jobURL;
                  if (url && typeof url === 'string' && url.startsWith('http')) {
                    Linking.openURL(url).catch(() => {
                      Alert.alert("Error", "Unable to open the job URL.");
                    });
                  } else {
                    Alert.alert("Invalid URL", "No url is provided or the provided job url is not valid");
                  }
                }}
              >
                <FontAwesome5 name="external-link-alt" size={16} color="#fff" />
                <Text style={styles.actionText}>Apply</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButtonOutline} 
                onPress={() => {
                  if (!user) {
                    router.replace("../../screens/auth/Login");
                    return;
                  }
                  navigateToChat(item.airline.id ?? "", chatIds[item.airline.id ?? ""] ?? "");
                }}
              >
                <FontAwesome5 name="envelope" size={16} color="#1c1c88" />
                <Text style={styles.actionTextOutline}>Message</Text>
              </TouchableOpacity>
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
          <Text style={styles.emptyStateIconText}>💼</Text>
        </View>
        <Text style={styles.emptyStateTitle}>No matching jobs found</Text>
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
            placeholder="Search for jobs..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {filterOptions.map(renderCategoryButton)}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingIndicator />
      ) : filteredData.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchJobs}
          initialNumToRender={3}      
          maxToRenderPerBatch={4}     
          windowSize={5}               
          removeClippedSubviews={true}
        />
      )}

      {/* Legacy Filter Modal (keeping for backward compatibility) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalBox}>
                <Text style={styles.modalHeading}>Filter Options</Text>

                {["All", "Exclude my Country", "Pilot", "Cabin Crew"].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setSelectedOption(option);
                    console.log("Selected Filter:", option);
                    setFilterModalVisible(false);
                    applyJobFilter(option); 
                  }}
                  style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
                >
                  <View style={[styles.radioCircle, selectedOption === option && styles.selectedRadio]} />
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Jobs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  categoriesContainer: {
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
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
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
    position: "absolute",
  },
  expandedSection: {
    backgroundColor: '#f5f5f5', // grey background like Position/Base section
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  expandedDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  positionBaseSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  positionBaseItem: {
    flex: 1,   // ensures each takes equal space
  },
  positionBaseLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  positionBaseValue: {
    fontSize: 12,
    color: '#1c1c88',
    fontWeight: '600',
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
  expandedActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
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
  // Legacy modal styles (keeping for backward compatibility)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  modalBox: {
    backgroundColor: "white",
    margin: 40,
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5DCBCF",
    marginBottom: 20,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#5DCBCF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "transparent",
  },
  selectedRadio: {
    backgroundColor: "#5DCBCF",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
});
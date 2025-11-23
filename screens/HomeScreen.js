import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import aiService from '../services/aiService';
import weatherService from '../services/weather.service';
import marketService from '../services/marketService';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernHeader from '../components/ModernHeader';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { farmerProfile, activeCrops, availableLand, getFarmerContextForAI, addCrop, updateCrop, removeCrop } = useFarmer();
  const styles = createStyles(theme);
  const [weather, setWeather] = useState(null);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiTip, setAiTip] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  // Removed modal states - using navigation instead
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showCropActions, setShowCropActions] = useState(false);

  useEffect(() => {
    loadHomeData();
    loadAITip();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Get user's current location
      const location = await weatherService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Get weather data for current location
      try {
        const weatherData = await weatherService.getCurrentWeather(location.latitude, location.longitude);
        setWeather({
          location: location.city || 'Current Location',
          temperature: Math.round(weatherData.main.temp),
          description: weatherData.weather[0].description,
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind.speed * 3.6) // Convert m/s to km/h
        });
      } catch (weatherError) {
        console.error('Weather loading error:', weatherError);
        // Fallback to mock weather data
        setWeather({
          location: location.city || 'Current Location',
          temperature: 28,
          description: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12
        });
      }
      
      // Get market prices for current location
      await loadLocationBasedPrices(location);
      
    } catch (error) {
      console.error('Home data loading error:', error);
      // Fallback to mock data if location fails
      setWeather({
        location: 'Delhi',
        temperature: 28,
        description: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12
      });
      setMarketPrices([
        { crop: 'rice', name: 'Rice', averagePrice: 2800 },
        { crop: 'wheat', name: 'Wheat', averagePrice: 2200 },
        { crop: 'cotton', name: 'Cotton', averagePrice: 5800 }
      ]);
    } finally {
      setLoading(false);
      // Load AI tip after data is available
      setTimeout(() => loadAITip(), 1000); // Small delay to ensure weather and market data are set
    }
  };

  const loadLocationBasedPrices = async (location) => {
    try {
      // Map location to state (simplified mapping)
      let stateName = 'Karnataka'; // Default fallback
      if (location.city) {
        const cityName = location.city.toLowerCase();
        if (cityName.includes('delhi') || cityName.includes('new delhi')) {
          stateName = 'Delhi';
        } else if (cityName.includes('mumbai') || cityName.includes('pune') || cityName.includes('nagpur')) {
          stateName = 'Maharashtra';
        } else if (cityName.includes('bangalore') || cityName.includes('mysore') || cityName.includes('mangalore')) {
          stateName = 'Karnataka';
        } else if (cityName.includes('chennai') || cityName.includes('coimbatore') || cityName.includes('madurai')) {
          stateName = 'Tamil Nadu';
        } else if (cityName.includes('hyderabad') || cityName.includes('warangal')) {
          stateName = 'Telangana';
        }
      }

      // Get top 3 crop prices for the region
      const crops = ['Rice', 'Wheat', 'Cotton'];
      const pricesPromises = crops.map(async (crop) => {
        try {
          const priceData = await marketService.getMarketPrices(crop, stateName, 'All Markets');
          console.log(`Price data for ${crop}:`, priceData); // Debug log
          
          if (priceData && priceData.length > 0) {
            // Handle both API data structure (modal_price) and mock data structure (Model Prize)
            const avgPrice = priceData.reduce((sum, item) => {
              const price = parseFloat(item.modal_price || item['Model Prize'] || item.modelPrice || 0);
              return sum + price;
            }, 0) / priceData.length;
            
            console.log(`Average price for ${crop}: ${avgPrice}`); // Debug log
            
            return {
              crop: crop.toLowerCase(),
              name: crop,
              averagePrice: Math.round(avgPrice) || 0
            };
          }
          return null;
        } catch (error) {
          console.error(`Error loading ${crop} prices:`, error);
          return null;
        }
      });

      const prices = await Promise.all(pricesPromises);
      const validPrices = prices.filter(price => price !== null && price.averagePrice > 0);

      console.log('Valid prices:', validPrices); // Debug log

      if (validPrices.length > 0) {
        setMarketPrices(validPrices);
      } else {
        console.log('No valid prices, using fallback'); // Debug log
        // Fallback to realistic mock data if API fails
        setMarketPrices([
          { crop: 'rice', name: 'Rice', averagePrice: 2100 },
          { crop: 'wheat', name: 'Wheat', averagePrice: 2300 },
          { crop: 'cotton', name: 'Cotton', averagePrice: 6500 }
        ]);
      }
    } catch (error) {
      console.error('Market prices loading error:', error);
      // Fallback to mock data
      setMarketPrices([
        { crop: 'rice', name: 'Rice', averagePrice: 2800 },
        { crop: 'wheat', name: 'Wheat', averagePrice: 2200 },
        { crop: 'cotton', name: 'Cotton', averagePrice: 5800 }
      ]);
    }
  };

  const loadAITip = async () => {
    try {
      // Get comprehensive farmer context for AI
      const farmerContext = getFarmerContextForAI();
      
      // Build comprehensive context string for AI
      let contextParts = [];
      
      // Basic context
      contextParts.push(`Season: ${getCurrentSeason()}`);
      
      if (farmerContext.farmer) {
        contextParts.push(`Location: ${farmerContext.farmer.location}, ${farmerContext.farmer.district}, ${farmerContext.farmer.state}`);
        contextParts.push(`Land Size: ${farmerContext.farmer.landSize} acres`);
        contextParts.push(`Soil Type: ${farmerContext.farmer.soilType}`);
        if (farmerContext.farmer.experience) {
          contextParts.push(`Experience: ${farmerContext.farmer.experience} years`);
        }
        if (farmerContext.farmer.farmingMethod) {
          contextParts.push(`Farming Method: ${farmerContext.farmer.farmingMethod}`);
        }
        if (farmerContext.farmer.irrigationType) {
          contextParts.push(`Irrigation: ${farmerContext.farmer.irrigationType}`);
        }
        if (farmerContext.farmer.waterSource) {
          contextParts.push(`Water Source: ${farmerContext.farmer.waterSource}`);
        }
        if (farmerContext.farmer.primaryCrops && farmerContext.farmer.primaryCrops.length > 0) {
          contextParts.push(`Primary Crops: ${farmerContext.farmer.primaryCrops.join(', ')}`);
        }
      }

      // Weather data
      if (weather) {
        contextParts.push(`Weather: ${weather.description}, ${weather.temperature}°C, Humidity: ${weather.humidity}%`);
      }

      // Active crops
      if (farmerContext.activeCrops.length > 0) {
        const cropDetails = farmerContext.activeCrops.map(crop => 
          `${crop.name}${crop.variety ? ` (${crop.variety})` : ''} - ${crop.area} acres, Stage: ${crop.stage}`
        ).join(', ');
        contextParts.push(`Active Crops: ${cropDetails}`);
      }

      // Land utilization
      if (farmerContext.landUtilization.totalArea > 0) {
        contextParts.push(`Land Used: ${farmerContext.landUtilization.usedArea}/${farmerContext.landUtilization.totalArea} acres`);
      }

      // Recent harvests
      if (farmerContext.recentHarvests.length > 0) {
        const harvestDetails = farmerContext.recentHarvests.map(harvest => 
          `${harvest.name} harvested on ${new Date(harvest.harvestedDate).toLocaleDateString()}`
        ).join(', ');
        contextParts.push(`Recent Harvests: ${harvestDetails}`);
      }

      const comprehensiveContext = contextParts.join(', ');
      
      const tip = await aiService.getSeasonalAdvice(farmerContext);
      setAiTip(tip || 'Monitor your crops regularly and maintain proper irrigation based on weather conditions.');
    } catch (error) {
      console.error('AI tip loading error:', error);
      setAiTip('Monitor your crops regularly and maintain proper irrigation based on weather conditions.');
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 3 && month <= 5) return 'Summer';
    if (month >= 6 && month <= 9) return 'Monsoon';
    if (month >= 10 && month <= 11) return 'Post-Monsoon';
    return 'Winter';
  };

  const getCropStatusColor = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'seeding': return '#4CAF50';
      case 'growing': return '#8BC34A';
      case 'flowering': return '#FFEB3B';
      case 'harvesting': return '#FF9800';
      case 'harvested': return '#795548';
      default: return theme.primary;
    }
  };

  const handleCropAction = (crop) => {
    // Navigate to AI Analytics for pest detection
    navigation.navigate('AIAnalytics', { 
      cropId: crop.id,
      cropName: crop.name 
    });
  };



  // handleAddCrop removed - using AddCropScreen instead

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    await loadAITip(); // Refresh AI tip with updated data
    setRefreshing(false);
  };

  const navigateToMarketWithCrop = (cropName) => {
    // Navigate to Market screen and pass crop data
    navigation.navigate('Market', { 
      selectedCrop: cropName,
      showIntentionModal: true 
    });
  };

  const quickActions = [
    {
      title: 'Krishita AI',
      subtitle: 'Smart farming advice',
      icon: 'chatbubbles',
      gradient: ['#4CAF50', '#66BB6A'],
      onPress: () => navigation.navigate('Chatbot')
    },
    {
      title: 'Weather',
      subtitle: 'मौसम पूर्वानुमान',
      icon: 'cloudy',
      gradient: ['#2196F3', '#42A5F5'],
      onPress: () => navigation.navigate('Weather')
    },
    {
      title: 'Community',
      subtitle: 'Connect with farmers',
      icon: 'people',
      gradient: ['#9C27B0', '#BA68C8'],
      onPress: () => navigation.navigate('Community')
    },
    {
      title: 'AI Analytics',
      subtitle: 'Crop analysis',
      icon: 'analytics',
      gradient: ['#FF9800', '#FFB74D'],
      onPress: () => navigation.navigate('AIAnalytics')
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />
      
      {/* Compact Modern Header */}
      <LinearGradient
        colors={theme.gradientPrimary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.headerTitle}>
              {farmerProfile?.name || 'Farmer'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Modern Crop Management Card */}
        <ModernCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleSection}>
              <View style={styles.iconContainer}>
                <Ionicons name="leaf" size={24} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>My Crops</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                  {activeCrops.length} active • {availableLand.toFixed(1)} acres available
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <ModernButton
                title="Add Crop"
                icon="add"
                size="small"
                onPress={() => navigation.navigate('AddCrop')}
              />
            </View>
          </View>
            
            {farmerProfile && (
              <View style={styles.landInfo}>
                <Text style={[styles.landInfoText, { color: theme.textSecondary }]}>
                  Land: {farmerProfile.landSize} acres | Used: {(farmerProfile.landSize - availableLand).toFixed(1)} acres | Available: {availableLand.toFixed(1)} acres
                </Text>
              </View>
            )}

            {activeCrops.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropsScroll}>
                {activeCrops.map((crop) => (
                  <View key={crop.id} style={[styles.cropCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <View style={styles.cropCardHeader}>
                      <View style={styles.cropNameSection}>
                        <Text style={[styles.cropName, { color: theme.text }]}>{crop.name}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleCropAction(crop)}
                        style={[styles.cropActionButton, { backgroundColor: theme.primary + '15' }]}
                      >
                        <Ionicons name="ellipsis-vertical" size={16} color={theme.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.cropVariety, { color: theme.textSecondary }]}>{crop.variety}</Text>
                    <View style={styles.cropDetails}>
                      <View style={styles.cropDetailItem}>
                        <Ionicons name="calendar" size={14} color={theme.primary} />
                        <Text style={[styles.cropDetailText, { color: theme.textSecondary }]}>
                          {new Date(crop.plantedDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.cropDetailItem}>
                        <Ionicons name="resize" size={14} color={theme.primary} />
                        <Text style={[styles.cropDetailText, { color: theme.textSecondary }]}>
                          {crop.areaAllocated} acres
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cropStatus, { backgroundColor: getCropStatusColor(crop.growthStage) + '20' }]}>
                      <Text style={[styles.cropStatusText, { color: getCropStatusColor(crop.growthStage) }]}>
                        {crop.growthStage && typeof crop.growthStage === 'string' 
                          ? crop.growthStage.charAt(0).toUpperCase() + crop.growthStage.slice(1)
                          : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                ))}
                
                {availableLand > 0.1 && (
                  <TouchableOpacity 
                    style={[styles.addNewCropCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}
                    onPress={() => navigation.navigate('AddCrop')}
                  >
                    <Ionicons name="add-circle" size={32} color={theme.primary} />
                    <Text style={[styles.addNewCropText, { color: theme.primary }]}>Add New Crop</Text>
                    <Text style={[styles.availableLandText, { color: theme.textSecondary }]}>
                      {availableLand.toFixed(1)} acres available
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
              <TouchableOpacity 
                style={[styles.emptyCropsContainer, { backgroundColor: theme.primary + '10' }]}
                onPress={() => navigation.navigate('AddCrop')}
              >
                <Ionicons name="leaf-outline" size={48} color={theme.primary} />
                <Text style={[styles.emptyCropsTitle, { color: theme.text }]}>Start Your Farming Journey</Text>
                <Text style={[styles.emptyCropsSubtitle, { color: theme.textSecondary }]}>
                  Add your first crop to track progress and get AI recommendations
                </Text>
                <View style={[styles.addCropPrompt, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addCropPromptText}>Add Crop</Text>
                </View>
              </TouchableOpacity>
            )}
        </ModernCard>

        {/* Modern Quick Actions */}
        <ModernCard>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modernActionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name={action.icon} size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.modernActionTitle}>{action.title}</Text>
                  <Text style={styles.modernActionSubtitle}>{action.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ModernCard>

        {/* Modern AI Daily Tip */}
        {aiTip && (
          <ModernCard gradient>
            <View style={styles.tipHeader}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="bulb" size={24} color={theme.primary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.text }]}>Today's Smart Tip</Text>
                <Text style={[styles.tipSubtitle, { color: theme.textSecondary }]}>आज की सलाह</Text>
              </View>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadAITip}
              >
                <Ionicons name="refresh" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.aiTipText, { color: theme.text }]}>{aiTip}</Text>
          </ModernCard>
        )}

        {/* Modern Market Prices */}
        <ModernCard>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Market Prices</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>आज के भाव</Text>
            </View>
            <ModernButton
              title="View All"
              variant="ghost"
              size="small"
              onPress={() => navigation.navigate('Market')}
            />
          </View>
          
          <View style={styles.pricesContainer}>
            {marketPrices.map((crop, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.modernPriceCard}
                onPress={() => navigateToMarketWithCrop(crop.name)}
                activeOpacity={0.7}
              >
                <View style={styles.priceCardContent}>
                  <View style={styles.cropIconContainer}>
                    <Ionicons name="leaf" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={[styles.cropName, { color: theme.text }]}>{crop.name}</Text>
                    <Text style={[styles.cropPrice, { color: theme.primary }]}>₹{crop.averagePrice}</Text>
                    <Text style={[styles.priceUnit, { color: theme.textSecondary }]}>per quintal</Text>
                  </View>
                  <View style={styles.priceArrow}>
                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ModernCard>



        {/* Emergency Contacts */}
        <ModernCard style={{ marginBottom: 100 }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F44336' + '15' }]}>
                <Ionicons name="call" size={24} color="#F44336" />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contacts</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>आपातकालीन संपर्क</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.emergencyContainer}>
            <TouchableOpacity style={styles.emergencyCard}>
              <View style={[styles.emergencyIcon, { backgroundColor: '#F44336' + '15' }]}>
                <Ionicons name="call" size={20} color="#F44336" />
              </View>
              <View style={styles.emergencyInfo}>
                <Text style={[styles.emergencyTitle, { color: theme.text }]}>Krishi Vigyan Kendra</Text>
                <Text style={[styles.emergencyNumber, { color: '#F44336' }]}>1551</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.emergencyCard}>
              <View style={[styles.emergencyIcon, { backgroundColor: '#F44336' + '15' }]}>
                <Ionicons name="headset" size={20} color="#F44336" />
              </View>
              <View style={styles.emergencyInfo}>
                <Text style={[styles.emergencyTitle, { color: theme.text }]}>Farmer Helpline</Text>
                <Text style={[styles.emergencyNumber, { color: '#F44336' }]}>18001801551</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ModernCard>
      </ScrollView>

      {/* Custom Crop Actions Modal */}
      <Modal
        visible={showCropActions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCropActions(false)}
      >
        <View style={styles.actionSheetOverlay}>
          <View style={[styles.actionSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.actionSheetHeader}>
              <Text style={[styles.actionSheetTitle, { color: theme.text }]}>
                {selectedCrop?.name} Actions
              </Text>
              <Text style={[styles.actionSheetSubtitle, { color: theme.textSecondary }]}>
                {selectedCrop?.variety} • {selectedCrop?.area} acres
              </Text>
            </View>
            
            <View style={styles.actionSheetButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary + '10' }]}
                onPress={() => {
                  setShowCropActions(false);
                  setTimeout(() => navigation.navigate('AddCrop', { editCrop: selectedCrop }), 100);
                }}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons name="create-outline" size={24} color={theme.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>Edit Crop</Text>
                  <Text style={[styles.actionButtonDesc, { color: theme.textSecondary }]}>
                    Update details and progress
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.success + '10' }]}
                onPress={() => {
                  setShowCropActions(false);
                  updateCropProgress(selectedCrop);
                }}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons name="trending-up-outline" size={24} color={theme.success} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>Update Progress</Text>
                  <Text style={[styles.actionButtonDesc, { color: theme.textSecondary }]}>
                    Move to next growth stage
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF9800' + '10' }]}
                onPress={() => {
                  setShowCropActions(false);
                  markCropHarvested(selectedCrop);
                }}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#FF9800" />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>Mark Harvested</Text>
                  <Text style={[styles.actionButtonDesc, { color: theme.textSecondary }]}>
                    Move to harvested crops
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.error + '10' }]}
                onPress={() => {
                  setShowCropActions(false);
                  confirmRemoveCrop(selectedCrop);
                }}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons name="trash-outline" size={24} color={theme.error} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>Remove Crop</Text>
                  <Text style={[styles.actionButtonDesc, { color: theme.textSecondary }]}>
                    Permanently delete this crop
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setShowCropActions(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    paddingBottom: 80,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherContent: {
    alignItems: 'center',
  },
  weatherLocation: {
    fontSize: 16,
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  weatherDesc: {
    fontSize: 14,
    textTransform: 'capitalize',
    marginBottom: 15,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetailText: {
    fontSize: 12,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modernActionCard: {
    width: (width - 80) / 2,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modernActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  modernActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipSubtitle: {
    fontSize: 13,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTipText: {
    fontSize: 15,
    lineHeight: 22,
  },
  pricesContainer: {
    marginTop: 8,
  },
  modernPriceCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: theme.backgroundSecondary,
    overflow: 'hidden',
  },
  priceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cropIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  priceInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cropPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  priceUnit: {
    fontSize: 12,
  },
  priceArrow: {
    padding: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emergencyContainer: {
    marginTop: 8,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 12,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  emergencyNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  priceInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cropPrice: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 5,
  },
  emergencyButton: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  emergencyText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  aiTipText: {
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 12,
  },
  refreshTipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  refreshTipText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  // Crop Management Styles
  cropManagementCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addCropButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  landInfoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  cropsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cropCard: {
    width: 190,
    marginRight: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cropCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cropNameSection: {
    flex: 1,
    paddingRight: 8,
  },
  cropName: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  cropActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  cropVariety: {
    fontSize: 12,
    marginBottom: 8,
  },
  cropDetails: {
    marginBottom: 8,
  },
  cropDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cropDetailText: {
    fontSize: 11,
    marginLeft: 4,
  },
  cropStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  cropStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addNewCropCard: {
    width: 190,
    marginRight: 12,
    padding: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 140,
  },
  addNewCropText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  availableLandText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyCropsContainer: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 12,
    margin: 16,
  },
  emptyCropsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyCropsSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  addCropPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  addCropPromptText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Action Sheet Styles
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  actionSheetHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 20,
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionSheetSubtitle: {
    fontSize: 14,
  },
  actionSheetButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 16,
  },
  actionButtonDesc: {
    fontSize: 12,
    position: 'absolute',
    left: 56,
    top: 32,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import languageService from '../services/languageService';
import aiService from '../services/aiService';

const SoilAdvisoryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { getFarmerContextForAI } = useFarmer();
  const styles = createStyles(theme);
  const [selectedSoilType, setSelectedSoilType] = useState('');
  const [cropType, setCropType] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(false);

  const soilTypes = [
    { id: 'clay', name: 'Clay Soil', description: 'Heavy soil with good water retention', color: '#8D6E63' },
    { id: 'sandy', name: 'Sandy Soil', description: 'Light soil with good drainage', color: '#FFB74D' },
    { id: 'loamy', name: 'Loamy Soil', description: 'Balanced soil ideal for most crops', color: '#A5D6A7' },
    { id: 'silty', name: 'Silty Soil', description: 'Fine particles with good fertility', color: '#BCAAA4' },
    { id: 'peaty', name: 'Peaty Soil', description: 'Organic-rich acidic soil', color: '#795548' },
    { id: 'chalky', name: 'Chalky Soil', description: 'Alkaline soil with limestone', color: '#E0E0E0' }
  ];

  const getAdviceForSoil = (soilType) => {
    const advice = {
      clay: {
        tips: [
          'Add organic compost to improve drainage',
          'Avoid working when soil is too wet',
          'Plant during dry conditions',
          'Use raised beds for better drainage'
        ],
        suitable_crops: ['Rice', 'Wheat', 'Sugarcane', 'Cotton'],
        ph_range: '6.0 - 7.5',
        fertilizer: 'Use phosphorus-rich fertilizers, avoid over-watering'
      },
      sandy: {
        tips: [
          'Add organic matter to retain moisture',
          'Frequent but light watering needed',
          'Use mulching to prevent water loss',
          'Apply fertilizers more frequently'
        ],
        suitable_crops: ['Carrots', 'Radish', 'Potatoes', 'Groundnut'],
        ph_range: '6.0 - 7.0',
        fertilizer: 'Use slow-release fertilizers, add compost regularly'
      },
      loamy: {
        tips: [
          'Maintain organic matter levels',
          'Regular soil testing recommended',
          'Ideal for most farming practices',
          'Good natural drainage and fertility'
        ],
        suitable_crops: ['Tomatoes', 'Corn', 'Soybeans', 'Most vegetables'],
        ph_range: '6.0 - 7.0',
        fertilizer: 'Balanced NPK fertilizers work well'
      },
      silty: {
        tips: [
          'Improve drainage with organic matter',
          'Avoid compaction from heavy machinery',
          'Good for water retention',
          'Prone to erosion - use cover crops'
        ],
        suitable_crops: ['Wheat', 'Barley', 'Grasses', 'Legumes'],
        ph_range: '6.0 - 7.5',
        fertilizer: 'Regular organic amendments needed'
      },
      peaty: {
        tips: [
          'May need lime to reduce acidity',
          'Excellent for organic farming',
          'Good water retention',
          'Rich in organic nutrients'
        ],
        suitable_crops: ['Blueberries', 'Cranberries', 'Lettuce', 'Brassicas'],
        ph_range: '4.0 - 6.0',
        fertilizer: 'May need pH adjustment, phosphorus supplements'
      },
      chalky: {
        tips: [
          'May need acidifying treatments',
          'Good drainage but can be shallow',
          'Iron deficiency is common',
          'Use organic matter to improve structure'
        ],
        suitable_crops: ['Cabbage', 'Spinach', 'Beets', 'Beans'],
        ph_range: '7.0 - 8.5',
        fertilizer: 'Use acidifying fertilizers, iron supplements'
      }
    };

    return advice[soilType] || null;
  };

  const handleSoilSelection = (soilType) => {
    setSelectedSoilType(soilType);
  };

  const getDetailedAdvice = async () => {
    if (!selectedSoilType) {
      Alert.alert('Selection Required', 'Please select your soil type first');
      return;
    }

    try {
      // Show loading alert
      Alert.alert('Analyzing...', 'Getting personalized soil advisory from AI...');
      
      // Get farmer context for personalized advice
      const farmerContext = getFarmerContextForAI();
      
      let contextInfo = selectedSoilType;
      let location = 'India';
      let farmingDetails = cropType || 'mixed farming';
      
      if (farmerContext.farmer) {
        location = farmerContext.farmer.location || 'India';
        contextInfo += `, Land Size: ${farmerContext.farmer.landSize} acres`;
        if (farmerContext.farmer.experience) {
          contextInfo += `, Experience: ${farmerContext.farmer.experience} years`;
        }
      }
      
      if (farmerContext.activeCrops.length > 0) {
        const cropDetails = farmerContext.activeCrops.map(crop => 
          `${crop.name}${crop.variety ? ` (${crop.variety})` : ''} - ${crop.area} acres`
        ).join(', ');
        farmingDetails = `Current crops: ${cropDetails}`;
      }
      
      // Use enhanced AI service with farmer and weather context
      const aiAdvice = await aiService.analyzeSoil(
        selectedSoilType,
        farmerContext
      );
      
      // Translate to current language if needed
      const translatedAdvice = currentLanguage !== 'en' 
        ? await languageService.translateText(aiAdvice, currentLanguage)
        : aiAdvice;

      // Show AI-generated advice in a scrollable alert
      const soilTypeTitle = selectedSoilType && typeof selectedSoilType === 'string' 
        ? selectedSoilType.charAt(0).toUpperCase() + selectedSoilType.slice(1)
        : 'Unknown';
      
      Alert.alert(
        `${soilTypeTitle} Soil Analysis - AI Powered`,
        translatedAdvice,
        [{ text: 'OK' }],
        { scrollable: true }
      );
    } catch (error) {
      console.error('Soil analysis error:', error);
      
      // Fallback to basic advice
      const advice = getAdviceForSoil(selectedSoilType);
      if (advice) {
        const soilTypeTitle = selectedSoilType && typeof selectedSoilType === 'string' 
          ? selectedSoilType.charAt(0).toUpperCase() + selectedSoilType.slice(1)
          : 'Unknown';
          
        Alert.alert(
          `${soilTypeTitle} Soil Advisory`,
          `Suitable Crops: ${advice.suitable_crops.join(', ')}\n\nPH Range: ${advice.ph_range}\n\nFertilizer: ${advice.fertilizer}\n\nTips:\n${advice.tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}`
        );
      }
    }
  };

  const getAICropRecommendations = async () => {
    if (!selectedSoilType) {
      Alert.alert('Selection Required', 'Please select your soil type first');
      return;
    }

    setLoading(true);
    try {
      const recommendations = await aiService.getCropRecommendations(
        selectedSoilType,
        'India', // Default location
        'Current Season', // You can make this dynamic
        '1-5 acres', // Default farm size
        'Medium Budget'
      );
      
      // Translate to current language if needed
      const translatedRecommendations = currentLanguage !== 'en' 
        ? await languageService.translateText(recommendations, currentLanguage)
        : recommendations;

      Alert.alert(
        '🌱 AI Crop Recommendations',
        translatedRecommendations,
        [{ text: 'OK' }],
        { scrollable: true }
      );
    } catch (error) {
      console.error('Crop recommendation error:', error);
      Alert.alert('Error', 'Unable to get crop recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Back Button */}
      <LinearGradient
        colors={theme.gradientPrimary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>🌱 Soil Advisory</Text>
            <Text style={styles.headerSubtitle}>Get personalized soil recommendations</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

      {/* Language Selector */}
      <View style={styles.section}>
        <LinearGradient
          colors={theme.gradientSecondary}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.sectionTitle}>Select Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(languageService.getAllLanguages()).slice(0, 6).map(([code, lang]) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.languageButton,
                currentLanguage === code && styles.activeLanguageButton
              ]}
              onPress={() => setCurrentLanguage(code)}
            >
              <Text style={[
                styles.languageText,
                currentLanguage === code && styles.activeLanguageText
              ]}>
                {lang.nativeName}
              </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Soil Type Selection */}
      <View style={styles.section}>
        <LinearGradient
          colors={theme.gradientSecondary}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.sectionTitle}>Select Your Soil Type</Text>
          <Text style={styles.sectionSubtitle}>Choose the soil type that best matches your farm</Text>
        
        <View style={styles.soilGrid}>
          {soilTypes.map((soil) => (
            <TouchableOpacity
              key={soil.id}
              style={[
                styles.soilCard,
                selectedSoilType === soil.id && styles.selectedSoilCard
              ]}
              onPress={() => handleSoilSelection(soil.id)}
            >
              <View style={[styles.soilColorIndicator, { backgroundColor: soil.color }]} />
              <Text style={styles.soilName}>{languageService.t(soil.name, currentLanguage)}</Text>
              <Text style={styles.soilDescription}>{soil.description}</Text>
              {selectedSoilType === soil.id && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.selectedIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        </LinearGradient>
      </View>

      {/* Crop Type Input */}
      <View style={styles.section}>
        <LinearGradient
          colors={theme.gradientSecondary}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.sectionTitle}>Crop Information (Optional)</Text>
        <TextInput
          style={styles.cropInput}
          placeholder="Enter your crop type (e.g., Rice, Wheat, Vegetables)"
          value={cropType}
          onChangeText={setCropType}
        />
        </LinearGradient>
      </View>

      {/* Quick Soil Tips */}
      <View style={styles.section}>
        <LinearGradient
          colors={theme.gradientSecondary}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.sectionTitle}>Quick Soil Health Tips</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tipCard}>
            <Ionicons name="water" size={24} color="#2196F3" />
            <Text style={styles.tipTitle}>pH Testing</Text>
            <Text style={styles.tipText}>Test soil pH every 6 months for optimal crop growth</Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="leaf" size={24} color="#4CAF50" />
            <Text style={styles.tipTitle}>Organic Matter</Text>
            <Text style={styles.tipText}>Add compost regularly to improve soil structure</Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="nutrition" size={24} color="#FF9800" />
            <Text style={styles.tipTitle}>Nutrients</Text>
            <Text style={styles.tipText}>Monitor NPK levels and supplement as needed</Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="bug" size={24} color="#F44336" />
            <Text style={styles.tipTitle}>Soil Health</Text>
            <Text style={styles.tipText}>Look for earthworms - they indicate healthy soil</Text>
          </View>
        </View>
        </LinearGradient>
      </View>

      {/* AI Advisory Buttons */}
      <TouchableOpacity 
        style={[styles.adviceButton, { backgroundColor: '#4CAF50' }]} 
        onPress={getDetailedAdvice}
        disabled={loading}
      >
        <Ionicons name="bulb" size={24} color="#fff" />
        <Text style={styles.adviceButtonText}>
          {loading ? 'Analyzing...' : 'Get AI Soil Analysis'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.adviceButton, { backgroundColor: '#2196F3', marginTop: 12 }]} 
        onPress={getAICropRecommendations}
        disabled={loading}
      >
        <Ionicons name="leaf" size={24} color="#fff" />
        <Text style={styles.adviceButtonText}>
          {loading ? 'Loading...' : 'Get AI Crop Recommendations'}
        </Text>
      </TouchableOpacity>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Agricultural Extension Contacts</Text>
          <TouchableOpacity style={[styles.contactCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="call" size={20} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.text }]}>Soil Testing Lab: 1800-425-1551</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="location" size={20} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.text }]}>Find Nearest Krishi Vigyan Kendra</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeLanguageButton: {
    backgroundColor: theme.primary,
  },
  languageText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  activeLanguageText: {
    color: theme.textOnPrimary,
  },
  soilGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  soilCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedSoilCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  soilColorIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
  },
  soilName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  soilDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  selectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cropInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: theme.surface,
    color: theme.text,
    marginTop: 10,
  },
  tipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tipCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
  },
  adviceButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  adviceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contactsSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});

export default SoilAdvisoryScreen;
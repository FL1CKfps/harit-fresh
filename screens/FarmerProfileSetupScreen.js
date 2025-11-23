import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import aiService from '../services/aiService';
import marketService from '../services/marketService';

const FarmerProfileSetupScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    landSize: '',
    soilType: '',
    location: '',
    experience: '',
    // Additional comprehensive fields
    state: '',
    district: '',
    village: '',
    pincode: '',
    farmingMethod: '', // Organic, Traditional, Hybrid
    irrigationType: '', // Drip, Sprinkler, Flood, Rain-fed
    primaryCrops: [], // Array of crop names
    livestockCount: '',
    farmEquipment: [], // Array of equipment
    annualIncome: '',
    waterSource: '', // Borewell, Canal, River, Pond
    soilPH: '',
    farmCertifications: [], // Organic, Fair Trade, etc.
  });
  
  const [soilImage, setSoilImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSoilTypes, setShowSoilTypes] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Location data states
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableVillages, setAvailableVillages] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [villagesLoading, setVillagesLoading] = useState(false);

  // Modal states
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showFarmingMethodModal, setShowFarmingMethodModal] = useState(false);
  const [showIrrigationModal, setShowIrrigationModal] = useState(false);
  const [showWaterSourceModal, setShowWaterSourceModal] = useState(false);
  const [showCertificationsModal, setShowCertificationsModal] = useState(false);

  // Load states on component mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (formData.state) {
      loadDistricts(formData.state);
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.state]);

  const soilTypes = [
    { id: 'clay', name: 'Clay Soil', description: 'Heavy, water-retaining soil' },
    { id: 'sandy', name: 'Sandy Soil', description: 'Light, well-draining soil' },
    { id: 'loamy', name: 'Loamy Soil', description: 'Balanced, fertile soil' },
    { id: 'silty', name: 'Silty Soil', description: 'Fine particles, good fertility' },
    { id: 'peaty', name: 'Peaty Soil', description: 'Organic-rich, acidic soil' },
    { id: 'chalky', name: 'Chalky Soil', description: 'Alkaline soil with limestone' },
  ];

  const farmingMethods = ['Organic', 'Traditional', 'Hybrid', 'Natural', 'Integrated'];
  const irrigationTypes = ['Drip Irrigation', 'Sprinkler', 'Flood Irrigation', 'Rain-fed', 'Canal Irrigation'];
  const waterSources = ['Borewell', 'Canal', 'River', 'Pond', 'Rainwater Harvesting'];
  const commonCrops = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Soybean', 'Pulses', 'Vegetables', 'Fruits'];
  const farmEquipments = ['Tractor', 'Harvester', 'Plough', 'Cultivator', 'Thresher', 'Irrigation Pump', 'Sprayer'];
  const certificationTypes = ['Organic Certification', 'Fair Trade', 'ISO Certification', 'Good Agricultural Practices (GAP)', 'None'];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Load states from API
  const loadStates = async () => {
    try {
      setStatesLoading(true);
      const states = await marketService.getStates();
      setAvailableStates(states);
    } catch (error) {
      console.error('Error loading states:', error);
      Alert.alert('Error', 'Failed to load states. Please try again.');
      // Fallback to hardcoded states
      setAvailableStates([
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
        'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
        'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
      ]);
    } finally {
      setStatesLoading(false);
    }
  };

  // Load districts for selected state
  const loadDistricts = async (stateName) => {
    try {
      setDistrictsLoading(true);
      const districts = await marketService.getDistricts(stateName);
      setAvailableDistricts(districts);
    } catch (error) {
      console.error('Error loading districts:', error);
      Alert.alert('Error', 'Failed to load districts. Please try again.');
      setAvailableDistricts([]);
    } finally {
      setDistrictsLoading(false);
    }
  };

  // Handle state selection from modal
  const selectState = (state) => {
    updateFormData('state', state);
    updateFormData('district', ''); // Reset district when state changes
    updateFormData('village', ''); // Reset village when state changes
    setShowStateModal(false);
  };

  // Handle district selection from modal
  const selectDistrict = (district) => {
    updateFormData('district', district);
    updateFormData('village', ''); // Reset village when district changes
    setShowDistrictModal(false);
  };

  const takeSoilPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take soil photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSoilImage(result.assets[0]);
        await analyzeSoilImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Camera error:', error);
    }
  };

  const pickSoilImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSoilImage(result.assets[0]);
        await analyzeSoilImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  // Helper function to convert image to base64
  const convertImageToBase64 = async (imageUri) => {
    try {
      if (!imageUri || typeof imageUri !== 'string') {
        throw new Error('Invalid image URI provided');
      }

      console.log('Converting image to base64, URI:', imageUri);
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const result = reader.result;
            if (!result || typeof result !== 'string') {
              throw new Error('Invalid FileReader result');
            }

            const base64Parts = result.split(',');
            if (base64Parts.length < 2) {
              throw new Error('Invalid base64 format');
            }

            const base64 = base64Parts[1]; // Remove data:image/jpeg;base64, prefix
            if (!base64 || base64.length === 0) {
              throw new Error('Empty base64 data');
            }

            console.log('Successfully converted image to base64, length:', base64.length);
            resolve(base64);
          } catch (processingError) {
            reject(processingError);
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image conversion error:', error);
      throw new Error('Failed to convert image for analysis');
    }
  };

  const analyzeSoilImage = async (imageAsset) => {
    setIsAnalyzing(true);
    try {
      console.log('Converting image to base64...');
      const imageBase64 = await convertImageToBase64(imageAsset.uri);
      
      console.log('Sending image to AI for analysis...');
      const analysis = await aiService.analyzeSoilImage(imageBase64);
      
      console.log('Raw AI analysis response:', analysis);
      
      // Parse the AI response to extract soil type with better error handling
      let detectedSoilType = 'Unknown';
      if (analysis && typeof analysis === 'string' && analysis.length > 0) {
        try {
          const lines = analysis.split('\n').filter(line => line && line.trim().length > 0);
          const soilTypeLine = lines.find(line => line && line.includes && line.includes('SOIL TYPE'));
          if (soilTypeLine) {
            const soilTypeMatch = soilTypeLine.split(':');
            if (soilTypeMatch.length > 1) {
              detectedSoilType = soilTypeMatch[1].trim();
            }
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          detectedSoilType = 'Unknown';
        }
      } else {
        console.warn('Invalid or empty AI analysis response:', analysis);
      }

      // Find matching soil type from our list with better error handling
      let matchingSoilType = null;
      if (detectedSoilType && detectedSoilType !== 'Unknown') {
        try {
          matchingSoilType = soilTypes.find(soil => 
            (soil.name && detectedSoilType && 
             (soil.name.toLowerCase().includes(detectedSoilType.toLowerCase()) ||
              detectedSoilType.toLowerCase().includes(soil.name.toLowerCase())))
          );
        } catch (matchError) {
          console.error('Error matching soil type:', matchError);
        }
      }

      const finalSoilType = matchingSoilType ? matchingSoilType.name : detectedSoilType;
      updateFormData('soilType', finalSoilType);
      
      Alert.alert(
        'AI Soil Analysis Complete',
        `Based on the image analysis, your soil type appears to be: ${finalSoilType}\n\nFull Analysis:\n${analysis}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Soil analysis error:', error);
      Alert.alert(
        'Analysis Failed', 
        'Could not analyze soil image with AI. Please select soil type manually or try again with a clearer image.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.name.trim() && formData.phone.trim();
      case 2:
        return formData.landSize.trim() && formData.location.trim() && formData.state.trim() && formData.district.trim() && formData.village.trim();
      case 3:
        return formData.soilType.trim();
      case 4:
        // Step 4 is optional - farming methods and resources
        return true;
      case 5:
        // Step 5 would be additional validation if needed
        return true;
      case 6:
        // Step 6 is optional - crops and equipment
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      Alert.alert('Incomplete Information', 'Please fill in all required fields before continuing.');
    }
  };

  const handleSubmit = async () => {
    try {
      const farmerProfile = {
        ...formData,
        profileImage: soilImage ? soilImage.uri : null,
        createdAt: new Date().toISOString(),
      };

      // Save to AsyncStorage (prepare for Firebase integration)
      await AsyncStorage.setItem('farmerProfile', JSON.stringify(farmerProfile));
      await AsyncStorage.setItem('onboardingComplete', 'true');

      console.log('Farmer profile saved:', farmerProfile);
      
      // Show success message - App.js will handle navigation automatically
      Alert.alert(
        'Profile Completed! 🎉',
        'Welcome to Krishta AI! Your farming assistant is ready to help you grow better crops.',
        [
          {
            text: 'Start Farming',
            onPress: () => {
              // The App.js will detect onboardingComplete and switch to main app
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving farmer profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.textSecondary}
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', text)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Farming Experience (Years)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Years of farming experience"
                placeholderTextColor={theme.textSecondary}
                value={formData.experience}
                onChangeText={(text) => updateFormData('experience', text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Land & Location Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Land Size (Acres) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Enter land size in acres"
                placeholderTextColor={theme.textSecondary}
                value={formData.landSize}
                onChangeText={(text) => updateFormData('landSize', text)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>State *</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  if (statesLoading) return;
                  if (availableStates.length === 0) {
                    Alert.alert('Loading', 'Please wait while we load the states...');
                    return;
                  }
                  setShowStateModal(true);
                }}
                disabled={statesLoading}
              >
                {statesLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <Text style={[styles.dropdownText, { color: formData.state ? theme.text : theme.textSecondary }]}>
                      {formData.state || 'Select State'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>District *</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  if (!formData.state) {
                    Alert.alert('Select State First', 'Please select your state before choosing a district.');
                    return;
                  }
                  if (districtsLoading) {
                    Alert.alert('Loading', 'Please wait while we load the districts...');
                    return;
                  }
                  if (availableDistricts.length === 0) {
                    Alert.alert('No Districts', 'No districts available for the selected state.');
                    return;
                  }
                  setShowDistrictModal(true);
                }}
                disabled={!formData.state || districtsLoading}
              >
                {districtsLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <Text style={[styles.dropdownText, { color: formData.district ? theme.text : theme.textSecondary }]}>
                      {formData.district || 'Select District'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Village/Town *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Enter your village or town"
                placeholderTextColor={theme.textSecondary}
                value={formData.village}
                onChangeText={(text) => updateFormData('village', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Location/Village *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Village/City, State"
                placeholderTextColor={theme.textSecondary}
                value={formData.location}
                onChangeText={(text) => updateFormData('location', text)}
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Soil Information</Text>
            
            {formData.soilType ? (
              <View style={[styles.selectedSoilCard, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                <View style={styles.selectedSoilInfo}>
                  <Text style={[styles.selectedSoilType, { color: theme.primary }]}>
                    Selected: {formData.soilType}
                  </Text>
                  <TouchableOpacity onPress={() => updateFormData('soilType', '')}>
                    <Text style={[styles.changeSoilText, { color: theme.textSecondary }]}>
                      Tap to change
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Choose your soil type or take a photo for AI analysis:
              </Text>
            )}

            <View style={styles.soilOptionsContainer}>
              <TouchableOpacity 
                style={[styles.photoOption, { backgroundColor: theme.primary }]}
                onPress={takeSoilPhoto}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                )}
                <Text style={styles.photoOptionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.photoOption, { backgroundColor: theme.secondary || theme.primary }]}
                onPress={pickSoilImage}
                disabled={isAnalyzing}
              >
                <Ionicons name="image" size={24} color="#FFFFFF" />
                <Text style={styles.photoOptionText}>Pick Image</Text>
              </TouchableOpacity>
            </View>

            {soilImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: soilImage.uri }} style={styles.soilImagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setSoilImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.manualSelectButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowSoilTypes(true)}
            >
              <Text style={[styles.manualSelectText, { color: theme.text }]}>
                Select Manually
              </Text>
              <Ionicons name="list" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Farming Methods & Resources</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Farming Method</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowFarmingMethodModal(true)}
              >
                <Text style={[styles.dropdownText, { color: formData.farmingMethod ? theme.text : theme.textSecondary }]}>
                  {formData.farmingMethod || 'Select Farming Method'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Irrigation Type</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowIrrigationModal(true)}
              >
                <Text style={[styles.dropdownText, { color: formData.irrigationType ? theme.text : theme.textSecondary }]}>
                  {formData.irrigationType || 'Select Irrigation Type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Water Source</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowWaterSourceModal(true)}
              >
                <Text style={[styles.dropdownText, { color: formData.waterSource ? theme.text : theme.textSecondary }]}>
                  {formData.waterSource || 'Select Water Source'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Livestock Count</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Number of livestock (cattle, goats, etc.)"
                placeholderTextColor={theme.textSecondary}
                value={formData.livestockCount}
                onChangeText={(text) => updateFormData('livestockCount', text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Additional Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Annual Income (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Your approximate annual farming income"
                placeholderTextColor={theme.textSecondary}
                value={formData.annualIncome}
                onChangeText={(text) => updateFormData('annualIncome', text)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Farm Certifications</Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Select any certifications your farm has
              </Text>
              <View style={styles.chipContainer}>
                {certificationTypes.map((cert) => (
                  <TouchableOpacity
                    key={cert}
                    style={[
                      styles.cropChip,
                      {
                        backgroundColor: formData.farmCertifications.includes(cert) ? theme.primary : theme.surface,
                        borderColor: formData.farmCertifications.includes(cert) ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => {
                      const currentCerts = [...formData.farmCertifications];
                      if (currentCerts.includes(cert)) {
                        updateFormData('farmCertifications', currentCerts.filter(c => c !== cert));
                      } else {
                        updateFormData('farmCertifications', [...currentCerts, cert]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.cropChipText,
                      { color: formData.farmCertifications.includes(cert) ? '#FFFFFF' : theme.text }
                    ]}>
                      {cert}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Crops & Equipment</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Primary Crops You Grow</Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Select the main crops you typically grow (tap to add/remove)
              </Text>
              <View style={styles.chipContainer}>
                {commonCrops.map((crop) => (
                  <TouchableOpacity
                    key={crop}
                    style={[
                      styles.cropChip,
                      {
                        backgroundColor: formData.primaryCrops.includes(crop) ? theme.primary : theme.surface,
                        borderColor: formData.primaryCrops.includes(crop) ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => {
                      const currentCrops = [...formData.primaryCrops];
                      if (currentCrops.includes(crop)) {
                        updateFormData('primaryCrops', currentCrops.filter(c => c !== crop));
                      } else {
                        updateFormData('primaryCrops', [...currentCrops, crop]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.cropChipText,
                      { color: formData.primaryCrops.includes(crop) ? '#FFFFFF' : theme.text }
                    ]}>
                      {crop}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Farm Equipment</Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Select equipment you own or have access to
              </Text>
              <View style={styles.chipContainer}>
                {farmEquipments.map((equipment) => (
                  <TouchableOpacity
                    key={equipment}
                    style={[
                      styles.cropChip,
                      {
                        backgroundColor: formData.farmEquipment.includes(equipment) ? theme.primary : theme.surface,
                        borderColor: formData.farmEquipment.includes(equipment) ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => {
                      const currentEquipment = [...formData.farmEquipment];
                      if (currentEquipment.includes(equipment)) {
                        updateFormData('farmEquipment', currentEquipment.filter(e => e !== equipment));
                      } else {
                        updateFormData('farmEquipment', [...currentEquipment, equipment]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.cropChipText,
                      { color: formData.farmEquipment.includes(equipment) ? '#FFFFFF' : theme.text }
                    ]}>
                      {equipment}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Soil pH (if known)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="e.g., 6.5 (optional)"
                placeholderTextColor={theme.textSecondary}
                value={formData.soilPH}
                onChangeText={(text) => updateFormData('soilPH', text)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradientPrimary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Setup Your Profile</Text>
          <Text style={styles.stepIndicator}>Step {currentStep} of {totalSteps}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: '#FFFFFF',
                  width: `${(currentStep / totalSteps) * 100}%`
                }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.bottomSection}>
        {currentStep > 1 && (
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
            <Text style={[styles.backButtonText, { color: theme.text }]}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.nextButton, 
            { 
              backgroundColor: validateStep(currentStep) ? theme.primary : theme.textSecondary,
              flex: currentStep > 1 ? 1 : undefined,
              marginLeft: currentStep > 1 ? 12 : 0
            }
          ]}
          onPress={handleNext}
          disabled={!validateStep(currentStep)}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
          </Text>
          <Ionicons 
            name={currentStep === totalSteps ? 'checkmark' : 'arrow-forward'} 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Soil Types Modal */}
      <Modal
        visible={showSoilTypes}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Soil Type</Text>
            <TouchableOpacity onPress={() => setShowSoilTypes(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {soilTypes.map((soil) => (
              <TouchableOpacity
                key={soil.id}
                style={[styles.soilTypeItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  updateFormData('soilType', soil.name);
                  setShowSoilTypes(false);
                }}
              >
                <View>
                  <Text style={[styles.soilTypeName, { color: theme.text }]}>{soil.name}</Text>
                  <Text style={[styles.soilTypeDescription, { color: theme.textSecondary }]}>
                    {soil.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* State Selection Modal */}
      <Modal
        visible={showStateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select State</Text>
            <TouchableOpacity onPress={() => setShowStateModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableStates}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.selectorItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                onPress={() => {
                  updateFormData('state', item);
                  updateFormData('district', ''); // Reset district when state changes
                  updateFormData('village', ''); // Reset village when state changes
                  setShowStateModal(false);
                }}
              >
                <Text style={[styles.selectorText, { color: theme.text }]}>{item}</Text>
                {formData.state === item && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select District</Text>
            <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableDistricts}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.selectorItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                onPress={() => {
                  updateFormData('district', item);
                  updateFormData('village', ''); // Reset village when district changes
                  setShowDistrictModal(false);
                }}
              >
                <Text style={[styles.selectorText, { color: theme.text }]}>{item}</Text>
                {formData.district === item && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Farming Method Selection Modal */}
      <Modal
        visible={showFarmingMethodModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Farming Method</Text>
            <TouchableOpacity onPress={() => setShowFarmingMethodModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={farmingMethods}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.selectorItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                onPress={() => {
                  updateFormData('farmingMethod', item);
                  setShowFarmingMethodModal(false);
                }}
              >
                <Text style={[styles.selectorText, { color: theme.text }]}>{item}</Text>
                {formData.farmingMethod === item && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Irrigation Type Selection Modal */}
      <Modal
        visible={showIrrigationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Irrigation Type</Text>
            <TouchableOpacity onPress={() => setShowIrrigationModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={irrigationTypes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.selectorItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                onPress={() => {
                  updateFormData('irrigationType', item);
                  setShowIrrigationModal(false);
                }}
              >
                <Text style={[styles.selectorText, { color: theme.text }]}>{item}</Text>
                {formData.irrigationType === item && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Water Source Selection Modal */}
      <Modal
        visible={showWaterSourceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Water Source</Text>
            <TouchableOpacity onPress={() => setShowWaterSourceModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={waterSources}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.selectorItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                onPress={() => {
                  updateFormData('waterSource', item);
                  setShowWaterSourceModal(false);
                }}
              >
                <Text style={[styles.selectorText, { color: theme.text }]}>{item}</Text>
                {formData.waterSource === item && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 15,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  selectedSoilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
  },
  selectedSoilInfo: {
    marginLeft: 12,
    flex: 1,
  },
  selectedSoilType: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeSoilText: {
    fontSize: 12,
    marginTop: 2,
  },
  soilOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  photoOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  photoOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  soilImagePreview: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  manualSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  manualSelectText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  soilTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  soilTypeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  soilTypeDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  // New styles for comprehensive onboarding
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 50,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  cropChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 2,
  },
  cropChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  selectedSelectorItem: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '10',
  },
  selectorText: {
    fontSize: 16,
    color: theme.text,
  },
  selectedSelectorText: {
    color: theme.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: theme.textSecondary,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  noDataText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});

export default FarmerProfileSetupScreen;
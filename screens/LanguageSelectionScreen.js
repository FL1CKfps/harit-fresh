import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const LanguageSelectionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const indianLanguages = [
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'en', name: 'English', native: 'English' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
    { code: 'mai', name: 'Maithili', native: 'मैथिली' },
    { code: 'mag', name: 'Magahi', native: 'मगही' },
    { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी' },
    { code: 'sa', name: 'Sanskrit', native: 'संस्कृत' },
    { code: 'ne', name: 'Nepali', native: 'नेपाली' },
    { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
    { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্' },
    { code: 'sd', name: 'Sindhi', native: 'सिन्धी' },
    { code: 'doi', name: 'Dogri', native: 'डोगरी' },
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.name);
  };

  const handleContinue = async () => {
    if (!selectedLanguage) {
      Alert.alert('Language Required', 'Please select your preferred language to continue.');
      return;
    }

    try {
      // Find the selected language object
      const selectedLangObj = indianLanguages.find(lang => lang.name === selectedLanguage);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('userLanguage', JSON.stringify({
        code: selectedLangObj.code,
        name: selectedLangObj.name,
        native: selectedLangObj.native,
      }));

      console.log('Language saved:', selectedLanguage);
      
      // Navigate to farmer profile setup
      navigation.navigate('FarmerProfileSetup');
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert('Error', 'Failed to save language preference. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradientPrimary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Choose Your Language</Text>
          <Text style={styles.headerSubtitle}>अपनी भाषा चुनें</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Select your preferred language for the app:
        </Text>

        <View style={styles.languageGrid}>
          {indianLanguages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                {
                  backgroundColor: selectedLanguage === language.name ? theme.primary : theme.surface,
                  borderColor: selectedLanguage === language.name ? theme.primary : theme.border,
                }
              ]}
              onPress={() => handleLanguageSelect(language)}
            >
              <View style={styles.languageCardContent}>
                <Text 
                  style={[
                    styles.languageName,
                    { color: selectedLanguage === language.name ? theme.textOnPrimary : theme.text }
                  ]}
                >
                  {language.name}
                </Text>
                <Text 
                  style={[
                    styles.languageNative,
                    { color: selectedLanguage === language.name ? theme.textOnPrimary : theme.textSecondary }
                  ]}
                >
                  {language.native}
                </Text>
                {selectedLanguage === language.name && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.textOnPrimary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>Language Support</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Your selected language will be used throughout the app for AI responses, 
              voice assistance, and interface elements.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[styles.continueButton, { backgroundColor: theme.primary }]} 
          onPress={handleContinue}
        >
          <Text style={[styles.continueButtonText, { color: theme.textOnPrimary }]}>
            Continue with {selectedLanguage}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={theme.textOnPrimary} />
        </TouchableOpacity>
      </View>
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
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  languageCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageCardContent: {
    padding: 16,
    alignItems: 'center',
    minHeight: 70,
    justifyContent: 'center',
    position: 'relative',
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  languageNative: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bottomSection: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default LanguageSelectionScreen;
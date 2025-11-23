import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { farmerProfile, activeCrops, getFarmerContextForAI } = useFarmer();
  const [notifications, setNotifications] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  
  // Get farmer context for stats
  const farmerContext = getFarmerContextForAI();

  const languages = [
    'English'
  ];

  const handleLanguageSelect = () => {
    Alert.alert(
      'Language Selection',
      'Choose your preferred language',
      languages.map(lang => ({
        text: lang,
        onPress: () => {
          setCurrentLanguage(lang);
          Alert.alert('Language Updated', `Language changed to ${lang}`);
        }
      }))
    );
  };

  const showFeedbackAlert = () => {
    Alert.alert(
      'Give Feedback',
      'Help us improve Krishta AI! How would you rate your experience?',
      [
        { text: '⭐ Poor', onPress: () => submitFeedback(1) },
        { text: '⭐⭐ Fair', onPress: () => submitFeedback(2) },
        { text: '⭐⭐⭐ Good', onPress: () => submitFeedback(3) },
        { text: '⭐⭐⭐⭐ Great', onPress: () => submitFeedback(4) },
        { text: '⭐⭐⭐⭐⭐ Excellent', onPress: () => submitFeedback(5) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const submitFeedback = (rating) => {
    Alert.alert(
      'Thank You!',
      `Thank you for rating us ${rating} stars! Your feedback helps us improve Krishta AI for all farmers.`,
      [{ text: 'OK' }]
    );
  };

  const profileOptions = [
    {
      title: 'Personal Information',
      subtitle: 'व्यक्तिगत जानकारी',
      icon: 'person-outline',
      onPress: () => Alert.alert('Feature', 'Personal information settings coming soon!')
    },
    {
      title: 'Farm Details',
      subtitle: 'खेत का विवरण',
      icon: 'leaf-outline',
      onPress: () => Alert.alert('Feature', 'Farm details settings coming soon!')
    },
    {
      title: 'Location Settings',
      subtitle: 'स्थान सेटिंग्स',
      icon: 'location-outline',
      onPress: () => Alert.alert('Feature', 'Location settings coming soon!')
    },
    {
      title: 'Give Feedback',
      subtitle: 'प्रतिक्रिया दें',
      icon: 'star-outline',
      onPress: () => navigation?.navigate ? navigation.navigate('Feedback') : showFeedbackAlert()
    },
    {
      title: 'Help & Support',
      subtitle: 'सहायता और समर्थन',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Help', 'For support, call: 18001801551')
    },
    {
      title: 'About Krishta AI',
      subtitle: 'हरित के बारे में',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('About Krishta AI', 'Krishta AI v1.0.0\nYour AI Farming Assistant\nDeveloped for Indian Farmers')
    }
  ];

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Modern Header */}
      <LinearGradient
        colors={theme.gradientPrimary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Modern Profile Header Card */}
        <ModernCard gradient elevation={8} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[theme.primary, theme.primaryLight]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person" size={50} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {farmerProfile?.name || 'Welcome Farmer'}
              </Text>
              <Text style={[styles.profileLocation, { color: theme.textSecondary }]}>
                {farmerProfile?.location ? `${farmerProfile.location}, ${farmerProfile.district}` : 'Set up your farm location'}
              </Text>
              <View style={styles.profileBadge}>
                <Ionicons name="leaf" size={12} color={theme.primary} />
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {farmerProfile?.experience ? `${farmerProfile.experience} years` : 'New Farmer'}
                </Text>
              </View>
            </View>
          </View>
          
          <ModernButton
            title={farmerProfile?.name ? 'Manage Farm' : 'Setup Profile'}
            icon={farmerProfile?.name ? 'settings' : 'person-add'}
            fullWidth
            onPress={() => {
              if (farmerProfile?.name) {
                navigation.navigate('Home', { screen: 'CropManagement' });
              } else {
                navigation.navigate('FarmerProfileSetup');
              }
            }}
          />
        </ModernCard>

      {/* Modern Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="map" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.statNumber, { color: theme.text }]}>{farmerProfile?.landSize || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Land</Text>
          <Text style={[styles.statUnit, { color: theme.textSecondary }]}>acres</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#4CAF50' + '15' }]}>
            <Ionicons name="leaf" size={24} color="#4CAF50" />
          </View>
          <Text style={[styles.statNumber, { color: theme.text }]}>{activeCrops?.length || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Crops</Text>
          <Text style={[styles.statUnit, { color: theme.textSecondary }]}>active</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FF9800' + '15' }]}>
            <Ionicons name="time" size={24} color="#FF9800" />
          </View>
          <Text style={[styles.statNumber, { color: theme.text }]}>{farmerProfile?.experience || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Experience</Text>
          <Text style={[styles.statUnit, { color: theme.textSecondary }]}>years</Text>
        </View>
      </View>

      {/* Active Crops Section */}
      {activeCrops && activeCrops.length > 0 && (
        <ModernCard>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                <Ionicons name="leaf" size={24} color="#4CAF50" />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Crops</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>आपकी सक्रिय फसलें</Text>
              </View>
            </View>
          </View>
          
          {activeCrops.map((crop, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.modernCropItem}
              onPress={() => navigation.navigate('Home', { screen: 'CropManagement' })}
            >
              <View style={[styles.cropIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                <Ionicons name="leaf" size={20} color="#4CAF50" />
              </View>
              <View style={styles.cropInfo}>
                <Text style={[styles.cropName, { color: theme.text }]}>{crop.name}</Text>
                <Text style={[styles.cropDetails, { color: theme.textSecondary }]}>
                  {crop.areaAllocated} acres • {crop.growthStage}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </ModernCard>
      )}

      {/* Settings Section */}
      <ModernCard>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="settings" size={24} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
            </View>
          </View>
        </View>
        
        {/* Language Setting */}
        <TouchableOpacity style={styles.modernSettingItem} onPress={handleLanguageSelect}>
          <View style={[styles.settingIcon, { backgroundColor: '#2196F3' + '15' }]}>
            <Ionicons name="language" size={20} color="#2196F3" />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Language</Text>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{currentLanguage}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Notifications */}
        <View style={styles.modernSettingItem}>
          <View style={[styles.settingIcon, { backgroundColor: '#FF9800' + '15' }]}>
            <Ionicons name="notifications" size={20} color="#FF9800" />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Notifications</Text>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>अधिसूचनाएं</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: theme.primary }}
            thumbColor={notifications ? '#fff' : '#f4f3f4'}
          />
        </View>
      </ModernCard>

      {/* Profile Options */}
      <View style={styles.section}>
        <LinearGradient
          colors={theme.gradientSecondary}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.sectionTitle}>Account - खाता</Text>
        {profileOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.optionItem} 
            onPress={option.onPress}
          >
            <Ionicons name={option.icon} size={24} color="#4CAF50" />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
        </LinearGradient>
      </View>

      {/* Emergency Contacts */}
      <ModernCard>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F44336' + '15' }]}>
              <Ionicons name="call" size={24} color="#F44336" />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contacts</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.modernEmergencyItem}>
          <View style={[styles.emergencyIcon, { backgroundColor: '#4CAF50' + '15' }]}>
            <Ionicons name="call" size={20} color="#4CAF50" />
          </View>
          <View style={styles.emergencyContent}>
            <Text style={[styles.emergencyTitle, { color: theme.text }]}>Farmer Helpline</Text>
            <Text style={[styles.emergencySubtitle, { color: theme.textSecondary }]}>24/7 Support</Text>
          </View>
          <View style={styles.emergencyNumber}>
            <Text style={[styles.emergencyNumberText, { color: '#4CAF50' }]}>1800-180-1551</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modernEmergencyItem}>
          <View style={[styles.emergencyIcon, { backgroundColor: '#2196F3' + '15' }]}>
            <Ionicons name="school" size={20} color="#2196F3" />
          </View>
          <View style={styles.emergencyContent}>
            <Text style={[styles.emergencyTitle, { color: theme.text }]}>Krishi Vigyan Kendra</Text>
            <Text style={[styles.emergencySubtitle, { color: theme.textSecondary }]}>Agricultural Extension</Text>
          </View>
          <View style={styles.emergencyNumber}>
            <Text style={[styles.emergencyNumberText, { color: '#2196F3' }]}>1551</Text>
          </View>
        </TouchableOpacity>
      </ModernCard>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Krishta AI v1.0.0</Text>
        <Text style={styles.appDescription}>
          Made with ❤️ for Indian Farmers
          {'\n'}
          भारतीय किसानों के लिए ❤️ के साथ बनाया गया
        </Text>
      </View>
      </ScrollView>
    </View>
  );
};

// Convert to function to use theme
const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    paddingBottom: 80,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  backButton: {
    padding: 4,
  },
  settingsButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  // Modern Profile Card Styles
  profileCard: {
    marginTop: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    marginBottom: 8,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
  },
  section: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  sectionGradient: {
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  emergencyText: {
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
  },
  emergencyNumber: {
    fontSize: 16,
    color: theme.error,
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  appVersion: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  appDescription: {
    fontSize: 12,
    color: theme.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  cropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  cropInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cropDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  cropAction: {
    padding: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modernCropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 12,
  },
  cropIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modernSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingValue: {
    fontSize: 13,
    marginTop: 2,
  },
  modernEmergencyItem: {
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
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  emergencySubtitle: {
    fontSize: 12,
  },
  emergencyNumber: {
    alignItems: 'flex-end',
  },
  emergencyNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;
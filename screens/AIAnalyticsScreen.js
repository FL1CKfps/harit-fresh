import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const AIAnalyticsScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { cropId, cropName } = route.params || {};

  const analyticsOptions = [
    {
      id: 'soil',
      title: 'Soil Advisory',
      subtitle: 'AI-powered soil analysis and recommendations',
      icon: 'earth',
      colors: ['#4CAF50', '#45a049'],
      screen: 'SoilAdvisory'
    },
    {
      id: 'pest',
      title: 'Pest Detection',
      subtitle: 'Identify and treat crop diseases & pests',
      icon: 'bug',
      colors: ['#FF9800', '#F57C00'],
      screen: 'PestDetection'
    }
  ];

  const handleOptionPress = (screen, params = {}) => {
    navigation.navigate(screen, params);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradientPrimary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🤖 AI Analytics - एआई विश्लेषण</Text>
          <Text style={styles.headerSubtitle}>Choose your analysis type</Text>
        </View>
      </LinearGradient>

      {/* Crop Info if coming from crop selection */}
      {cropId && cropName && (
        <View style={styles.cropInfoContainer}>
          <Ionicons name="leaf-outline" size={20} color={theme.primary} />
          <Text style={styles.cropInfoText}>Analyzing for: {cropName}</Text>
        </View>
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {analyticsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => handleOptionPress(option.screen, { cropId, cropName })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={option.colors}
              style={styles.optionGradient}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionIconContainer}>
                  <Ionicons
                    name={option.icon}
                    size={40}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <View style={styles.optionArrow}>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 AI-Powered Agriculture</Text>
          <Text style={styles.infoText}>
            Get personalized recommendations based on your farm profile, location, and crop data. 
            Our AI analyzes your specific conditions to provide accurate insights.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingBottom: 95, // Updated padding for new tab bar height
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
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  cropInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  cropInfoText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    gap: 20,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  optionGradient: {
    padding: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  optionArrow: {
    marginLeft: 10,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: theme.surface,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
});

export default AIAnalyticsScreen;
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onboardingData = [
    {
      icon: 'leaf-outline',
      title: 'Smart Farming Assistant',
      subtitle: 'AI-Powered Agricultural Guidance',
      description: 'Get personalized farming advice based on your crops, soil conditions, and local weather patterns.',
      features: [
        'Real-time crop monitoring',
        'Soil health analysis',
        'Pest detection & prevention',
        'Weather-based recommendations'
      ]
    },
    {
      icon: 'analytics-outline',
      title: 'Market Intelligence',
      subtitle: 'Make Informed Selling Decisions',
      description: 'Access live market prices, demand forecasts, and optimal selling strategies for maximum profit.',
      features: [
        'Live crop prices',
        'Market trend analysis',
        'Price predictions',
        'Best selling locations'
      ]
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Expert Support',
      subtitle: '24/7 AI Agricultural Consultant',
      description: 'Chat with our AI assistant for instant solutions to farming challenges in your preferred language.',
      features: [
        'Multilingual support (22 languages)',
        'Voice assistance',
        'Image-based problem solving',
        'Expert recommendations'
      ]
    }
  ];

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({ x: nextPage * width, animated: true });
    } else {
      navigation.navigate('LanguageSelection');
    }
  };

  const handleSkip = () => {
    navigation.navigate('LanguageSelection');
  };

  const handlePageChange = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / width);
    setCurrentPage(pageIndex);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradientPrimary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Welcome to Krishta AI 🌱</Text>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageChange}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {onboardingData.map((page, index) => (
          <View key={index} style={styles.page}>
            <View style={styles.content}>
              {/* Icon Section */}
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name={page.icon} size={80} color={theme.primary} />
              </View>

              {/* Title Section */}
              <Text style={[styles.title, { color: theme.text }]}>{page.title}</Text>
              <Text style={[styles.subtitle, { color: theme.primary }]}>{page.subtitle}</Text>
              
              {/* Description */}
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {page.description}
              </Text>

              {/* Features List */}
              <View style={styles.featuresContainer}>
                {page.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Page Indicator */}
      <View style={styles.pageIndicatorContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.pageIndicator,
              {
                backgroundColor: index === currentPage ? theme.primary : theme.border,
                width: index === currentPage ? 20 : 8,
              }
            ]}
          />
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity 
        style={[styles.nextButton, { backgroundColor: theme.primary }]} 
        onPress={handleNext}
      >
        <Text style={[styles.nextButtonText, { color: theme.textOnPrimary }]}>
          {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <Ionicons 
          name={currentPage === onboardingData.length - 1 ? 'rocket' : 'arrow-forward'} 
          size={20} 
          color={theme.textOnPrimary} 
        />
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  page: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
    maxWidth: 350,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresContainer: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  pageIndicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: 'width 0.3s',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 30,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default OnboardingScreen;
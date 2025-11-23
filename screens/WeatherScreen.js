
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import aiService from '../services/aiService';
import weatherService from '../services/weather.service';
import apiManager from '../services/apiManager';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';

const { width } = Dimensions.get('window');

const WeatherScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { getFarmerContextForAI } = useFarmer();

  // Safety check for theme
  if (!theme) {
    console.error('[WeatherScreen] Theme is undefined!');
    return null;
  }

  // Log theme properties to debug
  console.log('[WeatherScreen] Theme gradientPrimary:', theme.gradientPrimary);
  if (!theme.gradientPrimary || !Array.isArray(theme.gradientPrimary)) {
    console.warn('[WeatherScreen] Theme gradientPrimary is not a valid array:', theme.gradientPrimary);
  }

  const styles = createStyles(theme);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [farmingTips, setFarmingTips] = useState([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);

  // Load weather data on component mount
  useEffect(() => {
    loadWeatherData();
  }, []);

  // Generate AI farming tips when weather data changes
  useEffect(() => {
    // Wait for weather to load before generating tips to ensure we use real data
    if (loading) return;

    const currentWeatherData = weatherData?.current || fallbackWeatherData.current;
    if (currentWeatherData && !loadingTips && farmingTips.length === 0) {
      generateAIFarmingTips();
    }
  }, [weatherData, loadingTips, farmingTips.length, loading]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get complete weather data (current + forecast)
      const completeWeatherData = await apiManager.getCompleteWeatherData();
      // Basic shape validation
      if (!completeWeatherData) {
        console.warn('[WeatherScreen] No weather data returned, using fallback');
        setWeatherData(null);
      } else if (!completeWeatherData.current) {
        console.warn('[WeatherScreen] Missing current weather data, using fallback');
        setWeatherData(null);
      } else if (typeof completeWeatherData.current.temperature === 'undefined') {
        console.warn('[WeatherScreen] Current weather missing temperature field:', completeWeatherData.current);
        // Still set the data as it might have other valid fields
        setWeatherData(completeWeatherData);
      } else {
        console.log('[WeatherScreen] Weather data loaded successfully');
        setFarmingTips([]); // Clear old tips to force regeneration with new data
        setWeatherData(completeWeatherData);
      }
    } catch (error) {
      console.error('Weather loading error:', error);
      setError(error.message);

      // Show user-friendly error message
      Alert.alert(
        'Weather Data Unavailable',
        'Unable to fetch weather data. Please check your location permissions and internet connection.',
        [
          { text: 'Retry', onPress: loadWeatherData },
          { text: 'Use Offline Mode', onPress: () => setError(null) }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Fallback weather data when real data is unavailable
  const fallbackWeatherData = {
    current: {
      location: 'Location Unavailable',
      temperature: 25,
      condition: 'Partly Cloudy',
      humidity: 60,
      windSpeed: 10,
      pressure: 1013,
      sunrise: '06:15 AM',
      sunset: '06:45 PM',
      icon: 'partly-sunny'
    },
    forecast: {
      hourly: [
        { time: '12 PM', temp: 25, condition: 'Partly Cloudy', icon: 'partly-sunny', precipitation: 10 },
        { time: '01 PM', temp: 27, condition: 'Sunny', icon: 'sunny', precipitation: 0 },
        { time: '02 PM', temp: 29, condition: 'Sunny', icon: 'sunny', precipitation: 0 },
        { time: '03 PM', temp: 28, condition: 'Cloudy', icon: 'cloudy', precipitation: 20 }
      ],
      daily: [
        { day: 'Today', high: 29, low: 22, condition: 'Partly Cloudy', icon: 'partly-sunny', precipitation: 10 }
      ]
    }
  };

  // Get current weather data to display
  // Robust guards to avoid undefined property access
  const currentWeather = weatherData && weatherData.current && typeof weatherData.current.temperature !== 'undefined'
    ? weatherData.current
    : fallbackWeatherData.current;

  const hourlyForecast = (weatherData && weatherData.forecast && Array.isArray(weatherData.forecast.hourly)
    ? weatherData.forecast.hourly
    : fallbackWeatherData.forecast.hourly)
    // Filter out any malformed entries missing temp/time
    .filter(h => h && typeof h.temp !== 'undefined' && h.time);

  const weeklyForecast = (weatherData && weatherData.forecast && Array.isArray(weatherData.forecast.daily)
    ? weatherData.forecast.daily
    : fallbackWeatherData.forecast.daily)
    .filter(d => d && typeof d.high !== 'undefined' && typeof d.low !== 'undefined');



  const getAIWeatherAdvice = async () => {
    if (!currentWeather) return;

    setLoadingAdvice(true);
    try {
      // Get farmer context for personalized weather advice
      const farmerContext = getFarmerContextForAI();

      let contextPrompt = `Current weather: ${currentWeather.condition || 'Unknown'}, ${currentWeather.temperature || 25}°C, ${currentWeather.humidity || 60}% humidity. `;

      if (farmerContext.farmer) {
        contextPrompt += `Farmer profile: ${farmerContext.farmer.name}, ${farmerContext.farmer.landSize} acres, ${farmerContext.farmer.soilType} soil. `;
      }

      if (farmerContext.activeCrops.length > 0) {
        const cropDetails = farmerContext.activeCrops.map(crop =>
          `${crop.name} (${crop.area} acres, ${crop.stage}, ${crop.daysFromPlanting} days)`
        ).join(', ');
        contextPrompt += `Current crops: ${cropDetails}. `;
      }

      contextPrompt += 'Provide specific farming advice for crop management, irrigation, pest control, and field activities based on this weather and farmer situation.';

      const response = await aiService.getWeatherAdvice(currentWeather, farmerContext);
      setAiAdvice(response);
    } catch (error) {
      console.error('Error getting weather advice:', error);
      Alert.alert('Error', 'Unable to get weather advice. Please try again.');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const generateAIFarmingTips = async () => {
    if (!currentWeather) return;

    setLoadingTips(true);
    try {
      const weatherCondition = (currentWeather.condition || 'Unknown').toLowerCase();
      const temperature = currentWeather.temperature || 25;
      const humidity = currentWeather.humidity || 60;
      const windSpeed = currentWeather.windSpeed || 10;

      // Get farmer context for personalized tips
      const farmerContext = getFarmerContextForAI();

      let contextInfo = '';
      if (farmerContext.farmer) {
        contextInfo += `Farmer: ${farmerContext.farmer.name}, Land: ${farmerContext.farmer.landSize} acres, Soil: ${farmerContext.farmer.soilType}. `;
      }
      if (farmerContext.activeCrops.length > 0) {
        const cropDetails = farmerContext.activeCrops.map(crop =>
          `${crop.name}${crop.variety ? ` (${crop.variety})` : ''} - ${crop.area} acres, ${crop.stage}, ${crop.daysFromPlanting} days old`
        ).join(', ');
        contextInfo += `Active crops: ${cropDetails}. `;
      }

      const tipsPrompt = `${contextInfo}Based on current weather conditions: ${weatherCondition}, temperature ${temperature}°C, humidity ${humidity}%, wind speed ${windSpeed} km/h, provide 3-4 specific farming tips tailored to this farmer's situation. For each tip, include:
      1. A short title (2-4 words)
      2. A practical description specific to their crops and conditions (1-2 sentences)
      3. Priority level (high, medium, or low)
      4. Appropriate category icon (water for irrigation, bug for pests, leaf for crops, partly-sunny for general)
      
      Format as JSON array with objects containing: title, description, icon, priority`;

      const response = await aiService.chat(tipsPrompt, farmerContext, true);

      // Try to parse the JSON response
      let tips = [];
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        const jsonData = jsonMatch ? jsonMatch[0] : response;
        tips = JSON.parse(jsonData);
      } catch (parseError) {
        // Fallback: create tips from text response
        console.log('Using text-based tip generation');
        tips = parseTipsFromText(response, weatherCondition, temperature, humidity);
      }

      setFarmingTips(tips);
    } catch (error) {
      console.error('Error generating farming tips:', error);
      // Set fallback tips based on weather
      setFarmingTips(getFallbackTips(currentWeather));
    } finally {
      setLoadingTips(false);
    }
  };

  const parseTipsFromText = (text, condition, temp, humidity) => {
    const baseTips = [
      {
        title: 'Irrigation Management',
        description: temp > 30 ? 'Increase watering frequency due to high temperature.' : 'Maintain regular watering schedule.',
        icon: 'water',
        priority: temp > 30 || humidity < 30 ? 'high' : 'medium'
      },
      {
        title: 'Weather Protection',
        description: condition.includes('rain') ? 'Provide cover for sensitive crops.' : 'Monitor for heat stress in plants.',
        icon: 'partly-sunny',
        priority: condition.includes('rain') || temp > 35 ? 'high' : 'low'
      },
      {
        title: 'Pest Control',
        description: humidity > 70 ? 'High humidity may increase pest activity.' : 'Monitor for spider mites in dry conditions.',
        icon: 'bug',
        priority: 'medium'
      }
    ];
    return baseTips;
  };

  const getFallbackTips = (weather) => {
    return [
      {
        title: 'Weather Alert',
        description: `Current conditions: ${weather.condition}, ${weather.temperature}°C. Plan activities accordingly.`,
        icon: 'partly-sunny',
        priority: 'high'
      },
      {
        title: 'Crop Care',
        description: 'Monitor your crops for weather-related stress and adjust care as needed.',
        icon: 'leaf',
        priority: 'medium'
      },
      {
        title: 'Irrigation Check',
        description: 'Verify soil moisture levels based on current weather conditions.',
        icon: 'water',
        priority: 'medium'
      }
    ];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const getWeatherIcon = (iconName) => {
    if (weatherData && weatherService.getWeatherIcon) {
      return weatherService.getWeatherIcon(iconName);
    }

    const iconMap = {
      'sunny': 'sunny',
      'partly-sunny': 'partly-sunny',
      'cloudy': 'cloudy',
      'rainy': 'rainy',
      'thunderstorm': 'thunderstorm'
    };
    return iconMap[iconName] || 'partly-sunny';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return theme.textSecondary || '#757575';
    }
  };

  // Show loading screen while fetching weather data
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientPrimary || ['#4CAF50', '#66BB6A']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🌤️ Weather Forecast</Text>
          </View>
        </LinearGradient>

        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Getting weather data...
          </Text>
          <Text style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
            Requesting location permission
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />

      {/* Header */}
      <LinearGradient
        colors={theme.gradientPrimary || ['#4CAF50', '#66BB6A']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Weather Forecast</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Location Permission Alert */}
        {error && (
          <View style={[styles.errorCard, {
            backgroundColor: '#FFF3E0',
            borderColor: '#FF9800'
          }]}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={[styles.errorText, { color: '#F57C00' }]}>
              Using offline weather data. Enable location for real-time updates.
            </Text>
          </View>
        )}

        {/* Modern Current Weather */}
        <ModernCard gradient elevation={6}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={16} color={theme.textSecondary} />
            <Text style={[styles.location, { color: theme.textSecondary }]}>
              {currentWeather.location}
            </Text>
            {weatherData && !error && (
              <View style={[styles.liveBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.liveText, { color: theme.textOnPrimary }]}>LIVE</Text>
              </View>
            )}
          </View>

          <View style={styles.weatherMain}>
            <View style={styles.temperatureSection}>
              <View style={styles.weatherIconContainer}>
                <Ionicons
                  name={getWeatherIcon(currentWeather.icon || 'partly-sunny')}
                  size={80}
                  color={theme.primary}
                />
              </View>
              <View style={styles.temperatureContainer}>
                <Text style={[styles.temperature, { color: theme.text }]}>
                  {currentWeather.temperature !== undefined ? currentWeather.temperature : '--'}°
                </Text>
                <Text style={[styles.temperatureUnit, { color: theme.textSecondary }]}>C</Text>
              </View>
            </View>
            <Text style={[styles.condition, { color: theme.text }]}>
              {currentWeather.condition || 'Unknown'}
            </Text>
          </View>

          <View style={styles.weatherDetailsGrid}>
            <View style={styles.detailCard}>
              <View style={[styles.detailIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="water" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {currentWeather.humidity || '--'}%
              </Text>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Humidity</Text>
            </View>

            <View style={styles.detailCard}>
              <View style={[styles.detailIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="leaf" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {currentWeather.windSpeed || '--'}
              </Text>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>km/h</Text>
            </View>

            <View style={styles.detailCard}>
              <View style={[styles.detailIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="speedometer" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {currentWeather.pressure || '--'}
              </Text>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>mb</Text>
            </View>
          </View>
        </ModernCard>

        {/* Modern AI Weather Advice */}
        <ModernCard>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="analytics" size={24} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Weather Advice</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Personalized farming tips
                </Text>
              </View>
            </View>
            <ModernButton
              title={loadingAdvice ? 'Loading...' : 'Get Advice'}
              icon="analytics"
              size="small"
              onPress={getAIWeatherAdvice}
              disabled={loadingAdvice}
            />
          </View>

          {aiAdvice ? (
            <View style={styles.adviceContainer}>
              <Text style={[styles.adviceText, { color: theme.text }]}>{aiAdvice}</Text>
            </View>
          ) : (
            <View style={styles.advicePlaceholderContainer}>
              <Ionicons name="bulb-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.advicePlaceholder, { color: theme.textSecondary }]}>
                Get personalized farming advice based on current weather conditions
              </Text>
            </View>
          )}
        </ModernCard>

        {/* Hourly Forecast */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Hourly Forecast</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyContainer}
            >
              {hourlyForecast.map((hour, index) => (
                // Guard against malformed hour entries
                hour ? (
                  <View
                    key={index}
                    style={[styles.hourlyCard, {
                      backgroundColor: theme.surface,
                      borderColor: theme.border
                    }]}
                  >
                    <Text style={[styles.hourlyTime, { color: theme.textSecondary }]}>
                      {hour.time || '--'}
                    </Text>
                    <Ionicons
                      name={getWeatherIcon(hour.icon || 'partly-sunny')}
                      size={32}
                      color={theme.primary}
                    />
                    <Text style={[styles.hourlyTemp, { color: theme.text }]}>
                      {hour.temp !== undefined ? hour.temp : '--'}°
                    </Text>
                    <View style={styles.precipitationInfo}>
                      <Ionicons name="water" size={12} color={theme.primary} />
                      <Text style={[styles.precipitationText, { color: theme.textSecondary }]}>
                        {hour.precipitation || 0}%
                      </Text>
                    </View>
                  </View>
                ) : null
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Weekly Forecast */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>7-Day Forecast</Text>

            {weeklyForecast.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dailyCard, {
                  backgroundColor: theme.surface,
                  borderColor: theme.border
                }]}
                onPress={() => setSelectedDay(index)}
              >
                <Text style={[styles.dayName, { color: theme.text }]}>{day.day}</Text>

                <View style={styles.dailyInfo}>
                  <Ionicons
                    name={getWeatherIcon(day.icon)}
                    size={24}
                    color={theme.primary}
                  />
                  <Text style={[styles.dailyCondition, { color: theme.textSecondary }]}>
                    {day.condition}
                  </Text>
                </View>

                <View style={styles.dailyTemps}>
                  <Text style={[styles.highTemp, { color: theme.text }]}>{day.high !== undefined ? day.high : '--'}°</Text>
                  <Text style={[styles.lowTemp, { color: theme.textSecondary }]}>/{day.low !== undefined ? day.low : '--'}°</Text>
                </View>

                <View style={styles.precipitationInfo}>
                  <Ionicons name="water" size={12} color={theme.primary} />
                  <Text style={[styles.precipitationText, { color: theme.textSecondary }]}>
                    {day.precipitation}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Smart Farming Tips */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Smart Farming Tips</Text>
              <TouchableOpacity
                style={[styles.adviceButton, { backgroundColor: theme.primary }]}
                onPress={generateAIFarmingTips}
                disabled={loadingTips}
              >
                <Ionicons name="refresh" size={16} color={theme.textOnPrimary} />
                <Text style={[styles.adviceButtonText, { color: theme.textOnPrimary }]}>
                  {loadingTips ? 'Loading...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>

            {loadingTips ? (
              <View style={[styles.adviceCard, {
                backgroundColor: theme.surface,
                borderColor: theme.border
              }]}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.advicePlaceholder, { color: theme.textSecondary, marginTop: 8 }]}>
                  Generating personalized farming tips based on current weather...
                </Text>
              </View>
            ) : farmingTips.length > 0 ? (
              farmingTips.map((tip, index) => (
                <View
                  key={index}
                  style={[styles.tipCard, {
                    backgroundColor: theme.background,
                    borderColor: theme.border
                  }]}
                >
                  <View style={styles.tipHeader}>
                    <View style={[styles.tipIcon, { backgroundColor: theme.primary }]}>
                      <Ionicons name={tip.icon} size={20} color={theme.textOnPrimary} />
                    </View>
                    <View style={styles.tipContent}>
                      <Text style={[styles.tipTitle, { color: theme.text }]}>{tip.title}</Text>
                      <Text style={[styles.tipDescription, { color: theme.textSecondary }]}>
                        {tip.description}
                      </Text>
                    </View>
                    <View style={[styles.priorityIndicator, {
                      backgroundColor: getPriorityColor(tip.priority)
                    }]} />
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.adviceCard, {
                backgroundColor: theme.surface,
                borderColor: theme.border
              }]}>
                <Text style={[styles.advicePlaceholder, { color: theme.textSecondary }]}>
                  Tap refresh to get personalized farming tips based on current weather conditions
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  refreshButton: {
    padding: 4,
    width: 32,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 100,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  currentWeatherCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
  },
  weatherMain: {
    alignItems: 'center',
    marginBottom: 24,
  },
  temperatureSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temperature: {
    fontSize: 64,
    fontWeight: '200',
  },
  temperatureUnit: {
    fontSize: 24,
    fontWeight: '300',
    marginTop: 8,
  },
  condition: {
    fontSize: 20,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  weatherDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  detailCard: {
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  adviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  adviceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  adviceContainer: {
    backgroundColor: theme.backgroundSecondary,
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
  },
  adviceText: {
    fontSize: 15,
    lineHeight: 22,
  },
  advicePlaceholderContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 8,
  },
  advicePlaceholder: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 12,
  },
  hourlyContainer: {
    paddingRight: 20,
  },
  hourlyCard: {
    width: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 12,
  },
  hourlyTime: {
    fontSize: 12,
    marginBottom: 8,
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },
  precipitationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  precipitationText: {
    fontSize: 10,
    marginLeft: 2,
  },
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    width: 80,
  },
  dailyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  dailyCondition: {
    fontSize: 14,
    marginLeft: 8,
  },
  dailyTemps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  highTemp: {
    fontSize: 16,
    fontWeight: '600',
  },
  lowTemp: {
    fontSize: 16,
  },
  tipCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default WeatherScreen;
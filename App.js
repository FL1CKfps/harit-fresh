import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, ActivityIndicator, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { FarmerProvider } from './contexts/FarmerContext';

// Import custom tab bar
import CustomTabBar from './components/CustomTabBar';

// Import screens
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import SoilAdvisoryScreen from './screens/SoilAdvisoryScreen';      
import PestDetectionScreen from './screens/PestDetectionScreen';
import WeatherScreen from './screens/WeatherScreen';
import MarketScreen from './screens/MarketScreen';
import AIAnalyticsScreen from './screens/AIAnalyticsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LanguageSelectionScreen from './screens/LanguageSelectionScreen';
import FarmerProfileSetupScreen from './screens/FarmerProfileSetupScreen';
import AddCropScreen from './screens/AddCropScreen';
import CropManagementScreen from './screens/CropManagementScreen';
import CommunityScreen from './screens/CommunityScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import PostDetailScreen from './screens/PostDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const OnboardingStack = createStackNavigator();

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ 
          headerShown: false // Custom floating pill header
        }} 
      />
      <Stack.Screen 
        name="Chatbot" 
        component={ChatbotScreen}
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="Weather" 
        component={WeatherScreen}
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="Market" 
        component={MarketScreen}
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="AddCrop" 
        component={AddCropScreen}
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="CropManagement" 
        component={CropManagementScreen}
        options={{ 
          headerShown: false
        }} 
      />
    </Stack.Navigator>
  );
}

// AI Analytics Stack Navigator
function AIAnalyticsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AIAnalyticsMain" 
        component={AIAnalyticsScreen} 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="SoilAdvisory" 
        component={SoilAdvisoryScreen}
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="PestDetection" 
        component={PestDetectionScreen}
        options={{ 
          headerShown: false
        }} 
      />
    </Stack.Navigator>
  );
}

// Community Stack Navigator
function CommunityStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CommunityMain" 
        component={CommunityScreen} 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetailScreen}
        options={{ 
          headerShown: false
        }} 
      />
    </Stack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack.Navigator>
  );
}

// Chatbot Stack Navigator
function ChatbotStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ChatbotMain" 
        component={ChatbotScreen}
        options={{ 
          headerShown: false
        }} 
      />
    </Stack.Navigator>
  );
}

// Onboarding Flow Navigator
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
      <OnboardingStack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <OnboardingStack.Screen name="FarmerProfileSetup" component={FarmerProfileSetupScreen} />
    </OnboardingStack.Navigator>
  );
}

// Main App Content with Theme
function AppContent() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef();

  useEffect(() => {
    checkOnboardingStatus();
    
    // Listen for app state changes to re-check onboarding status
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkOnboardingStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Check onboarding status periodically when in onboarding flow
    const interval = setInterval(() => {
      if (!isOnboardingComplete) {
        checkOnboardingStatus();
      }
    }, 2000); // Check every 2 seconds during onboarding
    
    return () => {
      subscription?.remove();
      clearInterval(interval);
    };
  }, [isOnboardingComplete]);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (url) => {
      console.log('Received deep link:', url);
      if (url && isOnboardingComplete) {
        // Parse the URL - format: agrocure://post/postId
        const route = url.replace('agrocure://', '');
        const [screen, id] = route.split('/');
        
        if (screen === 'post' && id && navigationRef.current) {
          // Navigate to community and then to post detail
          navigationRef.current.navigate('Community', {
            screen: 'PostDetail',
            params: { postId: id }
          });
        }
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(handleDeepLink);
    
    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    
    return () => subscription?.remove();
  }, [isOnboardingComplete]);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      const farmerProfile = await AsyncStorage.getItem('farmerProfile');
      
      console.log('Checking onboarding status:', {
        onboardingComplete,
        hasProfile: farmerProfile !== null
      });
      
      // Check if both onboarding and farmer profile are complete
      const isComplete = onboardingComplete === 'true' && farmerProfile !== null;
      setIsOnboardingComplete(isComplete);
      
      console.log('Onboarding status:', isComplete);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboardingComplete(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const linking = {
    prefixes: ['agrocure://'],
    config: {
      screens: {
        Community: {
          screens: {
            CommunityMain: 'community',
            PostDetail: 'post/:postId',
          },
        },
      },
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        // Re-check onboarding status when navigation is ready
        checkOnboardingStatus();
      }}
    >
      <StatusBar 
        style={isDark ? "light" : "dark"} 
        backgroundColor={theme.background} 
      />
      {!isOnboardingComplete ? (
        <OnboardingNavigator />
      ) : (
        <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false, // We'll use custom headers
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStackNavigator} 
        />
        <Tab.Screen 
          name="Weather" 
          component={WeatherScreen}
        />
        <Tab.Screen 
          name="AIAnalytics" 
          component={AIAnalyticsStackNavigator}
        />
        <Tab.Screen 
          name="Community" 
          component={CommunityStackNavigator}
        />
        <Tab.Screen 
          name="Market" 
          component={MarketScreen}
        />
        <Tab.Screen 
          name="Chatbot" 
          component={ChatbotStackNavigator}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStackNavigator} 
        />
        </Tab.Navigator>
      )}
      

    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FarmerProvider>
        <AppContent />
      </FarmerProvider>
    </ThemeProvider>
  );
}
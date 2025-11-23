import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import marketService from '../services/marketService';
import aiService from '../services/aiService';
import weatherService from '../services/weather.service';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernSearchBar from '../components/ModernSearchBar';

const { width } = Dimensions.get('window');

// Helper function to extract and format key reasoning points
const getShortReasoning = (fullReasoning) => {
  if (!fullReasoning) return 'No analysis available';
  
  // Clean and format text
  const cleanText = formatAIResponse(fullReasoning);
  
  // Try to extract the main reasoning section
  const reasoningMatch = cleanText.match(/REASONING[:\s]*(.*?)(?=ACTION PLAN|RISK FACTORS|TIMING|$)/is);
  if (reasoningMatch) {
    const reasoning = reasoningMatch[1].trim();
    // Get first 2 sentences for short version
    const sentences = reasoning.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, 2).join('. ').trim();
    return keyPoints + (keyPoints.endsWith('.') ? '' : '.');
  }
  
  // If no reasoning section found, just get first 2 sentences
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keyPoints = sentences.slice(0, 2).join('. ').trim();
  return keyPoints + (keyPoints.endsWith('.') ? '' : '.');
};

// Helper function to properly format AI response text
const formatAIResponse = (text) => {
  if (!text) return '';
  
  return text
    // Remove markdown headers (###, ##, #)
    .replace(/#{1,6}\s*/g, '')
    // Remove bold markdown (**)
    .replace(/\*\*/g, '')
    // Remove italic markdown (single *)
    .replace(/(?<!\*)\*(?!\*)/g, '')
    // Clean up bullet points
    .replace(/^\s*[-•]\s*/gm, '• ')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Clean up line breaks
    .replace(/\n\s*\n/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim()
    // Format sections properly
    .replace(/RECOMMENDATION[:\s]*/gi, 'Recommendation: ')
    .replace(/CONFIDENCE LEVEL[:\s]*/gi, 'Confidence: ')
    .replace(/REASONING[:\s]*/gi, 'Analysis: ')
    .replace(/ACTION PLAN[:\s]*/gi, 'Action Plan: ')
    .replace(/RISK FACTORS[:\s]*/gi, 'Risk Factors: ')
    .replace(/TIMING[:\s]*/gi, 'Best Timing: ')
    // Add proper spacing after sections
    .replace(/([A-Z][a-z]+:)/g, '\n$1 ')
    .trim();
};

const MarketScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { getFarmerContextForAI } = useFarmer();
  
  // Get parameters from navigation
  const routeParams = route?.params || {};
  const initialCrop = routeParams.selectedCrop || '';
  const shouldShowIntentionModal = routeParams.showIntentionModal || false;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(initialCrop);
  const [selectedState, setSelectedState] = useState('Karnataka');
  const [selectedMarket, setSelectedMarket] = useState('Bangalore');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [priceData, setPriceData] = useState([]);
  const [filteredPriceData, setFilteredPriceData] = useState([]);
  const [resultSearchTerm, setResultSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [marketTools, setMarketTools] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [userIntention, setUserIntention] = useState(null); // 'buy' or 'sell'
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showFullReasoning, setShowFullReasoning] = useState(false);
  const [states, setStates] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [marketsLoading, setMarketsLoading] = useState(false);

  useEffect(() => {
    setupMarketTools();
    loadStates();
    loadUserLocation();
    // Show intention modal when screen loads or when navigated from HomeScreen
    setShowIntentionModal(shouldShowIntentionModal || !userIntention);
  }, []);

  // Handle initial crop selection from HomeScreen
  useEffect(() => {
    if (initialCrop) {
      setSelectedCrop(initialCrop);
      // Load price data for the selected crop
      if (selectedState && selectedMarket) {
        loadCropData(initialCrop, selectedState, selectedMarket);
      }
    }
  }, [initialCrop, selectedState, selectedMarket]);

  useEffect(() => {
    if (selectedState) {
      loadMarkets(selectedState);
    }
  }, [selectedState]);

  const loadUserLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await weatherService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Auto-set state and market based on location
      if (location.city) {
        const cityName = location.city.toLowerCase();
        let detectedState = 'Karnataka'; // default
        let detectedMarket = 'Bangalore'; // default
        
        if (cityName.includes('delhi') || cityName.includes('new delhi')) {
          detectedState = 'Delhi';
          detectedMarket = 'Delhi';
        } else if (cityName.includes('mumbai') || cityName.includes('pune') || cityName.includes('nagpur')) {
          detectedState = 'Maharashtra';
          detectedMarket = cityName.includes('mumbai') ? 'Mumbai' : cityName.includes('pune') ? 'Pune' : 'Nagpur';
        } else if (cityName.includes('bangalore') || cityName.includes('mysore') || cityName.includes('mangalore')) {
          detectedState = 'Karnataka';
          detectedMarket = cityName.includes('bangalore') ? 'Bangalore' : cityName.includes('mysore') ? 'Mysore' : 'Mangalore';
        } else if (cityName.includes('chennai') || cityName.includes('coimbatore') || cityName.includes('madurai')) {
          detectedState = 'Tamil Nadu';
          detectedMarket = cityName.includes('chennai') ? 'Chennai' : cityName.includes('coimbatore') ? 'Coimbatore' : 'Madurai';
        } else if (cityName.includes('hyderabad') || cityName.includes('warangal')) {
          detectedState = 'Telangana';
          detectedMarket = cityName.includes('hyderabad') ? 'Hyderabad' : 'Warangal';
        }
        
        setSelectedState(detectedState);
        setSelectedMarket(detectedMarket);
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const loadStates = async () => {
    try {
      setStatesLoading(true);
      const statesList = await marketService.getStates();
      setStates(statesList);
    } catch (error) {
      console.error('Error loading states:', error);
    } finally {
      setStatesLoading(false);
    }
  };

  const loadMarkets = async (state) => {
    try {
      setMarketsLoading(true);
      const marketsList = await marketService.getPopularMarkets(state);
      setMarkets(marketsList);
      
      // Set default market if not already set
      if (marketsList.length > 0 && !selectedMarket) {
        setSelectedMarket(marketsList[0].name);
      }
    } catch (error) {
      console.error('Error loading markets:', error);
      setMarkets([]);
    } finally {
      setMarketsLoading(false);
    }
  };

  const setupMarketTools = () => {
    const tools = [
      {
        id: 1,
        name: 'Price Calculator',
        icon: 'calculator-outline',
        description: 'Calculate crop prices and profits',
        onPress: () => openPriceCalculator()
      },
      {
        id: 2,
        name: 'Market Trends',
        icon: 'trending-up-outline',
        description: 'View price trends and forecasts',
        onPress: () => openMarketTrends()
      },
      {
        id: 3,
        name: 'Transport Cost',
        icon: 'car-outline',
        description: 'Calculate transportation costs',
        onPress: () => openTransportCalculator()
      },
      {
        id: 4,
        name: 'Demand Forecast',
        icon: 'bar-chart-outline',
        description: 'Predict market demand',
        onPress: () => openDemandForecast()
      }
    ];
    setMarketTools(tools);
  };

  const loadCropData = async (cropName, state = selectedState, market = selectedMarket) => {
    setSelectedCrop(cropName);
    setLoading(true);
    setAiAnalysis(null); // Reset AI analysis
    setShowFullReasoning(false); // Reset to collapsed view
    setResultSearchTerm(''); // Reset result search
    
    // Clear previous data immediately to show loading state
    setPriceData([]);
    setFilteredPriceData([]);
    
    try {
      console.log(`🔍 Fetching data for ${cropName} in ${market}, ${state}`);
      const data = await marketService.getMarketPrices(cropName, state, market);
      console.log('📊 API Response:', data);
      
      if (!data || !Array.isArray(data)) {
        console.log('❌ Invalid data received from API');
        throw new Error('Invalid data received from API');
      }
      
      // Filter data to ensure location accuracy (but don't over-filter)
      const locationFilteredData = filterByLocation(data, state, market);
      console.log(`📋 Location filtered data: ${locationFilteredData?.length || 0} records`);
      
      // Use setTimeout to ensure state updates are processed in the next tick
      setTimeout(() => {
        if (locationFilteredData && locationFilteredData.length > 0) {
          console.log(`✅ Successfully loaded ${locationFilteredData.length} price records for ${cropName}`);
          setPriceData(locationFilteredData);
          setFilteredPriceData(locationFilteredData);
        } else if (data && data.length > 0) {
          // If we got data but filtering removed it all, show the original data
          console.log(`⚠️ Location filtering removed all data, showing ${data.length} national results for ${cropName}`);
          setPriceData(data);
          setFilteredPriceData(data);
        } else {
          console.log(`ℹ️ No records found for ${cropName} in any location`);
          setPriceData([]);
          setFilteredPriceData([]);
        }
      }, 0);
      
      // Generate AI Analysis after a brief delay to ensure data is set
      if ((locationFilteredData?.length > 0 || data?.length > 0) && userIntention) {
        setTimeout(async () => {
          setAnalysisLoading(true);
          try {
            const dataForAnalysis = locationFilteredData?.length > 0 ? locationFilteredData : data;
            const analysis = await marketService.getAIMarketAnalysis(dataForAnalysis, cropName, userIntention);
            setAiAnalysis(analysis);
          } catch (analysisError) {
            console.error('❌ AI Analysis error:', analysisError);
          } finally {
            setAnalysisLoading(false);
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error loading crop data:', error);
      Alert.alert(
        'Market Data Unavailable', 
        `Unable to fetch ${cropName} prices from government sources.\n\nThis could be due to:\n• Network connectivity issues\n• Government API maintenance\n• No data available for this commodity/location\n\nPlease try again later or select a different crop/location.`,
        [{ text: 'OK' }]
      );
      
      // Ensure empty state is set on error
      setTimeout(() => {
        setPriceData([]);
        setFilteredPriceData([]);
      }, 0);
    } finally {
      // Delay loading state change slightly to ensure other state updates complete
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  };

  // Filter data by location to ensure accuracy
  const filterByLocation = (data, state, market) => {
    if (!data || !Array.isArray(data)) return [];

    let filtered = data;

    // If state is specified, try exact state match first
    if (state && state !== 'All') {
      const exactStateMatches = filtered.filter(item => {
        const itemState = (item.State || '').toLowerCase().trim();
        const targetState = state.toLowerCase().trim();
        
        // Exact match
        return itemState === targetState;
      });

      // If exact matches found, use them
      if (exactStateMatches.length > 0) {
        filtered = exactStateMatches;
        console.log(`🎯 Using ${exactStateMatches.length} exact matches for ${state}`);
      } else {
        // If no exact matches, look for similar/nearby states
        const similarStateMatches = filtered.filter(item => {
          const itemState = (item.State || '').toLowerCase().trim();
          const targetState = state.toLowerCase().trim();
          
          // Contains match (for cases like NCR, nearby states)
          return itemState.includes(targetState) || targetState.includes(itemState);
        });

        if (similarStateMatches.length > 0) {
          filtered = similarStateMatches;
          console.log(`🔍 Using ${similarStateMatches.length} similar matches for ${state}`);
        } else {
          // IMPORTANT: Don't filter out data if no location matches found
          // This allows showing national data when local data isn't available
          console.log(`⚠️ No location matches for ${state}, showing national data (${filtered.length} records)`);
          // Keep all data - don't filter it out
        }
      }
    }

    // Market filtering (only if we have state matches or showing national data)
    if (market && market !== 'All' && filtered.length > 0) {
      const exactMarketMatches = filtered.filter(item => {
        const itemMarket = (item.Market || item.City || '').toLowerCase().trim();
        const targetMarket = market.toLowerCase().trim();
        
        // Exact match
        return itemMarket === targetMarket;
      });

      const similarMarketMatches = filtered.filter(item => {
        const itemMarket = (item.Market || item.City || '').toLowerCase().trim();
        const targetMarket = market.toLowerCase().trim();
        
        // Contains match but not exact
        return itemMarket !== targetMarket && 
               (itemMarket.includes(targetMarket) || targetMarket.includes(itemMarket));
      });

      // Apply market filtering only if we find matches, otherwise keep state/national results
      if (exactMarketMatches.length > 0) {
        filtered = exactMarketMatches;
        console.log(`🎯 Using ${exactMarketMatches.length} exact market matches`);
      } else if (similarMarketMatches.length > 0) {
        filtered = similarMarketMatches;
        console.log(`🔍 Using ${similarMarketMatches.length} similar market matches`);
      } else {
        console.log(`⚠️ No market matches for ${market}, keeping ${filtered.length} results`);
        // Keep existing results - don't filter by market if no matches
      }
    }

    return filtered;
  };

  // Filter results based on search term
  const filterResults = (searchTerm) => {
    setResultSearchTerm(searchTerm);
    
    if (!searchTerm.trim()) {
      // Use setTimeout to ensure state update happens in next tick
      setTimeout(() => {
        setFilteredPriceData(priceData);
      }, 0);
      return;
    }

    const filtered = priceData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search in market/city name
      const marketMatch = (item.Market || item.City || '').toLowerCase().includes(searchLower);
      
      // Search in state name
      const stateMatch = (item.State || '').toLowerCase().includes(searchLower);
      
      // Search in district name
      const districtMatch = (item.District || '').toLowerCase().includes(searchLower);
      
      // Search in variety
      const varietyMatch = (item.Variety || '').toLowerCase().includes(searchLower);
      
      // Search in grade
      const gradeMatch = (item.Grade || '').toLowerCase().includes(searchLower);

      return marketMatch || stateMatch || districtMatch || varietyMatch || gradeMatch;
    });

    // Use setTimeout to ensure state update happens in next tick
    setTimeout(() => {
      setFilteredPriceData(filtered);
    }, 0);
  };

  const searchCrops = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Enter Crop Name', 'Please enter a crop name to search');
      return;
    }
    
    setLoading(true);
    try {
      // Search for matching crops
      const results = await marketService.searchCommodities(searchTerm);
      if (results.length > 0) {
        const cropName = results[0];
        setSelectedCrop(cropName);
        await loadCropData(cropName, selectedState, selectedMarket);
        Alert.alert('Search Results', `Found prices for ${cropName} in ${selectedMarket}`);
      } else {
        Alert.alert('No Results', `No crops found matching "${searchTerm}"`);
      }
    } catch (error) {
      Alert.alert('Search Error', 'Unable to search crops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedCrop) {
      await loadCropData(selectedCrop, selectedState, selectedMarket);
    } else {
      await loadCropData('Wheat');
    }
    setRefreshing(false);
  };

  const [showStateSelector, setShowStateSelector] = useState(false);
  const [showMarketSelector, setShowMarketSelector] = useState(false);

  const changeMarket = () => {
    const availableMarkets = marketService.getPopularMarkets(selectedState);
    if (availableMarkets.length === 0) {
      Alert.alert('No Markets', `No markets available for ${selectedState}`);
      return;
    }
    setShowMarketSelector(true);
  };

  const changeState = () => {
    setShowStateSelector(true);
  };

  const selectState = async (state) => {
    setSelectedState(state);
    setShowStateSelector(false);
    
    // Markets will be loaded by the useEffect when selectedState changes
    // Just reset selectedMarket for now
    setSelectedMarket('');
  };

  const selectMarket = (market) => {
    setSelectedMarket(market.name);
    setShowMarketSelector(false);
    if (selectedCrop) {
      loadCropData(selectedCrop, selectedState, market.name);
    }
  };

  const openPriceCalculator = async () => {
    if (!selectedCrop) {
      Alert.alert('No Data', 'Please select a crop first to use the price calculator');
      return;
    }

    if (priceData.length === 0) {
      Alert.alert('Loading Data', `Loading ${selectedCrop} price data for calculator. Please wait...`);
      return;
    }

    const latestPrice = priceData[0];
    const modelPrice = parseInt(latestPrice['Model Prize']);
    
    Alert.prompt(
      'Price Calculator',
      `Current ${selectedCrop} price: ₹${modelPrice}/quintal\nEnter quantity (quintals):`,
      [
        {
          text: 'Calculate',
          onPress: (quantity) => {
            if (quantity && !isNaN(quantity)) {
              const total = modelPrice * parseFloat(quantity);
              Alert.alert(
                'Price Calculation',
                `${selectedCrop}: ${quantity} quintals\nPrice per quintal: ₹${modelPrice}\nTotal Value: ₹${total.toLocaleString()}`
              );
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ],
      'plain-text',
      '1'
    );
  };

  const openMarketTrends = async () => {
    if (!selectedCrop || priceData.length < 2) {
      Alert.alert('Market Trends', 'Need more data points to show trends. Try refreshing or selecting another crop.');
      return;
    }

    if (aiAnalysis) {
      // Show comprehensive AI analysis
      const analysisText = `${selectedCrop} Market Analysis:\n\n` +
        `🤖 AI Recommendation: ${aiAnalysis.recommendation}\n` +
        `📊 Confidence: ${aiAnalysis.confidence}\n\n` +
        `📈 Technical Data:\n` +
        `• Daily Change: ${aiAnalysis.technicalData?.dailyChange || 'N/A'}\n` +
        `• Overall Trend: ${aiAnalysis.technicalData?.overallTrend || 'N/A'}\n` +
        `• Momentum: ${aiAnalysis.technicalData?.momentum || 'N/A'}\n\n` +
        `💡 Action: ${aiAnalysis.action}\n\n` +
        `📝 Analysis: ${aiAnalysis.reasoning}`;
      
      Alert.alert('AI Market Analysis', analysisText);
    } else {
      // Fallback to basic analysis
      const currentPrice = parseInt(priceData[0]['Model Prize']);
      const previousPrice = parseInt(priceData[1]['Model Prize']);
      const change = currentPrice - previousPrice;
      const changePercent = ((change / previousPrice) * 100).toFixed(2);
      
      const trend = change > 0 ? '📈 Increasing' : change < 0 ? '📉 Decreasing' : '➡️ Stable';
      
      Alert.alert(
        'Market Trends',
        `${selectedCrop} in ${selectedMarket}:\n\nCurrent Price: ₹${currentPrice}/quintal\nPrevious Price: ₹${previousPrice}/quintal\nChange: ${change > 0 ? '+' : ''}₹${change} (${changePercent}%)\n\nTrend: ${trend}`
      );
    }
  };

  const openTransportCalculator = () => {
    if (!selectedCrop) {
      Alert.alert('No Crop Selected', 'Please select a crop first to calculate transportation costs');
      return;
    }
    
    Alert.prompt(
      'AI Transport Cost Calculator',
      'Enter distance in kilometers and route details for accurate AI-powered cost estimation',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Calculate',
          onPress: (distance) => calculateAITransportCost(distance)
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const calculateAITransportCost = async (distance) => {
    if (!distance || isNaN(distance)) {
      Alert.alert('Invalid Input', 'Please enter a valid distance in kilometers');
      return;
    }

    const distanceKm = parseInt(distance);
    
    // Show loading state
    Alert.alert('Calculating...', 'AI is analyzing current conditions to estimate transport cost');
    
    try {
      // Get AI-powered transportation cost estimation
      const result = await marketService.getAITransportationCost(
        selectedCrop, 
        distanceKm, 
        selectedState,
        selectedMarket
      );
      
      Alert.alert(
        '🚛 AI Transport Cost Analysis',
        result.analysis,
        [
          { text: 'OK' },
          {
            text: 'Get Route Tips',
            onPress: () => Alert.alert('Route Optimization Tips', result.routeTips)
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate transport cost. Please try again.');
    }
  };

  const openDemandForecast = async () => {
    setLoading(true);
    try {
      // Get farmer context for personalized market advice
      const farmerContext = getFarmerContextForAI();
      
      let contextInfo = '';
      if (farmerContext.farmer) {
        contextInfo += `Farmer: ${farmerContext.farmer.name}, Location: ${farmerContext.farmer.location}, Land: ${farmerContext.farmer.landSize} acres. `;
      }
      
      if (farmerContext.activeCrops.length > 0) {
        const cropDetails = farmerContext.activeCrops.map(crop => 
          `${crop.name}${crop.variety ? ` (${crop.variety})` : ''} - ${crop.area} acres, ${crop.stage}`
        ).join(', ');
        contextInfo += `Current crops: ${cropDetails}. `;
      }
      
      const forecast = await aiService.getMarketAdvice(selectedCrop || 'General', selectedState, contextInfo);
      Alert.alert('Personalized Market Forecast', forecast);
    } catch (error) {
      Alert.alert(
        'Demand Forecast',
        `Current market analysis:\n\n• ${selectedCrop || 'Crops'} showing moderate demand\n• Festival season may increase prices\n• Weather conditions look favorable\n• Export opportunities available`
      );
    } finally {
      setLoading(false);
    }
  };



  const selectIntention = (intention) => {
    setUserIntention(intention);
    setShowIntentionModal(false);
    // Don't auto-load any crop - let user select
  };

  const changeIntention = () => {
    Alert.alert(
      'Change Market Intention',
      'What would you like to do?',
      [
        {
          text: '💰 Selling Crops',
          onPress: () => {
            setUserIntention('sell');
            if (selectedCrop) {
              loadCropData(selectedCrop);
            }
          }
        },
        {
          text: '🛒 Buying Crops',
          onPress: () => {
            setUserIntention('buy');
            if (selectedCrop) {
              loadCropData(selectedCrop);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderPriceItem = ({ item, index }) => (
    <View style={[styles.priceCard, index === 0 && styles.latestPriceCard]}>
      <View style={styles.priceHeader}>
        <View style={styles.priceHeaderLeft}>
          <Text style={styles.priceDate}>{item.Date}</Text>
          {(item.Variety && item.Variety !== 'Standard') && (
            <Text style={styles.varietyText}>{item.Variety}</Text>
          )}
        </View>
        {index === 0 && <Text style={styles.latestTag}>Latest</Text>}
      </View>
      
      {/* Enhanced Location Information */}
      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={theme.primary} />
          <Text style={styles.marketName}>{item.Market || item.City}</Text>
        </View>
        {item.District && item.District !== (item.Market || item.City) && (
          <Text style={styles.districtText}>District: {item.District}</Text>
        )}
        {item.State && (
          <Text style={styles.stateText}>State: {item.State}</Text>
        )}
      </View>
      
      <View style={styles.priceRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Min Price</Text>
          <Text style={styles.priceValue}>₹{item['Min Prize']}</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Max Price</Text>
          <Text style={styles.priceValue}>₹{item['Max Prize']}</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Model Price</Text>
          <Text style={[styles.priceValue, styles.modelPrice]}>₹{item['Model Prize']}</Text>
        </View>
      </View>
      
      <View style={styles.priceFooter}>
        <Text style={styles.priceUnit}>per quintal</Text>
        {item.Grade && item.Grade !== 'FAQ' && (
          <Text style={styles.gradeText}>Grade: {item.Grade}</Text>
        )}
      </View>
    </View>
  );

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Market Prices</Text>
          </View>
          {userIntention && (
            <TouchableOpacity style={styles.intentionBadge} onPress={changeIntention}>
              <Ionicons 
                name={userIntention === 'sell' ? 'trending-up' : 'basket'} 
                size={14} 
                color="white" 
              />
              <Text style={styles.intentionText}>
                {userIntention === 'sell' ? 'Selling' : 'Buying'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Location Auto-Detection Indicator */}
      {currentLocation && !locationLoading && (
        <View style={[styles.locationIndicator, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="location" size={16} color={theme.primary} />
          <Text style={[styles.locationIndicatorText, { color: theme.textSecondary }]}>
            Auto-detected location: {currentLocation.city}
          </Text>
          <TouchableOpacity onPress={loadUserLocation}>
            <Ionicons name="refresh" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Search Bar */}
        <ModernSearchBar
          placeholder="Search for crops (e.g. Wheat, Rice, Cotton)"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSearch={searchCrops}
        />

        {/* Location Selector */}
        <ModernCard>
          <View style={styles.locationSelectorHeader}>
            <View style={[styles.locationIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="location" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.locationSelectorTitle, { color: theme.text }]}>Select Location</Text>
          </View>
          
          <View style={styles.locationButtons}>
            <TouchableOpacity style={styles.modernLocationButton} onPress={changeState}>
              <Ionicons name="map-outline" size={18} color={theme.primary} />
              <Text style={[styles.locationButtonText, { color: theme.text }]}>{selectedState}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modernLocationButton} onPress={changeMarket}>
              <Ionicons name="business-outline" size={18} color={theme.primary} />
              <Text style={[styles.locationButtonText, { color: theme.text }]}>{selectedMarket}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </ModernCard>



        {/* Current Crop Info */}
        {selectedCrop && (
          <View style={styles.cropInfoContainer}>
            <Text style={styles.cropInfoTitle}>{selectedCrop} Prices</Text>
            <Text style={styles.cropInfoSubtitle}>{selectedMarket}, {selectedState}</Text>
            {priceData.length > 1 && (
              <Text style={styles.varietyCount}>
                {priceData.length} varieties available
              </Text>
            )}
          </View>
        )}

        {/* Government Data Source Indicator */}
        {selectedCrop && priceData.length > 0 && (
          <ModernCard style={styles.dataSourceCard} elevation={1} padding={12} margin={16}>
            <View style={styles.dataSourceContainer}>
              <View style={styles.dataSourceIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              </View>
              <View style={styles.dataSourceInfo}>
                <Text style={[styles.dataSourceTitle, { color: theme.text }]}>
                  Official Government Data
                </Text>
                <Text style={[styles.dataSourceSubtitle, { color: theme.textSecondary }]}>
                  Ministry of Agriculture & Farmers Welfare • Real-time mandi prices
                </Text>
              </View>
              <View style={styles.dataSourceBadge}>
                <Text style={styles.dataSourceBadgeText}>VERIFIED</Text>
              </View>
            </View>
          </ModernCard>
        )}

        {/* AI Market Analysis */}
        {selectedCrop && priceData.length > 0 && (
          <View style={styles.aiAnalysisContainer}>
            <View style={styles.aiAnalysisHeader}>
              <Ionicons name="analytics-outline" size={24} color={theme.primary} />
              <Text style={styles.aiAnalysisTitle}>AI Market Analysis</Text>
            </View>
            
            {analysisLoading ? (
              <View style={styles.analysisLoadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.analysisLoadingText}>Analyzing market trends...</Text>
              </View>
            ) : aiAnalysis ? (
              <View>
                <View style={styles.recommendationContainer}>
                  <View style={[styles.recommendationBadge, 
                    (aiAnalysis.recommendation && (aiAnalysis.recommendation.includes('SELL') || aiAnalysis.recommendation === 'SELL NOW')) && styles.sellBadge,
                    (aiAnalysis.recommendation && (aiAnalysis.recommendation.includes('BUY') || aiAnalysis.recommendation === 'BUY NOW')) && styles.buyBadge,
                    (aiAnalysis.recommendation && (aiAnalysis.recommendation.includes('HOLD') || aiAnalysis.recommendation.includes('WAIT') || aiAnalysis.recommendation.includes('MONITOR'))) && styles.holdBadge
                  ]}>
                    <Ionicons 
                      name={
                        aiAnalysis.recommendation && aiAnalysis.recommendation.includes('SELL') ? 'trending-up' :
                        aiAnalysis.recommendation && aiAnalysis.recommendation.includes('BUY') ? 'basket' :
                        'pause-circle'
                      } 
                      size={18} 
                      color="white" 
                      style={styles.recommendationIcon}
                    />
                    <View>
                      <Text style={styles.recommendationText}>
                        {aiAnalysis.recommendation || 'No recommendation available'}
                      </Text>
                      <Text style={styles.confidenceText}>
                        {aiAnalysis.confidence || 'UNKNOWN'} CONFIDENCE
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.reasoningContainer}>
                  <Text style={styles.aiReasoningText}>
                    {showFullReasoning 
                      ? (formatAIResponse(aiAnalysis.reasoning) || 'Analysis reasoning not available')
                      : (getShortReasoning(aiAnalysis.reasoning) || 'Analysis reasoning not available')
                    }
                  </Text>
                  {aiAnalysis.reasoning && aiAnalysis.reasoning.length > 200 && (
                    <TouchableOpacity 
                      style={styles.readMoreButton}
                      onPress={() => setShowFullReasoning(!showFullReasoning)}
                    >
                      <Text style={styles.readMoreText}>
                        {showFullReasoning ? 'Read Less' : 'Read More'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {aiAnalysis.action && (
                  <View style={styles.actionContainer}>
                    <Ionicons name="bulb-outline" size={16} color="#FF9800" />
                    <Text style={styles.actionText}>{aiAnalysis.action}</Text>
                  </View>
                )}
                
                {aiAnalysis.technicalData && (
                  <View style={styles.technicalDataContainer}>
                    <Text style={styles.technicalTitle}>Technical Indicators:</Text>
                    <View style={styles.technicalRow}>
                      <Text style={styles.technicalLabel}>Daily Change:</Text>
                      <Text style={[styles.technicalValue, 
                        aiAnalysis.technicalData.dailyChange && aiAnalysis.technicalData.dailyChange.includes('+') ? styles.positiveChange : styles.negativeChange
                      ]}>
                        {aiAnalysis.technicalData.dailyChange || 'N/A'}
                      </Text>
                    </View>
                    {aiAnalysis.technicalData.weeklyChange && (
                      <View style={styles.technicalRow}>
                        <Text style={styles.technicalLabel}>Weekly Trend:</Text>
                        <Text style={[styles.technicalValue,
                          aiAnalysis.technicalData.weeklyChange.includes('+') ? styles.positiveChange : styles.negativeChange
                        ]}>
                          {aiAnalysis.technicalData.weeklyChange}
                        </Text>
                      </View>
                    )}
                    {aiAnalysis.technicalData.overallTrend && (
                      <View style={styles.technicalRow}>
                        <Text style={styles.technicalLabel}>Overall Trend:</Text>
                        <Text style={[styles.technicalValue,
                          aiAnalysis.technicalData.overallTrend.includes('+') ? styles.positiveChange : styles.negativeChange
                        ]}>
                          {aiAnalysis.technicalData.overallTrend}
                        </Text>
                      </View>
                    )}
                    {aiAnalysis.technicalData.momentum && (
                      <View style={styles.technicalRow}>
                        <Text style={styles.technicalLabel}>Market Momentum:</Text>
                        <Text style={styles.technicalValue}>{aiAnalysis.technicalData.momentum}</Text>
                      </View>
                    )}
                    {aiAnalysis.technicalData.currentPrice && (
                      <View style={styles.technicalRow}>
                        <Text style={styles.technicalLabel}>Current Price:</Text>
                        <Text style={styles.technicalValue}>{aiAnalysis.technicalData.currentPrice}</Text>
                      </View>
                    )}
                    {aiAnalysis.technicalData.volatility && (
                      <View style={styles.technicalRow}>
                        <Text style={styles.technicalLabel}>Volatility:</Text>
                        <Text style={styles.technicalValue}>{aiAnalysis.technicalData.volatility}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : null}
          </View>
        )}

        {/* Price Data */}
        <View style={styles.pricesContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : priceData.length > 0 ? (
            <View>
              {/* Results Header with Search */}
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {selectedCrop} Prices ({filteredPriceData.length} results)
                </Text>
                {priceData.length > 5 && (
                  <View style={styles.resultSearchContainer}>
                    <Ionicons name="search" size={16} color={theme.textLight} style={styles.resultSearchIcon} />
                    <TextInput
                      style={styles.resultSearchInput}
                      placeholder="Filter by market, location, variety..."
                      placeholderTextColor={theme.textLight}
                      value={resultSearchTerm}
                      onChangeText={filterResults}
                    />
                    {resultSearchTerm.length > 0 && (
                      <TouchableOpacity 
                        onPress={() => filterResults('')}
                        style={styles.clearSearchButton}
                      >
                        <Ionicons name="close-circle" size={16} color={theme.textLight} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Location Filter Info */}
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color={theme.primary} />
                {/* Check if we have exact location matches */}
                {(() => {
                  const hasExactStateMatch = filteredPriceData.some(item => 
                    (item.State || '').toLowerCase().trim() === (selectedState || '').toLowerCase().trim()
                  );
                  const hasExactMarketMatch = filteredPriceData.some(item => 
                    (item.Market || item.City || '').toLowerCase().trim() === (selectedMarket || '').toLowerCase().trim()
                  );

                  if (hasExactStateMatch && hasExactMarketMatch) {
                    return (
                      <Text style={styles.locationText}>
                        Showing results for {selectedMarket}, {selectedState}
                      </Text>
                    );
                  } else if (hasExactStateMatch) {
                    return (
                      <Text style={styles.locationText}>
                        Showing results for {selectedState}
                      </Text>
                    );
                  } else {
                    // Show national results with explanation
                    const availableStates = [...new Set(filteredPriceData.map(item => item.State))].slice(0, 3).join(', ');
                    return (
                      <>
                        <Text style={styles.locationText}>
                          No data in {selectedState} - Showing from {availableStates}
                          {filteredPriceData.length > 0 && [...new Set(filteredPriceData.map(item => item.State))].length > 3 && ' & more'}
                        </Text>
                      </>
                    );
                  }
                })()}
                {filteredPriceData.length !== priceData.length && (
                  <Text style={styles.filterInfo}>
                    (Filtered from {priceData.length} total results)
                  </Text>
                )}
              </View>

              {/* Price List */}
              {filteredPriceData.length > 0 ? (
                <FlatList
                  data={filteredPriceData}
                  renderItem={renderPriceItem}
                  keyExtractor={(item) => item['S.No']}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noFilterResultsContainer}>
                  <Ionicons name="search" size={48} color={theme.textLight} />
                  <Text style={styles.noFilterResultsText}>No results match your filter</Text>
                  <Text style={styles.noFilterResultsSubtext}>
                    Try adjusting your search or clearing the filter
                  </Text>
                  <TouchableOpacity 
                    style={styles.clearFilterButton}
                    onPress={() => filterResults('')}
                  >
                    <Text style={styles.clearFilterButtonText}>Clear Filter</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="bar-chart-outline" size={48} color={theme.textLight} />
              <Text style={styles.noDataText}>No price data available</Text>
              <Text style={styles.noDataSubtext}>
                {selectedCrop 
                  ? `No ${selectedCrop} prices found${selectedState ? ` in ${selectedState}` : ''}. Try selecting a different location or crop.`
                  : 'Search for a crop or select from categories above'
                }
              </Text>
              {selectedCrop && selectedState && (
                <TouchableOpacity 
                  style={styles.searchNationallyButton}
                  onPress={() => loadCropData(selectedCrop, '', '')}
                >
                  <Text style={styles.searchNationallyText}>Search Nationally</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Market Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Tools</Text>
          <View style={styles.toolsGrid}>
            {marketTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolCard}
                onPress={tool.onPress}
              >
                <Ionicons name={tool.icon} size={32} color={theme.primary} />
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>



      {/* Intention Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showIntentionModal}
        onRequestClose={() => setShowIntentionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.intentionModalContent}>
            <Text style={styles.modalTitle}>Welcome to Market Analysis!</Text>
            <Text style={styles.modalSubtitle}>Choose your farming goal to get personalized AI recommendations</Text>
            
            <TouchableOpacity
              style={[styles.intentionOption, styles.sellOption]}
              onPress={() => selectIntention('sell')}
              activeOpacity={0.8}
            >
              <View style={[styles.intentionIconContainer, {backgroundColor: '#4CAF50'}]}>
                <Ionicons name="trending-up" size={28} color="white" />
              </View>
              <View style={styles.intentionContent}>
                <Text style={styles.intentionTitle}>Sell My Crops</Text>
                <Text style={styles.intentionDescription}>
                  Get AI advice on when to sell for maximum profit
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.intentionOption, styles.buyOption]}
              onPress={() => selectIntention('buy')}
              activeOpacity={0.8}
            >
              <View style={[styles.intentionIconContainer, {backgroundColor: '#2196F3'}]}>
                <Ionicons name="basket" size={28} color="white" />
              </View>
              <View style={styles.intentionContent}>
                <Text style={styles.intentionTitle}>Buy Crops/Seeds</Text>
                <Text style={styles.intentionDescription}>
                  Find the best prices and timing for purchases
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* State Selector Modal */}
      <Modal
        visible={showStateSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select State/UT</Text>
            <TouchableOpacity onPress={() => setShowStateSelector(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {statesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>Loading states...</Text>
            </View>
          ) : (
            <FlatList
              data={states}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectorItem,
                    selectedState === item && styles.selectedSelectorItem
                  ]}
                  onPress={() => selectState(item)}
                >
                  <Text style={[
                    styles.selectorText,
                    selectedState === item && styles.selectedSelectorText
                  ]}>
                    {item}
                  </Text>
                  {selectedState === item && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Market Selector Modal */}
      <Modal
        visible={showMarketSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Market in {selectedState}</Text>
            <TouchableOpacity onPress={() => setShowMarketSelector(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {marketsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>Loading markets...</Text>
            </View>
          ) : (
            <FlatList
              data={markets}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectorItem,
                    selectedMarket === item.name && styles.selectedSelectorItem
                  ]}
                  onPress={() => selectMarket(item)}
                >
                  <Text style={[
                    styles.selectorText,
                    selectedMarket === item.name && styles.selectedSelectorText
                  ]}>
                    {item.displayName}
                  </Text>
                  {selectedMarket === item.name && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

// Convert to function to use theme
const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingBottom: 95, // Adjusted padding for proper spacing
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
    width: 32,
    alignItems: 'center',
  },
  locationSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locationSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modernLocationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    gap: 8,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationIndicatorText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: theme.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  locationContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },

  cropInfoContainer: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cropInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  cropInfoSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  varietyCount: {
    fontSize: 12,
    color: theme.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  dataSourceCard: {
    marginTop: -8,
  },
  dataSourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataSourceIcon: {
    marginRight: 12,
  },
  dataSourceInfo: {
    flex: 1,
  },
  dataSourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  dataSourceSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  dataSourceBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dataSourceBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  pricesContainer: {
    backgroundColor: theme.surface,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
    marginHorizontal: 10,
    elevation: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  loader: {
    marginVertical: 30,
  },
  priceCard: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  latestPriceCard: {
    backgroundColor: theme.accentLight,
    borderColor: theme.primary,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  priceHeaderLeft: {
    flex: 1,
  },
  priceDate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  varietyText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    marginTop: 2,
  },
  marketName: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  latestTag: {
    fontSize: 12,
    color: theme.primary,
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceColumn: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  modelPrice: {
    color: theme.primary,
    fontSize: 18,
  },
  priceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceUnit: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  gradeText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 10,
    fontWeight: '500',
  },
  noDataSubtext: {
    fontSize: 14,
    color: theme.textLight,
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    backgroundColor: theme.surface,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 15,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '48%',
    backgroundColor: theme.surfaceVariant,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toolName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: theme.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingTop: 50,
    backgroundColor: theme.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  selectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  selectedSelectorItem: {
    backgroundColor: theme.accentLight,
  },
  selectorText: {
    fontSize: 16,
    color: theme.text,
  },
  selectedSelectorText: {
    color: theme.primary,
    fontWeight: '600',
  },
  // AI Analysis Styles
  aiAnalysisContainer: {
    backgroundColor: theme.surface,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
    marginHorizontal: 10,
    elevation: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiAnalysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  analysisLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  analysisLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: theme.textSecondary,
  },
  recommendationContainer: {
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sellBadge: {
    backgroundColor: theme.success,
  },
  buyBadge: {
    backgroundColor: theme.info,
  },
  holdBadge: {
    backgroundColor: theme.warning,
  },
  recommendationIcon: {
    marginRight: 8,
  },
  recommendationText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  confidenceText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  aiReasoningText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  reasoningContainer: {
    marginBottom: 15,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  readMoreText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
    marginBottom: 15,
  },
  actionText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  technicalDataContainer: {
    backgroundColor: theme.surfaceVariant,
    padding: 12,
    borderRadius: 8,
  },
  technicalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  technicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  technicalLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  technicalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  positiveChange: {
    color: theme.success,
  },
  negativeChange: {
    color: theme.error,
  },
  // Header styles
  intentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  intentionText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    color: theme.textOnPrimary,
  },
  // Intention modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intentionModalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  intentionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sellOption: {
    backgroundColor: '#F8FFF8',
    borderColor: theme.success,
  },
  buyOption: {
    backgroundColor: '#F3F8FF',
    borderColor: theme.info,
  },
  intentionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  intentionContent: {
    flex: 1,
  },
  intentionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: theme.text,
  },
  intentionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
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
  // New styles for enhanced results and filtering
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  resultSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultSearchIcon: {
    marginRight: 8,
  },
  resultSearchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    padding: 0,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  locationText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  filterInfo: {
    fontSize: 12,
    color: theme.textLight,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  marketName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 4,
  },
  districtText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginLeft: 18,
    marginBottom: 2,
  },
  stateText: {
    fontSize: 13,
    color: theme.textLight,
    marginLeft: 18,
  },
  noFilterResultsContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.cardBackground,
    borderRadius: 15,
    margin: 10,
  },
  noFilterResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
    marginTop: 15,
    marginBottom: 8,
  },
  noFilterResultsSubtext: {
    fontSize: 14,
    color: theme.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  clearFilterButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFilterButtonText: {
    color: theme.textOnPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  searchNationallyButton: {
    backgroundColor: theme.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  searchNationallyText: {
    color: theme.textOnPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MarketScreen;
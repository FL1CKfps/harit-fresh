import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import aiService from '../services/aiService';
import languageService from '../services/languageService';

const ChatbotScreen = () => {
  const { theme } = useTheme();
  const { getFarmerContextForAI } = useFarmer();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Default to English
  const scrollViewRef = useRef();

  useEffect(() => {
    // Add instant hardcoded welcome message for better UX
    const initializeChat = () => {
      // Get farmer context for personalized welcome
      const farmerContext = getFarmerContextForAI();
      
      let welcomeText = 'Hello! 🌱 I am Krishita AI, your intelligent farming assistant.';
      
      if (farmerContext.farmer && farmerContext.farmer.name) {
        welcomeText = `Hello ${farmerContext.farmer.name}! 🌱 I am Krishita AI, your intelligent farming assistant.`;
        
        if (farmerContext.activeCrops.length > 0) {
          const cropNames = farmerContext.activeCrops.map(c => c.name).join(', ');
          welcomeText += `\n\nI see you're growing ${cropNames}. Great choice!`;
        }
      }
      
      welcomeText += '\n\nI can help you with:\n🌾 Crop advice & care\n🌤️ Weather insights\n🐛 Pest control\n🌱 Farming techniques\n💡 General guidance\n\nWhat would you like to know?';
      
      const welcomeMessage = {
        id: Date.now(),
        text: welcomeText,
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    };
    
    initializeChat();
  }, []);

  const getAIResponse = (question) => {
    // AI responses in English only (no Hindi translations)
    const responses = {
      'weather': 'Based on current weather conditions, expect partly cloudy weather with temperatures around 28°C. These are good conditions for most crops. I recommend monitoring humidity levels and planning irrigation accordingly.',
      'pest': 'For effective pest control, I recommend using neem-based organic pesticides. Apply during early morning or evening hours for best results. Daily crop monitoring is essential for early pest detection.',
      'soil': 'Regular soil pH testing is crucial for crop health. Most crops thrive in pH range 6.0-7.0. Adding organic compost and matter will significantly improve your soil structure and fertility.',
      'fertilizer': 'Use balanced NPK fertilizer based on your soil test results. Organic compost is always beneficial for long-term soil health and sustainability. Consider your crop growth stage when applying fertilizers.',
      'water': 'Drip irrigation is the most water-efficient method. Water during early morning hours to minimize evaporation losses. Always check soil moisture levels before irrigation to avoid overwatering.',
      'crop_care': 'For optimal crop care, maintain proper spacing, provide adequate nutrition, monitor for pests and diseases, and ensure proper irrigation. Regular field visits are essential.',
      'harvest': 'Harvest timing depends on crop maturity indicators. Monitor color changes, firmness, and moisture content. Post-harvest handling is crucial for quality preservation.'
    };

    // Simple keyword matching for responses
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('weather') || questionLower.includes('climate')) {
      return responses.weather;
    } else if (questionLower.includes('pest') || questionLower.includes('insect') || questionLower.includes('bug')) {
      return responses.pest;
    } else if (questionLower.includes('soil') || questionLower.includes('earth')) {
      return responses.soil;
    } else if (questionLower.includes('fertilizer') || questionLower.includes('nutrient') || questionLower.includes('feed')) {
      return responses.fertilizer;
    } else if (questionLower.includes('water') || questionLower.includes('irrigation')) {
      return responses.water;
    } else if (questionLower.includes('crop') || questionLower.includes('plant') || questionLower.includes('grow')) {
      return responses.crop_care;
    } else if (questionLower.includes('harvest') || questionLower.includes('reap')) {
      return responses.harvest;
    } else {
      return 'I understand your farming concern. Based on your profile and current conditions, I can provide specific guidance. For detailed technical advice, I recommend consulting with local agricultural extension officers or visiting nearby Krishi Vigyan Kendras.';
    }
  };

  const sendMessage = async (messageText = inputText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Get comprehensive farmer context for AI
      const farmerContext = getFarmerContextForAI();
      
      // Get conversation context from recent messages
      const recentMessages = messages.slice(-4); // Last 4 messages for context
      let conversationContext = '';
      
      if (recentMessages.length > 0) {
        conversationContext += `Previous conversation: ${recentMessages.map(m => `${m.isUser ? 'User' : 'Assistant'}: ${m.text}`).join('\n')}\n\n`;
      }

      // Use enhanced AI service with automatic context building (farmer profile + weather)
      console.log('🤖 Sending message to Krishta AI with comprehensive context:', messageText);
      const aiResponse = await aiService.chat(messageText, farmerContext, true, conversationContext);
      
      // Use response in English only (no translation)
      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse || 'I apologize, but I encountered an issue processing your request. Please try again or rephrase your question.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setLoading(false);

    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error processing your request. Please try again or rephrase your question.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  const handleVoicePress = () => {
    Alert.alert('Voice Input', 'Voice input feature coming soon!');
  };

  const speakMessage = (text) => {
    Alert.alert('Text to Speech', 'Text to speech feature coming soon!');
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => setMessages([]) }
      ]
    );
  };



  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        {/* Header */}
        <LinearGradient
          colors={theme.gradientPrimary}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Krishita AI</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={clearChat}
            >
              <Ionicons name="refresh" size={20} color={theme.textOnPrimary} />
              <Text style={styles.refreshText}>Clear Chat</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {messages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.botMessage
              ]}
            >
              <View style={[
                styles.messageBubble, 
                message.isUser ? styles.userBubble : styles.botBubble,
                { backgroundColor: message.isUser ? theme.primary : theme.surface, borderColor: theme.border }
              ]}>
                <Text style={[
                  styles.messageText,
                  { color: message.isUser ? theme.textOnPrimary : theme.text }
                ]}>
                  {message.text}
                </Text>
                {!message.isUser && (
                  <TouchableOpacity 
                    style={styles.speakButton}
                    onPress={() => speakMessage(message.text)}
                  >
                    <Ionicons name="volume-high" size={16} color={theme.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          
          {loading && (
            <View style={[styles.messageContainer, styles.botMessage]}>
              <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about farming..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity 
            style={[styles.voiceButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleVoicePress}
          >
            <Ionicons name="mic" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { backgroundColor: !inputText.trim() || loading ? theme.textSecondary : theme.primary },
              !inputText.trim() && styles.disabledButton
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color={theme.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme, insets) => StyleSheet.create({
  container: {
    flex: 1,
    // Remove excessive bottom padding; rely on inputContainer and messagesContainer
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: (insets?.top || 0) + 8,
    paddingBottom: 16,
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textOnPrimary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5,
  },
  refreshText: {
    color: theme.textOnPrimary,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  languageLabel: {
    fontSize: 14,
    marginRight: 12,
    fontWeight: '500',
  },
  langButton: {
    marginRight: 10,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  langGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  langText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeLangText: {
    // Dynamic color applied inline
  },
  quickQuestions: {
    paddingVertical: 12,
    paddingLeft: 15,
  },
  quickQuestionButton: {
    marginRight: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  quickQuestionGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  quickQuestionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    // Ensure last message stays above the input bar
    paddingBottom: (insets?.bottom || 0) + (Platform.OS === 'ios' ? 100 : 140),
  },
  messageContainer: {
    marginVertical: 6,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userBubble: {
    padding: 14,
  },
  botBubble: {
    padding: 14,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  speakButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    padding: 4,
  },
  loadingText: {
    fontStyle: 'italic',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10, // Compact padding
    // Use safe area inset and extra spacing on Android so navbar doesn't overlap
    paddingBottom: (insets?.bottom || 0) + (Platform.OS === 'ios' ? 12 : 40),
    // Lift the whole input card slightly above Android nav bar
    marginBottom: Platform.OS === 'android' ? 12 : 0,
    borderTopWidth: 0, // Remove border for cleaner look
    elevation: 5,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 10, // Add margins for card-like appearance
    borderRadius: 25, // Rounded corners for card look
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 25, // More rounded for modern card look
    borderWidth: 1,
    elevation: 3, // Increased elevation for better card appearance
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  textInput: {
    paddingHorizontal: 16, // Reduced from 20 to 16 for appropriate size
    paddingVertical: 10, // Slightly more compact
    maxHeight: 120,
    fontSize: 15,
    minHeight: 40, // Compact input height
  },
  voiceButton: {
    marginLeft: 10,
    borderRadius: 22,
    borderWidth: 1,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sendButton: {
    marginLeft: 10,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  disabledButton: {
    elevation: 2,
  },
});

export default ChatbotScreen;
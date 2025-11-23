import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import aiService from '../services/aiService';

const PestDetectionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { getFarmerContextForAI } = useFarmer();
  const [selectedPest, setSelectedPest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pestSymptoms, setPestSymptoms] = useState('');
  const [affectedCrop, setAffectedCrop] = useState('');

  const commonPests = [
    {
      id: 'aphids',
      name: 'Aphids',
      severity: 'Medium',
      affects: ['Vegetables', 'Fruits', 'Cereals'],
      symptoms: ['Yellowing leaves', 'Stunted growth', 'Honeydew on leaves'],
      treatment: ['Neem oil spray', 'Ladybird beetles', 'Soap water solution'],
      prevention: ['Regular monitoring', 'Companion planting', 'Remove infected plants'],
      icon: 'bug-outline'
    },
    {
      id: 'whitefly',
      name: 'Whitefly', 
      severity: 'High',
      affects: ['Tomatoes', 'Cotton', 'Vegetables'],
      symptoms: ['White insects under leaves', 'Yellow sticky honeydew', 'Leaf curling'],
      treatment: ['Yellow sticky traps', 'Reflective mulch', 'Neem-based pesticides'],
      prevention: ['Screen houses', 'Crop rotation', 'Remove weeds'],
      icon: 'airplane-outline'
    },
    {
      id: 'bollworm',
      name: 'Bollworm',
      severity: 'High',
      affects: ['Cotton', 'Corn', 'Tomatoes'],
      symptoms: ['Holes in fruits/bolls', 'Caterpillar inside', 'Damaged flowers'],
      treatment: ['Bt spray', 'Pheromone traps', 'Manual removal'],
      prevention: ['Early planting', 'Resistant varieties', 'Field monitoring'],
      icon: 'bug'
    }
  ];

  const getAIPestAnalysis = async () => {
    if (!pestSymptoms.trim()) {
      Alert.alert('Missing Information', 'Please describe the symptoms you observe.');
      return;
    }

    setLoading(true);
    try {
      // Get farmer context for personalized pest analysis
      const farmerContext = getFarmerContextForAI();
      
      // Use enhanced AI service with comprehensive context
      const response = await aiService.analyzePest(null, pestSymptoms + (affectedCrop ? ` on ${affectedCrop}` : ''), farmerContext);
      Alert.alert('Krishta AI Analysis - Personalized for Your Farm', response);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      Alert.alert('Error', 'Unable to get AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePestSelection = (pest) => {
    setSelectedPest(pest);
    setModalVisible(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return '#F44336';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#9E9E9E';
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
            <Text style={styles.headerTitle}>🐛 Pest Detection - कीट पहचान</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* AI Analysis Section */}
        <View style={styles.aiAnalysisCard}>
          <LinearGradient
            colors={theme.gradientSecondary}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="analytics-outline" size={24} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>🤖 AI Pest Analysis</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Describe symptoms for AI-powered diagnosis
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Affected Crop (Optional):</Text>
              <View style={styles.inputWrapper}>
                <LinearGradient
                  colors={[theme.surface, theme.surfaceVariant]}
                  style={styles.inputGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <TextInput
                    style={[styles.textInput, { color: theme.text }]}
                    value={affectedCrop}
                    onChangeText={setAffectedCrop}
                    placeholder="e.g., Tomato, Rice, Wheat..."
                    placeholderTextColor={theme.textSecondary}
                  />
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Symptoms Observed:</Text>
              <View style={styles.inputWrapper}>
                <LinearGradient
                  colors={[theme.surface, theme.surfaceVariant]}
                  style={styles.inputGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <TextInput
                    style={[styles.textInput, styles.multilineInput, { color: theme.text }]}
                    value={pestSymptoms}
                    onChangeText={setPestSymptoms}
                    placeholder="Describe what you see: leaf spots, holes, insects, wilting, etc."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={4}
                  />
                </LinearGradient>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.analysisButton}
              onPress={getAIPestAnalysis}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? [theme.textSecondary, theme.textLight] : theme.gradientPrimary}
                style={styles.analysisButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="analytics" size={20} color={theme.textOnPrimary} />
                <Text style={[styles.analysisButtonText, { color: theme.textOnPrimary }]}>
                  {loading ? 'Analyzing...' : 'Get AI Analysis'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions - त्वरित कार्य</Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => Alert.alert('Feature', 'Camera feature coming soon!')}
            >
              <LinearGradient
                colors={theme.gradientSecondary}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="camera" size={24} color={theme.textOnPrimary} />
                </View>
                <Text style={[styles.actionTitle, { color: theme.text }]}>Take Photo</Text>
                <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                  Identify from image
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => Alert.alert('Feature', 'Expert consultation coming soon!')}
            >
              <LinearGradient
                colors={theme.gradientSecondary}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="people" size={24} color={theme.textOnPrimary} />
                </View>
                <Text style={[styles.actionTitle, { color: theme.text }]}>Expert Help</Text>
                <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                  Consult specialists
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Common Pests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Common Pests - आम कीट</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Tap on any pest to learn more
          </Text>
          
          {commonPests.map((pest) => (
            <TouchableOpacity 
              key={pest.id} 
              style={styles.pestCard}
              onPress={() => handlePestSelection(pest)}
            >
              <LinearGradient
                colors={theme.gradientSecondary}
                style={styles.pestGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.pestHeader}>
                  <View style={[styles.pestIcon, { backgroundColor: theme.primary }]}>
                    <Ionicons name={pest.icon} size={24} color={theme.textOnPrimary} />
                  </View>
                  <View style={styles.pestInfo}>
                    <Text style={[styles.pestName, { color: theme.text }]}>{pest.name}</Text>
                    <Text style={[styles.pestAffects, { color: theme.textSecondary }]}>
                      Affects: {pest.affects.join(', ')}
                    </Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(pest.severity) }]}>
                    <Text style={styles.severityText}>{pest.severity}</Text>
                  </View>
                </View>
                <Text style={[styles.pestSymptoms, { color: theme.textSecondary }]}>
                  Main symptoms: {pest.symptoms.slice(0, 2).join(', ')}...
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Prevention Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Prevention Tips - रोकथाम सुझाव</Text>
          
          <View style={styles.tipsGrid}>
            <View style={styles.tipCard}>
              <LinearGradient
                colors={theme.gradientSecondary}
                style={styles.tipGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.tipIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="eye" size={20} color={theme.textOnPrimary} />
                </View>
                <Text style={[styles.tipTitle, { color: theme.text }]}>Regular Monitoring</Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Weekly crop inspection
                </Text>
              </LinearGradient>
            </View>
            
            <View style={styles.tipCard}>
              <LinearGradient
                colors={theme.gradientSecondary}
                style={styles.tipGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.tipIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="leaf" size={20} color={theme.textOnPrimary} />
                </View>
                <Text style={[styles.tipTitle, { color: theme.text }]}>Crop Rotation</Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Break pest cycles
                </Text>
              </LinearGradient>
            </View>
            
            <View style={styles.tipCard}>
              <LinearGradient
                colors={theme.gradientSecondary}
                style={styles.tipGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.tipIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="water" size={20} color={theme.textOnPrimary} />
                </View>
                <Text style={[styles.tipTitle, { color: theme.text }]}>Proper Irrigation</Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Avoid over-watering
                </Text>
              </LinearGradient>
            </View>
            
            <View style={styles.tipCard}>
              <LinearGradient
                colors={theme.gradientSecondary}
                style={styles.tipGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.tipIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="trash" size={20} color={theme.textOnPrimary} />
                </View>
                <Text style={[styles.tipTitle, { color: theme.text }]}>Field Sanitation</Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Remove crop residues
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pest Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {selectedPest && (
              <>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedPest.name}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Affects:</Text>
                    <Text style={[styles.modalSectionText, { color: theme.textSecondary }]}>
                      {selectedPest.affects?.join(', ')}
                    </Text>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Symptoms:</Text>
                    {selectedPest.symptoms?.map((symptom, index) => (
                      <Text key={index} style={[styles.modalBullet, { color: theme.textSecondary }]}>
                        • {symptom}
                      </Text>
                    ))}
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Treatment:</Text>
                    {selectedPest.treatment?.map((treatment, index) => (
                      <Text key={index} style={[styles.modalBullet, { color: theme.textSecondary }]}>
                        • {treatment}
                      </Text>
                    ))}
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Prevention:</Text>
                    {selectedPest.prevention?.map((prevention, index) => (
                      <Text key={index} style={[styles.modalBullet, { color: theme.textSecondary }]}>
                        • {prevention}
                      </Text>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  // AI Analysis Card Styles
  aiAnalysisCard: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 18,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inputGradient: {
    borderRadius: 12,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  analysisButton: {
    marginTop: 10,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  analysisButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
  },
  analysisButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  actionGradient: {
    padding: 18,
    alignItems: 'center',
    borderRadius: 18,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  pestCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  pestGradient: {
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  pestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pestIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pestInfo: {
    flex: 1,
  },
  pestName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  pestAffects: {
    fontSize: 12,
    lineHeight: 16,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  pestSymptoms: {
    fontSize: 12,
    lineHeight: 16,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tipCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  tipGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalBullet: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default PestDetectionScreen;

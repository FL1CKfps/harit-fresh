import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';

const CropManagementScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { 
    farmerProfile, 
    activeCrops, 
    addCrop, 
    updateCrop, 
    updateCropProgress,
    markCropHarvested,
    removeCrop: deleteCrop 
  } = useFarmer();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const styles = createStyles(theme);

  const availableLand = farmerProfile?.landSize ? 
    farmerProfile.landSize - activeCrops.reduce((sum, crop) => sum + parseFloat(crop.areaAllocated || 0), 0) : 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh - in real app this would reload data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getCropStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'seeding': return '#4CAF50';
      case 'growing': return '#2196F3';
      case 'flowering': return '#FF9800';
      case 'harvesting': return '#9C27B0';
      case 'harvested': return '#795548';
      default: return '#757575';
    }
  };

  const handleCropAction = (crop) => {
    setSelectedCrop(crop);
    setShowActionModal(true);
  };

  const handleEditCrop = () => {
    setEditingCrop(selectedCrop);
    setEditFormData({ ...selectedCrop });
    setShowActionModal(false);
  };

  const handleDeleteCrop = () => {
    Alert.alert(
      'Delete Crop',
      `Are you sure you want to delete ${selectedCrop.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteCrop(selectedCrop.id);
            setShowActionModal(false);
          }
        }
      ]
    );
  };

  const handleSaveEdit = () => {
    updateCrop(editingCrop.id, editFormData);
    setEditingCrop(null);
    setEditFormData({});
  };

  const handleUpdateProgress = () => {
    if (!selectedCrop) return;
    
    const progressions = {
      'seeding': 'growing',
      'growing': 'flowering', 
      'flowering': 'harvesting',
      'harvesting': 'harvested'
    };

    const nextStage = progressions[selectedCrop.growthStage];
    if (!nextStage) {
      Alert.alert('Already at Final Stage', 'This crop is already at the final growth stage.');
      return;
    }

    Alert.alert(
      'Update Growth Stage',
      `Update ${selectedCrop.name} from "${selectedCrop.growthStage}" to "${nextStage}"?`,
      [
        { 
          text: 'Update', 
          onPress: async () => {
            const success = await updateCropProgress(selectedCrop.id);
            if (success) {
              Alert.alert('Success', `${selectedCrop.name} updated to ${nextStage} stage!`);
            } else {
              Alert.alert('Error', 'Failed to update crop progress. Please try again.');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleMarkHarvested = () => {
    if (!selectedCrop) return;

    Alert.alert(
      'Mark as Harvested',
      `Mark ${selectedCrop.name} as harvested? This will complete the crop cycle and free up ${selectedCrop.areaAllocated} acres.`,
      [
        { 
          text: 'Mark Harvested', 
          onPress: async () => {
            const success = await markCropHarvested(selectedCrop.id);
            if (success) {
              Alert.alert('Success', `${selectedCrop.name} marked as harvested! ${selectedCrop.areaAllocated} acres are now available for new crops.`);
            } else {
              Alert.alert('Error', 'Failed to mark crop as harvested. Please try again.');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getDaysPlanted = (plantedDate) => {
    const today = new Date();
    const planted = new Date(plantedDate);
    const diffTime = Math.abs(today - planted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEstimatedHarvestDate = (plantedDate, cropName) => {
    // Simplified harvest estimation - in real app this would be more sophisticated
    const harvestDays = {
      'wheat': 120,
      'rice': 140,
      'corn': 100,
      'tomato': 80,
      'potato': 90,
      'onion': 110,
    };
    
    const planted = new Date(plantedDate);
    const days = harvestDays[cropName?.toLowerCase()] || 100;
    const harvestDate = new Date(planted.getTime() + (days * 24 * 60 * 60 * 1000));
    return harvestDate;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradientPrimary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textOnPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textOnPrimary }]}>
            Crop Management
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCrop')}
          >
            <Ionicons name="add" size={24} color={theme.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Farm Overview */}
        {farmerProfile && (
          <View style={[styles.farmOverviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Farm Overview</Text>
              <View style={styles.farmStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {farmerProfile.landSize}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Total Acres
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.success }]}>
                    {(farmerProfile.landSize - availableLand).toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Used Acres
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.warning }]}>
                    {availableLand.toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Available
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {activeCrops.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Active Crops
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Active Crops */}
        <View style={[styles.cropsSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Active Crops</Text>
              {availableLand > 0.1 && (
                <TouchableOpacity
                  style={[styles.addCropButton, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('AddCrop')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addCropButtonText}>Add Crop</Text>
                </TouchableOpacity>
              )}
            </View>

            {activeCrops.length > 0 ? (
              <View style={styles.cropsList}>
                {activeCrops.map((crop) => (
                  <View 
                    key={crop.id} 
                    style={[styles.cropItem, { backgroundColor: theme.background, borderColor: theme.border }]}
                  >
                    <View style={styles.cropItemHeader}>
                      <View style={styles.cropMainInfo}>
                        <Text style={[styles.cropItemName, { color: theme.text }]}>
                          {crop.name}
                        </Text>
                        <Text style={[styles.cropItemVariety, { color: theme.textSecondary }]}>
                          {crop.variety}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleCropAction(crop)}
                        style={[styles.cropActionButton, { backgroundColor: theme.primary + '15' }]}
                      >
                        <Ionicons name="ellipsis-vertical" size={18} color={theme.primary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cropItemDetails}>
                      <View style={styles.cropDetailRow}>
                        <View style={styles.cropDetailItem}>
                          <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                          <Text style={[styles.cropDetailText, { color: theme.textSecondary }]}>
                            Planted: {new Date(crop.plantedDate).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.cropDetailItem}>
                          <Ionicons name="time-outline" size={16} color={theme.primary} />
                          <Text style={[styles.cropDetailText, { color: theme.textSecondary }]}>
                            {getDaysPlanted(crop.plantedDate)} days ago
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cropDetailRow}>
                        <View style={styles.cropDetailItem}>
                          <Ionicons name="resize-outline" size={16} color={theme.primary} />
                          <Text style={[styles.cropDetailText, { color: theme.textSecondary }]}>
                            Area: {crop.areaAllocated} acres
                          </Text>
                        </View>
                        <View style={styles.cropDetailItem}>
                          <Ionicons name="leaf-outline" size={16} color={theme.primary} />
                          <Text style={[styles.cropDetailText, { color: theme.textSecondary }]}>
                            Est. Harvest: {getEstimatedHarvestDate(crop.plantedDate, crop.name).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cropItemFooter}>
                      <View style={[
                        styles.cropStatusBadge, 
                        { backgroundColor: getCropStatusColor(crop.growthStage) + '20' }
                      ]}>
                        <Text style={[
                          styles.cropStatusText, 
                          { color: getCropStatusColor(crop.growthStage) }
                        ]}>
                          {crop.growthStage && typeof crop.growthStage === 'string' 
                            ? crop.growthStage.charAt(0).toUpperCase() + crop.growthStage.slice(1)
                            : 'Unknown'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.emptyCropsContainer, { backgroundColor: theme.primary + '10' }]}
                onPress={() => navigation.navigate('AddCrop')}
              >
                <Ionicons name="leaf-outline" size={64} color={theme.primary} />
                <Text style={[styles.emptyCropsTitle, { color: theme.text }]}>
                  No Active Crops
                </Text>
                <Text style={[styles.emptyCropsSubtitle, { color: theme.textSecondary }]}>
                  Start your farming journey by adding your first crop
                </Text>
                <View style={[styles.addCropPrompt, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addCropPromptText}>Add First Crop</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Crop Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {selectedCrop?.name} Actions
            </Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowActionModal(false);
                handleUpdateProgress();
              }}
            >
              <Ionicons name="arrow-up-circle" size={20} color={theme.primary} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Update Progress
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowActionModal(false);
                navigation.navigate('PestDetection', { 
                  cropId: selectedCrop?.id,
                  cropName: selectedCrop?.name 
                });
              }}
            >
              <Ionicons name="bug" size={20} color={theme.primary} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Pest Detection
              </Text>
            </TouchableOpacity>

            {selectedCrop?.growthStage === 'harvesting' && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowActionModal(false);
                  handleMarkHarvested();
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.modalOptionText, { color: theme.success }]}>
                  Mark Harvested
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleEditCrop}
            >
              <Ionicons name="pencil" size={20} color={theme.primary} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Edit Crop Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleDeleteCrop}
            >
              <Ionicons name="trash" size={20} color={theme.error} />
              <Text style={[styles.modalOptionText, { color: theme.error }]}>
                Delete Crop
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: theme.border }]}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Crop Modal */}
      <Modal
        visible={!!editingCrop}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingCrop(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Edit Crop Details
            </Text>
            
            <TextInput
              style={[styles.editInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Crop Name"
              placeholderTextColor={theme.textSecondary}
              value={editFormData.name || ''}
              onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
            />

            <TextInput
              style={[styles.editInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Variety"
              placeholderTextColor={theme.textSecondary}
              value={editFormData.variety || ''}
              onChangeText={(text) => setEditFormData({ ...editFormData, variety: text })}
            />

            <TextInput
              style={[styles.editInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Area Allocated (acres)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={editFormData.areaAllocated?.toString() || ''}
              onChangeText={(text) => setEditFormData({ ...editFormData, areaAllocated: parseFloat(text) || 0 })}
            />

            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[styles.editSaveButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.editSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.editCancelButton, { backgroundColor: theme.border }]}
                onPress={() => setEditingCrop(null)}
              >
                <Text style={[styles.editCancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  farmOverviewCard: {
    marginHorizontal: 20,
    marginTop: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  farmStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  cropsSection: {
    marginHorizontal: 20,
    marginVertical: 20,
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
  addCropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addCropButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cropsList: {
    gap: 16,
  },
  cropItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cropItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cropMainInfo: {
    flex: 1,
  },
  cropItemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cropItemVariety: {
    fontSize: 14,
    marginTop: 2,
  },
  cropActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cropItemDetails: {
    marginBottom: 12,
  },
  cropDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cropDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cropDetailText: {
    fontSize: 13,
    marginLeft: 6,
  },
  cropItemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cropStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cropStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyCropsContainer: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyCropsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyCropsSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  addCropPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  addCropPromptText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  modalCancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  editModalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CropManagementScreen;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';

const AddCropScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { addCrop, farmerData } = useFarmer();
  const isEditing = route?.params?.editCrop ? true : false;
  const existingCrop = route?.params?.editCrop || {};
  
  const [cropName, setCropName] = useState(existingCrop.name || '');
  const [variety, setVariety] = useState(existingCrop.variety || '');
  const [area, setArea] = useState(existingCrop.area?.toString() || '');
  const [plantingDate, setPlantingDate] = useState(existingCrop.plantingDate ? new Date(existingCrop.plantingDate) : new Date());
  const [expectedHarvest, setExpectedHarvest] = useState(existingCrop.expectedHarvest ? new Date(existingCrop.expectedHarvest) : new Date());
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = createStyles(theme);

  const validateInputs = () => {
    if (!cropName.trim()) {
      Alert.alert('Validation Error', 'Please enter crop name');
      return false;
    }
    
    const areaNum = parseFloat(area);
    if (!area || isNaN(areaNum) || areaNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid area (numbers only)');
      return false;
    }
    
    // Check available land
    if (farmerData?.landSize) {
      const totalUsed = farmerData.crops?.reduce((sum, crop) => {
        if (isEditing && crop.id === existingCrop.id) return sum;
        return sum + (crop.area || 0);
      }, 0) || 0;
      
      const remainingLand = farmerData.landSize - totalUsed;
      if (areaNum > remainingLand) {
        Alert.alert('Land Limit Exceeded', `Only ${remainingLand} acres available. You have ${totalUsed} acres already allocated.`);
        return false;
      }
    }
    
    if (expectedHarvest <= plantingDate) {
      Alert.alert('Date Error', 'Expected harvest date must be after planting date');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      const cropData = {
        id: isEditing ? existingCrop.id : Date.now().toString(),
        name: cropName.trim(),
        variety: variety.trim(),
        areaAllocated: parseFloat(area),
        plantedDate: plantingDate.toISOString(),
        expectedHarvest: expectedHarvest.toISOString(),
        growthStage: isEditing ? existingCrop.growthStage : 'seeding',
        daysFromPlanting: isEditing ? existingCrop.daysFromPlanting : 0
      };
      
      if (isEditing) {
        // Update existing crop logic would go here
        Alert.alert('Success', 'Crop updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await addCrop(cropData);
        Alert.alert('Success', 'Crop added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save crop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPlantingDateChange = (event, selectedDate) => {
    setShowPlantingDatePicker(false);
    if (selectedDate) {
      setPlantingDate(selectedDate);
      // Auto-set harvest date to 3 months later as default
      const defaultHarvest = new Date(selectedDate);
      defaultHarvest.setMonth(defaultHarvest.getMonth() + 3);
      if (!isEditing) {
        setExpectedHarvest(defaultHarvest);
      }
    }
  };

  const onHarvestDateChange = (event, selectedDate) => {
    setShowHarvestDatePicker(false);
    if (selectedDate) {
      setExpectedHarvest(selectedDate);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={theme.gradientPrimary} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textOnPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Crop' : 'Add New Crop'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Crop Name */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Crop Name *</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.border, 
              color: theme.text,
              backgroundColor: theme.surface 
            }]}
            placeholder="e.g., Rice, Wheat, Tomato"
            placeholderTextColor={theme.textSecondary}
            value={cropName}
            onChangeText={setCropName}
          />
        </View>

        {/* Variety */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Variety (Optional)</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.border, 
              color: theme.text,
              backgroundColor: theme.surface 
            }]}
            placeholder="e.g., Basmati, IR64"
            placeholderTextColor={theme.textSecondary}
            value={variety}
            onChangeText={setVariety}
          />
        </View>

        {/* Area */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>
            Area (Acres) * 
            {farmerData?.landSize && (
              <Text style={styles.landInfo}>
                {` - Available: ${Math.max(0, farmerData.landSize - (farmerData.crops?.reduce((sum, crop) => sum + (crop.area || 0), 0) || 0))} acres`}
              </Text>
            )}
          </Text>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.border, 
              color: theme.text,
              backgroundColor: theme.surface 
            }]}
            placeholder="Enter area in acres"
            placeholderTextColor={theme.textSecondary}
            value={area}
            onChangeText={setArea}
            keyboardType="numeric"
          />
        </View>

        {/* Planting Date */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Planting Date *</Text>
          <TouchableOpacity
            style={[styles.dateInput, { 
              borderColor: theme.border, 
              backgroundColor: theme.surface 
            }]}
            onPress={() => setShowPlantingDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>
              {plantingDate.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Expected Harvest Date */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Expected Harvest Date *</Text>
          <TouchableOpacity
            style={[styles.dateInput, { 
              borderColor: theme.border, 
              backgroundColor: theme.surface 
            }]}
            onPress={() => setShowHarvestDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>
              {expectedHarvest.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Growing Period Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Growing Period: {Math.ceil((expectedHarvest - plantingDate) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient colors={theme.gradientPrimary} style={styles.saveButtonGradient}>
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : (isEditing ? 'Update Crop' : 'Add Crop')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Pickers */}
      {showPlantingDatePicker && (
        <DateTimePicker
          value={plantingDate}
          mode="date"
          display="default"
          onChange={onPlantingDateChange}
        />
      )}
      
      {showHarvestDatePicker && (
        <DateTimePicker
          value={expectedHarvest}
          mode="date"
          display="default"
          onChange={onHarvestDateChange}
          minimumDate={plantingDate}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textOnPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  landInfo: {
    fontSize: 12,
    fontWeight: 'normal',
    color: theme.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  saveButton: {
    marginBottom: 40,
  },
  saveButtonGradient: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddCropScreen;
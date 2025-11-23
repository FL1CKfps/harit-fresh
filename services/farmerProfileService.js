// Farmer Profile Service for Firestore operations
// This service handles farmer profile data storage and management

import { 
  getFirestore,
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FarmerProfileService {
  constructor() {
    this.db = db;
    this.farmersCollection = 'farmers';
    this.cropsCollection = 'farmer_crops';
  }

  /**
   * Create or update farmer profile in Firestore
   * @param {Object} farmerData - Farmer profile data from onboarding
   * @returns {Promise<string>} - The farmer document ID
   */
  async saveFarmerProfile(farmerData) {
    try {
      // Generate a unique farmer ID if not provided
      const farmerId = farmerData.id || this.generateFarmerId();
      
      const farmerProfile = {
        id: farmerId,
        name: farmerData.name || 'Unknown Farmer',
        phone: farmerData.phone || '',
        email: farmerData.email || null,
        language: farmerData.language || 'hi',
        // Handle location fields - use existing or extract from location field
        state: farmerData.state || this.extractLocationPart(farmerData.location, 'state') || 'Unknown',
        district: farmerData.district || this.extractLocationPart(farmerData.location, 'district') || 'Unknown',
        village: farmerData.village || this.extractLocationPart(farmerData.location, 'village') || 'Unknown',
        pincode: farmerData.pincode || '',
        // Handle farm size - support both farmSize and landSize
        farmSize: farmerData.farmSize || farmerData.landSize || 0, // in acres
        farmingExperience: farmerData.farmingExperience || farmerData.experience || 0, // in years
        primaryCrops: farmerData.primaryCrops || [],
        farmingType: farmerData.farmingType || 'conventional', // 'organic', 'conventional', 'mixed'
        irrigationType: farmerData.irrigationType || 'rainfed', // 'drip', 'sprinkler', 'flood', 'rainfed'
        soilType: farmerData.soilType || 'Unknown',
        coordinates: farmerData.coordinates || null, // {latitude, longitude}
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        profileCompleted: true
      };

      // Use setDoc with farmerId to create/update the document with specific ID
      const farmerRef = doc(this.db, this.farmersCollection, farmerId);
      await setDoc(farmerRef, farmerProfile, { merge: true });
      
      // Save to local storage for offline access
      await AsyncStorage.setItem('farmerProfile', JSON.stringify({
        ...farmerProfile,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      console.log('Farmer profile saved successfully:', farmerId);
      return farmerId;
    } catch (error) {
      console.error('Error saving farmer profile:', error);
      throw new Error('Failed to save farmer profile');
    }
  }

  /**
   * Get farmer profile from Firestore
   * @param {string} farmerId - Farmer ID
   * @returns {Promise<Object>} - Farmer profile data
   */
  async getFarmerProfile(farmerId) {
    try {
      const farmerRef = doc(this.db, this.farmersCollection, farmerId);
      const farmerSnap = await getDoc(farmerRef);
      
      if (farmerSnap.exists()) {
        const data = farmerSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      } else {
        throw new Error('Farmer profile not found');
      }
    } catch (error) {
      console.error('Error fetching farmer profile:', error);
      throw new Error('Failed to fetch farmer profile');
    }
  }

  /**
   * Update farmer profile
   * @param {string} farmerId - Farmer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateFarmerProfile(farmerId, updateData) {
    try {
      const farmerRef = doc(this.db, this.farmersCollection, farmerId);
      await updateDoc(farmerRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // Update local storage
      const localProfile = await AsyncStorage.getItem('farmerProfile');
      if (localProfile) {
        const profile = JSON.parse(localProfile);
        const updatedProfile = { ...profile, ...updateData, updatedAt: new Date() };
        await AsyncStorage.setItem('farmerProfile', JSON.stringify(updatedProfile));
      }
      
      console.log('Farmer profile updated successfully');
    } catch (error) {
      console.error('Error updating farmer profile:', error);
      throw new Error('Failed to update farmer profile');
    }
  }

  /**
   * Add or update crop information for a farmer
   * @param {string} farmerId - Farmer ID
   * @param {Object} cropData - Crop information
   * @returns {Promise<string>} - Crop document ID
   */
  async saveFarmerCrop(farmerId, cropData) {
    try {
      const crop = {
        farmerId: farmerId,
        cropName: cropData.cropName,
        variety: cropData.variety,
        areaPlanted: cropData.areaPlanted, // in acres
        plantingDate: cropData.plantingDate,
        expectedHarvestDate: cropData.expectedHarvestDate,
        season: cropData.season, // 'kharif', 'rabi', 'zaid'
        status: cropData.status || 'active', // 'active', 'harvested', 'failed'
        notes: cropData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const docRef = await addDoc(collection(this.db, this.cropsCollection), crop);
      console.log('Farmer crop saved successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving farmer crop:', error);
      throw new Error('Failed to save farmer crop');
    }
  }

  /**
   * Get all crops for a farmer
   * @param {string} farmerId - Farmer ID
   * @returns {Promise<Array>} - Array of crop data
   */
  async getFarmerCrops(farmerId) {
    try {
      const q = query(
        collection(this.db, this.cropsCollection),
        where('farmerId', '==', farmerId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const crops = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        crops.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          plantingDate: data.plantingDate?.toDate ? data.plantingDate.toDate() : data.plantingDate,
          expectedHarvestDate: data.expectedHarvestDate?.toDate ? data.expectedHarvestDate.toDate() : data.expectedHarvestDate
        });
      });
      
      console.log(`Fetched ${crops.length} crops for farmer ${farmerId}`);
      return crops;
    } catch (error) {
      console.error('Error fetching farmer crops:', error);
      throw new Error('Failed to fetch farmer crops');
    }
  }

  /**
   * Search farmers by location (state, district)
   * @param {string} state - State name
   * @param {string} district - District name (optional)
   * @returns {Promise<Array>} - Array of farmers in the location
   */
  async getFarmersByLocation(state, district = null) {
    try {
      let q = query(
        collection(this.db, this.farmersCollection),
        where('state', '==', state),
        where('isActive', '==', true)
      );
      
      if (district) {
        q = query(q, where('district', '==', district));
      }
      
      const querySnapshot = await getDocs(q);
      const farmers = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        farmers.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      console.log(`Found ${farmers.length} farmers in ${state}${district ? `, ${district}` : ''}`);
      return farmers;
    } catch (error) {
      console.error('Error searching farmers by location:', error);
      throw new Error('Failed to search farmers');
    }
  }

  /**
   * Get or create farmer ID from local storage or generate new one
   * @returns {Promise<string>} - Farmer ID
   */
  async getFarmerIdFromStorage() {
    try {
      const farmerProfile = await AsyncStorage.getItem('farmerProfile');
      if (farmerProfile) {
        const profile = JSON.parse(farmerProfile);
        return profile.id;
      }
      return null;
    } catch (error) {
      console.error('Error getting farmer ID from storage:', error);
      return null;
    }
  }

  /**
   * Generate a unique farmer ID
   * @returns {string} - Generated farmer ID
   */
  generateFarmerId() {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `farmer_${timestamp}_${randomNum}`;
  }

  /**
   * Check if farmer profile exists in local storage
   * @returns {Promise<boolean>} - Whether profile exists
   */
  async hasLocalProfile() {
    try {
      const farmerProfile = await AsyncStorage.getItem('farmerProfile');
      return farmerProfile !== null;
    } catch (error) {
      console.error('Error checking local profile:', error);
      return false;
    }
  }

  /**
   * Get farmer profile from local storage
   * @returns {Promise<Object|null>} - Farmer profile or null
   */
  async getLocalProfile() {
    try {
      const farmerProfile = await AsyncStorage.getItem('farmerProfile');
      if (farmerProfile) {
        return JSON.parse(farmerProfile);
      }
      return null;
    } catch (error) {
      console.error('Error getting local profile:', error);
      return null;
    }
  }

  /**
   * Sync local profile with Firestore
   * @returns {Promise<void>}
   */
  async syncProfile() {
    try {
      const localProfile = await this.getLocalProfile();
      if (localProfile && localProfile.id) {
        // Try to fetch from Firestore and update local if different
        try {
          const firestoreProfile = await this.getFarmerProfile(localProfile.id);
          // Compare and update local if needed
          if (firestoreProfile.updatedAt > localProfile.updatedAt) {
            await AsyncStorage.setItem('farmerProfile', JSON.stringify(firestoreProfile));
            console.log('Local profile synced with Firestore');
          }
        } catch (error) {
          console.log('Profile not found in Firestore, will sync local to cloud');
          await this.saveFarmerProfile(localProfile);
        }
      }
    } catch (error) {
      console.error('Error syncing profile:', error);
    }
  }

  /**
   * Helper function to extract location parts from a location string
   * @param {string} locationString - Location string like "Village, District, State"
   * @param {string} part - Which part to extract ('village', 'district', 'state')
   * @returns {string} - Extracted part or empty string
   */
  extractLocationPart(locationString, part) {
    if (!locationString || typeof locationString !== 'string') {
      return '';
    }
    
    const parts = locationString.split(',').map(p => p.trim());
    
    switch (part) {
      case 'village':
        return parts[0] || '';
      case 'district':
        return parts[1] || '';
      case 'state':
        return parts[2] || parts[parts.length - 1] || '';
      default:
        return '';
    }
  }
}

// Export singleton instance
const farmerProfileService = new FarmerProfileService();
export default farmerProfileService;

export { FarmerProfileService };
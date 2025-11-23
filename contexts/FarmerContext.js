import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import farmerProfileService from '../services/farmerProfileService';

const FarmerContext = createContext();

export const useFarmer = () => {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used within a FarmerProvider');
  }
  return context;
};

export const FarmerProvider = ({ children }) => {
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [crops, setCrops] = useState([]);
  const [landSections, setLandSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Load farmer data on app start
  useEffect(() => {
    loadFarmerData();
  }, []);

  const loadFarmerData = async () => {
    try {
      setIsLoading(true);
      
      // Load farmer profile
      const profileData = await AsyncStorage.getItem('farmerProfile');
      if (profileData) {
        setFarmerProfile(JSON.parse(profileData));
      }

      // Load crops data
      const cropsData = await AsyncStorage.getItem('farmerCrops');
      if (cropsData) {
        setCrops(JSON.parse(cropsData));
      }

      // Load land sections
      const landData = await AsyncStorage.getItem('landSections');
      if (landData) {
        setLandSections(JSON.parse(landData));
      }

      // Check onboarding status
      const onboardingStatus = await AsyncStorage.getItem('isOnboardingComplete');
      setIsOnboardingComplete(onboardingStatus === 'true');

    } catch (error) {
      console.error('Error loading farmer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFarmerProfile = async (updatedProfile) => {
    try {
      const newProfile = { ...farmerProfile, ...updatedProfile };
      
      // Generate ID if profile doesn't have one
      if (!newProfile.id) {
        newProfile.id = `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Save to local storage
      await AsyncStorage.setItem('farmerProfile', JSON.stringify(newProfile));
      setFarmerProfile(newProfile);
      
      // Sync to Firebase if profile has an ID
      if (newProfile.id) {
        try {
          await farmerProfileService.saveFarmerProfile(newProfile);
        } catch (firebaseError) {
          console.warn('Failed to sync profile to Firebase:', firebaseError);
          // Still return true as local update succeeded
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating farmer profile:', error);
      return false;
    }
  };

  const addCrop = async (cropData) => {
    try {
      const newCrop = {
        id: Date.now().toString(),
        ...cropData,
        addedAt: new Date().toISOString(),
        status: 'planted', // planted, growing, harvesting, harvested
      };
      
      const updatedCrops = [...crops, newCrop];
      await AsyncStorage.setItem('farmerCrops', JSON.stringify(updatedCrops));
      setCrops(updatedCrops);
      return newCrop;
    } catch (error) {
      console.error('Error adding crop:', error);
      return null;
    }
  };

  const updateCrop = async (cropId, updates) => {
    try {
      const updatedCrops = crops.map(crop => 
        crop.id === cropId 
          ? { ...crop, ...updates, updatedAt: new Date().toISOString() }
          : crop
      );
      
      await AsyncStorage.setItem('farmerCrops', JSON.stringify(updatedCrops));
      setCrops(updatedCrops);
      return true;
    } catch (error) {
      console.error('Error updating crop:', error);
      return false;
    }
  };

  const updateCropProgress = async (cropId) => {
    try {
      const crop = crops.find(c => c.id === cropId);
      if (!crop) return false;

      const progressions = {
        'seeding': 'growing',
        'growing': 'flowering',
        'flowering': 'harvesting',
        'harvesting': 'harvested'
      };

      const nextStage = progressions[crop.growthStage];
      if (!nextStage) return false; // Already at final stage

      const updatedCrops = crops.map(c => 
        c.id === cropId 
          ? { 
              ...c, 
              growthStage: nextStage,
              updatedAt: new Date().toISOString()
            }
          : c
      );
      
      await AsyncStorage.setItem('farmerCrops', JSON.stringify(updatedCrops));
      setCrops(updatedCrops);
      return true;
    } catch (error) {
      console.error('Error updating crop progress:', error);
      return false;
    }
  };

  const markCropHarvested = async (cropId) => {
    try {
      const updatedCrops = crops.map(crop => 
        crop.id === cropId 
          ? { 
              ...crop, 
              growthStage: 'harvested',
              harvestedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : crop
      );
      
      await AsyncStorage.setItem('farmerCrops', JSON.stringify(updatedCrops));
      setCrops(updatedCrops);
      return true;
    } catch (error) {
      console.error('Error marking crop as harvested:', error);
      return false;
    }
  };

  const removeCrop = async (cropId) => {
    try {
      const updatedCrops = crops.filter(crop => crop.id !== cropId);
      await AsyncStorage.setItem('farmerCrops', JSON.stringify(updatedCrops));
      setCrops(updatedCrops);
      return true;
    } catch (error) {
      console.error('Error removing crop:', error);
      return false;
    }
  };

  const addLandSection = async (sectionData) => {
    try {
      const newSection = {
        id: Date.now().toString(),
        ...sectionData,
        createdAt: new Date().toISOString(),
      };
      
      const updatedSections = [...landSections, newSection];
      await AsyncStorage.setItem('landSections', JSON.stringify(updatedSections));
      setLandSections(updatedSections);
      return newSection;
    } catch (error) {
      console.error('Error adding land section:', error);
      return null;
    }
  };

  const updateLandSection = async (sectionId, updates) => {
    try {
      const updatedSections = landSections.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates, updatedAt: new Date().toISOString() }
          : section
      );
      
      await AsyncStorage.setItem('landSections', JSON.stringify(updatedSections));
      setLandSections(updatedSections);
      return true;
    } catch (error) {
      console.error('Error updating land section:', error);
      return false;
    }
  };

  // Get comprehensive farmer context for AI
  const getFarmerContextForAI = () => {
    const context = {
      farmer: farmerProfile ? {
        name: farmerProfile.name,
        location: farmerProfile.location,
        state: farmerProfile.state || 'Not specified',
        district: farmerProfile.district || 'Not specified',
        village: farmerProfile.village || 'Not specified',
        landSize: farmerProfile.landSize,
        soilType: farmerProfile.soilType,
        experience: farmerProfile.experience,
        farmingMethod: farmerProfile.farmingMethod || 'Traditional',
        irrigationType: farmerProfile.irrigationType || 'Rain-fed',
        waterSource: farmerProfile.waterSource || 'Unknown',
        soilPH: farmerProfile.soilPH || 'Unknown',
        primaryCrops: farmerProfile.primaryCrops || [],
        farmEquipment: farmerProfile.farmEquipment || [],
        livestockCount: farmerProfile.livestockCount || 0,
        farmCertifications: farmerProfile.farmCertifications || [],
      } : null,
      activeCrops: crops.filter(crop => 
        crop.status === 'planted' || crop.status === 'growing'
      ).map(crop => ({
        name: crop.name,
        variety: crop.variety,
        plantedDate: crop.plantedDate,
        expectedHarvest: crop.expectedHarvestDate,
        stage: crop.growthStage,
        area: crop.areaAllocated,
        status: crop.status,
      })),
      recentHarvests: crops.filter(crop => 
        crop.status === 'harvested' && 
        crop.harvestedDate && 
        new Date(crop.harvestedDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      ).map(crop => ({
        name: crop.name,
        harvestedDate: crop.harvestedDate,
        yield: crop.actualYield,
        quality: crop.quality,
      })),
      landUtilization: {
        totalArea: farmerProfile?.landSize || 0,
        usedArea: crops.reduce((total, crop) => total + (parseFloat(crop.areaAllocated) || 0), 0),
        availableArea: (farmerProfile?.landSize || 0) - crops.reduce((total, crop) => total + (parseFloat(crop.areaAllocated) || 0), 0),
      },
      farmingPattern: {
        preferredCrops: getPreferredCrops(),
        seasonalRotation: getSeasonalRotation(),
        soilHealth: farmerProfile?.soilType || 'unknown',
      }
    };

    return context;
  };

  const getPreferredCrops = () => {
    // Analyze crop history to determine preferences
    const cropFrequency = {};
    crops.forEach(crop => {
      cropFrequency[crop.name] = (cropFrequency[crop.name] || 0) + 1;
    });
    
    return Object.entries(cropFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);
  };

  const getSeasonalRotation = () => {
    const currentMonth = new Date().getMonth() + 1;
    let season = 'unknown';
    
    if (currentMonth >= 3 && currentMonth <= 5) season = 'summer';
    else if (currentMonth >= 6 && currentMonth <= 9) season = 'monsoon';
    else if (currentMonth >= 10 && currentMonth <= 11) season = 'post-monsoon';
    else season = 'winter';
    
    return {
      currentSeason: season,
      activeCropsInSeason: crops.filter(crop => {
        const plantedMonth = new Date(crop.plantedDate).getMonth() + 1;
        return getSeasonFromMonth(plantedMonth) === season && 
               (crop.status === 'planted' || crop.status === 'growing');
      }).map(crop => crop.name)
    };
  };

  const getSeasonFromMonth = (month) => {
    if (month >= 3 && month <= 5) return 'summer';
    if (month >= 6 && month <= 9) return 'monsoon';
    if (month >= 10 && month <= 11) return 'post-monsoon';
    return 'winter';
  };

  // Clear all farmer data (for testing or reset)
  const clearFarmerData = async () => {
    try {
      await AsyncStorage.multiRemove([
        'farmerProfile',
        'farmerCrops', 
        'landSections',
        'isOnboardingComplete'
      ]);
      
      setFarmerProfile(null);
      setCrops([]);
      setLandSections([]);
      setIsOnboardingComplete(false);
      return true;
    } catch (error) {
      console.error('Error clearing farmer data:', error);
      return false;
    }
  };

  const syncProfileToFirebase = async () => {
    try {
      if (farmerProfile) {
        await farmerProfileService.saveFarmerProfile(farmerProfile);
        console.log('Profile synced to Firebase successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error syncing profile to Firebase:', error);
      return false;
    }
  };

  const value = {
    // State
    farmerProfile,
    crops,
    landSections,
    isLoading,
    isOnboardingComplete,
    
    // Profile methods
    updateFarmerProfile,
    
    // Crop methods
    addCrop,
    updateCrop,
    updateCropProgress,
    markCropHarvested,
    removeCrop,
    
    // Land methods
    addLandSection,
    updateLandSection,
    
    // AI context
    getFarmerContextForAI,
    
    // Utility methods
    loadFarmerData,
    clearFarmerData,
    syncProfileToFirebase,
    
    // Computed values
    activeCrops: crops.filter(crop => crop.growthStage !== 'harvested'),
    harvestedCrops: crops.filter(crop => crop.growthStage === 'harvested'),
    totalLandUsed: crops.reduce((total, crop) => total + (parseFloat(crop.areaAllocated) || 0), 0),
    availableLand: (farmerProfile?.landSize || 0) - crops.reduce((total, crop) => total + (parseFloat(crop.areaAllocated) || 0), 0),
  };

  return (
    <FarmerContext.Provider value={value}>
      {children}
    </FarmerContext.Provider>
  );
};

export default FarmerProvider;
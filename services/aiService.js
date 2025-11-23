import apiManager from './apiManager';
import weatherService from './weather.service';

class AIService {
  // Build comprehensive context from farmer profile and weather data
  async buildContext(farmerContext, includeWeather = true) {
    let contextString = '';
    
    // Add farmer profile context with all details
    if (farmerContext && farmerContext.farmer) {
      const farmer = farmerContext.farmer;
      
      // Basic farmer info
      contextString += `Farmer Profile: ${farmer.name || 'Farmer'} from ${farmer.location || 'Unknown location'}`;
      
      if (farmer.state) contextString += `, ${farmer.state}`;
      if (farmer.district) contextString += `, ${farmer.district} district`;
      if (farmer.village) contextString += `, ${farmer.village} village`;
      
      // Farming details
      contextString += `. Land: ${farmer.landSize || 'Unknown'} acres, Soil: ${farmer.soilType || 'Unknown'}`;
      
      if (farmer.experience) contextString += `, Experience: ${farmer.experience} years`;
      if (farmer.farmingMethod) contextString += `, Method: ${farmer.farmingMethod}`;
      if (farmer.irrigationType) contextString += `, Irrigation: ${farmer.irrigationType}`;
      if (farmer.waterSource) contextString += `, Water source: ${farmer.waterSource}`;
      if (farmer.soilPH) contextString += `, Soil pH: ${farmer.soilPH}`;
      if (farmer.mainCrops) contextString += `, Main crops: ${farmer.mainCrops}`;
      if (farmer.challenges) contextString += `, Challenges: ${farmer.challenges}`;
      if (farmer.goals) contextString += `, Goals: ${farmer.goals}`;
      if (farmer.preferredLanguage) contextString += `, Preferred language: ${farmer.preferredLanguage}`;
      
      contextString += '. ';
      
      // Add current crops context with detailed information
      if (farmerContext.activeCrops && farmerContext.activeCrops.length > 0) {
        contextString += 'Current crops: ';
        const cropsInfo = farmerContext.activeCrops.map(crop => {
          let cropDesc = `${crop.name}`;
          if (crop.variety) cropDesc += ` (${crop.variety})`;
          if (crop.area) cropDesc += ` - ${crop.area} acres`;
          if (crop.stage) cropDesc += `, Stage: ${crop.stage}`;
          if (crop.plantedDate) cropDesc += `, Planted: ${crop.plantedDate}`;
          if (crop.expectedHarvestDate) cropDesc += `, Expected harvest: ${crop.expectedHarvestDate}`;
          if (crop.soilType) cropDesc += `, Soil: ${crop.soilType}`;
          if (crop.irrigationMethod) cropDesc += `, Irrigation: ${crop.irrigationMethod}`;
          if (crop.notes) cropDesc += `, Notes: ${crop.notes}`;
          return cropDesc;
        }).join('; ');
        contextString += cropsInfo + '. ';
      }
      
      // Add recent harvests with yield data
      if (farmerContext.recentHarvests && farmerContext.recentHarvests.length > 0) {
        contextString += 'Recent harvests: ';
        const harvestInfo = farmerContext.recentHarvests.map(harvest => {
          let harvestDesc = `${harvest.name}`;
          if (harvest.harvestedDate) harvestDesc += ` harvested on ${harvest.harvestedDate}`;
          if (harvest.yield) harvestDesc += ` with ${harvest.yield} yield`;
          if (harvest.quality) harvestDesc += `, Quality: ${harvest.quality}`;
          if (harvest.marketPrice) harvestDesc += `, Sold at: ₹${harvest.marketPrice}`;
          return harvestDesc;
        }).join('; ');
        contextString += harvestInfo + '. ';
      }
      
      // Add land sections information
      if (farmerContext.landSections && farmerContext.landSections.length > 0) {
        contextString += 'Land sections: ';
        const landInfo = farmerContext.landSections.map(section => {
          let sectionDesc = `Section ${section.name || section.id}`;
          if (section.size) sectionDesc += ` (${section.size} acres)`;
          if (section.soilType) sectionDesc += `, Soil: ${section.soilType}`;
          if (section.cropHistory) sectionDesc += `, Previous crops: ${section.cropHistory}`;
          if (section.currentCrop) sectionDesc += `, Current: ${section.currentCrop}`;
          return sectionDesc;
        }).join('; ');
        contextString += landInfo + '. ';
      }
      
      // Add farming equipment/resources if available
      if (farmer.equipment && farmer.equipment.length > 0) {
        contextString += `Equipment: ${farmer.equipment.join(', ')}. `;
      }
      
      // Add financial context if available
      if (farmer.budget) contextString += `Budget: ₹${farmer.budget}. `;
      if (farmer.insurance) contextString += `Insurance: ${farmer.insurance}. `;
    }
    
    // Add current location context from weather service
    // DISABLED: User requested to rely on profile location only
    /*
    if (includeWeather) {
      try {
        // Get current weather with automatic location detection
        const location = await weatherService.getCurrentLocation();
        if (location && location.latitude && location.longitude) {
          // Validate coordinates
          const lat = Number(location.latitude);
          const lon = Number(location.longitude);
          
          if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            const weather = await weatherService.getCurrentWeather(lat, lon);
            if (weather) {
              const currentLocationName = weather.city || location.city || 'Unknown';
              contextString += `Current location: ${currentLocationName}, Weather: ${weather.description}, Temperature: ${weather.temp || weather.temperature}°C, Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} m/s. `;
              
              // Explicitly note if current location differs from profile location
              if (farmerContext && farmerContext.farmer && farmerContext.farmer.state) {
                 // Simple check if current location seems different from profile state (rough heuristic)
                 // This helps AI prioritize current location for weather/immediate advice
                 contextString += `(Note: User is currently at ${currentLocationName}, which may differ from their profile location in ${farmerContext.farmer.state}. Prioritize current location for weather and immediate advice.) `;
              }

              // Add weather alerts or advisories if any
              if (weather.alerts && weather.alerts.length > 0) {
                contextString += `Weather alerts: ${weather.alerts.join(', ')}. `;
              }
            } else {
              contextString += `Current location: ${location.city || 'Unknown'}. Weather data unavailable. `;
            }
          } else {
            console.error('❌ Invalid coordinates from location service:', { lat, lon });
            contextString += 'Location and weather data unavailable. ';
          }
        } else {
          console.log('⚠️ Location service returned invalid data');
          contextString += 'Location and weather data unavailable. ';
        }
      } catch (weatherError) {
        console.error('❌ Weather context error:', weatherError);
        contextString += 'Weather data unavailable. ';
      }
    }
    */
    
    // Add current date and season context
    const now = new Date();
    const currentSeason = this.getCurrentSeason(now);
    contextString += `Current date: ${now.toDateString()}, Season: ${currentSeason}. `;
    
    console.log('🤖 AI Context built:', contextString);
    return contextString;
  }
  
  // Helper function to determine current agricultural season
  getCurrentSeason(date) {
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    
    if (month >= 6 && month <= 9) {
      return 'Kharif (Monsoon season)';
    } else if (month >= 10 || month <= 3) {
      return 'Rabi (Winter season)';  
    } else {
      return 'Zaid (Summer season)';
    }
  }

  // Enhanced chat method with automatic context building
  async chat(message, farmerContext = null, includeWeather = true, additionalContext = '') {
    try {
      const contextString = await this.buildContext(farmerContext, includeWeather);
      const fullContext = contextString + additionalContext;
      
      // Pass message and context separately to avoid duplication
      return await apiManager.getChatResponse(message, fullContext);
    } catch (error) {
      console.error('AI chat error:', error);
      return 'I apologize, but I encountered an issue processing your request. Please try again or contact our support team for assistance.';
    }
  }  async analyzePest(imageUri, symptoms, farmerContext = null) {
    try {
      const contextString = await this.buildContext(farmerContext, true);
      return await apiManager.analyzePestSymptoms(symptoms, '', contextString);
    } catch (error) {
      console.error('Pest analysis error:', error);
      throw error;
    }
  }

  async getSoilRecommendations(soilType, phLevel, organicMatter, farmerContext = null) {
    try {
      const contextString = await this.buildContext(farmerContext, true);
      return await apiManager.getSoilAdvice(soilType, phLevel, organicMatter, contextString);
    } catch (error) {
      console.error('Soil analysis error:', error);
      throw error;
    }
  }

  async getWeatherAdvice(weatherData, farmerContext = null) {
    try {
      const contextString = await this.buildContext(farmerContext, false); // Don't duplicate weather data
      const crops = Array.isArray(farmerContext?.activeCrops) ? farmerContext.activeCrops.map(c => c.name).filter(Boolean) : [];
      return await apiManager.getWeatherBasedAdvice(weatherData, crops, contextString);
    } catch (error) {
      console.error('Weather advice error:', error);
      throw error;
    }
  }

  // Crop and disease analysis
  async identifyPlantDisease(symptoms, cropType, farmerContext = null) {
    try {
      const contextString = await this.buildContext(farmerContext, true);
      return await apiManager.analyzePestSymptoms(symptoms, cropType, contextString);
    } catch (error) {
      console.error('Disease identification error:', error);
      throw error;
    }
  }

  // Soil analysis and recommendations
  async analyzeSoil(soilData, farmerContext = null) {
    try {
      const contextString = await this.buildContext(farmerContext, true);
      
      let soilInfo = '';
      if (typeof soilData === 'string') {
        soilInfo = soilData;
      } else {
        const { soilType, phLevel, organicMatter, nitrogen, phosphorus, potassium } = soilData;
        soilInfo = `Soil Type: ${soilType}, pH Level: ${phLevel}, Organic Matter: ${organicMatter}%`;
        if (nitrogen) soilInfo += `, Nitrogen: ${nitrogen}`;
        if (phosphorus) soilInfo += `, Phosphorus: ${phosphorus}`;
        if (potassium) soilInfo += `, Potassium: ${potassium}`;
      }
      
      const prompt = `As Krishta AI, analyze soil data: ${soilInfo}. ${contextString ? `Farmer context: ${contextString}` : ''} Provide comprehensive soil improvement recommendations specific to the farmer's crops, location, and farming method.`;
      
      return await apiManager.makeAIRequest(prompt, `soil_analysis_${JSON.stringify(soilData)}`);
    } catch (error) {
      console.error('Soil analysis error:', error);
      throw error;
    }
  }

  // Image-based soil type identification
  async analyzeSoilImage(imageBase64, farmerContext = null) {
    try {
      console.log('Starting Krishta AI-powered soil image analysis...');
      
      const contextString = await this.buildContext(farmerContext, true);
      
      const prompt = `You are Krishta AI, an expert agricultural soil scientist. Analyze this soil image and determine the soil type based on visual characteristics. ${contextString ? `Farmer context: ${contextString}` : ''}

Look for these key indicators:
1. COLOR: Clay (dark brown/black), Sandy (light brown/tan), Loamy (rich dark brown), Silty (light grayish), Peaty (very dark/black), Chalky (light/whitish)
2. TEXTURE: Fine particles (clay/silt) vs coarse particles (sand)
3. STRUCTURE: How well the soil holds together, presence of clumps or individual grains
4. MOISTURE: Wet appearance, drainage indicators
5. ORGANIC MATTER: Visible plant debris, roots, decomposed material

Based on these observations, classify the soil as one of these types:
- Clay Soil: Dark, fine particles, sticky appearance, poor drainage
- Sandy Soil: Light colored, coarse visible particles, good drainage
- Loamy Soil: Rich dark brown, balanced texture, good structure
- Silty Soil: Smooth, fine particles, light color
- Peaty Soil: Very dark, high organic content, spongy texture
- Chalky Soil: Light colored with white chalky particles

Respond in this exact format:
SOIL TYPE: [Type Name]
CONFIDENCE: [High/Medium/Low]
EXPLANATION: [2-3 sentences describing the key visual indicators you observed that led to this classification]`;

      // Validate base64 input
      if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length === 0) {
        throw new Error('Invalid image data provided for analysis');
      }

      const cacheKey = `soil_image_${imageBase64.substring(0, 10)}`;
      const result = await apiManager.makeVisionAIRequest(prompt, imageBase64, cacheKey);
      
      // Ensure we return a valid string response
      if (!result || typeof result !== 'string' || result.trim().length === 0) {
        console.warn('Empty or invalid AI response, providing fallback');
        return 'SOIL TYPE: Unknown\nCONFIDENCE: Low\nEXPLANATION: Unable to analyze soil image properly. Please try again with a clearer image showing soil texture and color.';
      }
      
      console.log('Soil analysis completed successfully');
      return result;
      
    } catch (error) {
      console.error('Soil image analysis error:', error);
      throw new Error('Failed to analyze soil image. Please ensure the image shows clear soil samples and try again.');
    }
  }

  // Pest management
  async getPestTreatment(pestType, severity, cropType, organicOnly = false) {
    try {
      return await apiManager.getPestManagementPlan(pestType, cropType, severity);
    } catch (error) {
      console.error('Pest treatment error:', error);
      throw error;
    }
  }

  // Weather-based farming advice
  async getFarmingAdviceForWeather(weatherConditions, cropTypes = []) {
    try {
      return await apiManager.getWeatherBasedAdvice(weatherConditions, cropTypes);
    } catch (error) {
      console.error('Weather farming advice error:', error);
      throw error;
    }
  }

  // Crop planning and recommendations
  async getCropRecommendations(region, season, soilType, farmSize, budget) {
    try {
      return await apiManager.getCropRecommendations(region, season, soilType, farmSize);
    } catch (error) {
      console.error('Crop recommendations error:', error);
      throw error;
    }
  }

  // Seasonal farming advice with comprehensive context
  async getSeasonalAdvice(farmerContext = null) {
    try {
      const contextString = await this.buildContext(farmerContext, true);
      const prompt = `As Krishta AI, provide a concise seasonal farming tip. ${contextString ? `Context: ${contextString}` : ''} Focus on one practical action this specific farmer should take this week based on their crops, location, and current weather. Keep it brief (2-3 sentences maximum) and actionable.`;
      
      return await apiManager.getChatResponse(prompt);
    } catch (error) {
      console.error('Seasonal advice error:', error);
      throw error;
    }
  }

  // Market insights
  async getMarketAdvice(cropName, region, quantity) {
    try {
      return await apiManager.getMarketInsights(cropName, region);
    } catch (error) {
      console.error('Market advice error:', error);
      throw error;
    }
  }

  // Irrigation recommendations
  async getIrrigationAdvice(cropType, soilType, weatherData, farmSize) {
    try {
      const prompt = `Provide irrigation recommendations for:
      - Crop: ${cropType}
      - Soil Type: ${soilType}
      - Weather: ${JSON.stringify(weatherData)}
      - Farm Size: ${farmSize}
      
      Include water requirements, timing, and methods.`;
      
      const cacheKey = `irrigation_${cropType}_${soilType}_${weatherData.condition}`;
      return await apiManager.makeAIRequest(prompt, cacheKey);
    } catch (error) {
      console.error('Irrigation advice error:', error);
      throw error;
    }
  }

  // Fertilizer recommendations
  async getFertilizerPlan(cropType, soilData, growthStage) {
    try {
      const prompt = `Create fertilizer plan for:
      - Crop: ${cropType}
      - Growth Stage: ${growthStage}
      - Soil Data: ${JSON.stringify(soilData)}
      
      Provide NPK ratios, application timing, and quantities.`;
      
      const cacheKey = `fertilizer_${cropType}_${growthStage}_${soilData.soilType}`;
      return await apiManager.makeAIRequest(prompt, cacheKey);
    } catch (error) {
      console.error('Fertilizer plan error:', error);
      throw error;
    }
  }

  // Quick emergency advice
  async getEmergencyAdvice(issue, urgency = 'high') {
    try {
      return await apiManager.getQuickAdvice(issue, urgency);
    } catch (error) {
      console.error('Emergency advice error:', error);
      throw error;
    }
  }

  // Seasonal planning
  async getSeasonalPlan(region, season, crops, farmSize) {
    try {
      const prompt = `Create seasonal farming plan for:
      - Region: ${region}
      - Season: ${season}
      - Current Crops: ${crops.join(', ')}
      - Farm Size: ${farmSize}
      
      Include timeline, activities, and resource planning.`;
      
      const cacheKey = `seasonal_${region}_${season}_${crops.join('')}`;
      return await apiManager.makeAIRequest(prompt, cacheKey, apiManager.longCacheTime);
    } catch (error) {
      console.error('Seasonal planning error:', error);
      throw error;
    }
  }

  // Organic farming advice
  async getOrganicFarmingAdvice(topic, cropType) {
    try {
      const prompt = `Provide organic farming advice for ${topic} in ${cropType} cultivation. 
      Focus on natural, chemical-free methods and sustainable practices.`;
      
      const cacheKey = `organic_${topic}_${cropType}`;
      return await apiManager.makeAIRequest(prompt, cacheKey);
    } catch (error) {
      console.error('Organic farming advice error:', error);
      throw error;
    }
  }

  // Equipment and technology recommendations
  async getEquipmentAdvice(farmType, farmSize, budget, requirements) {
    try {
      const prompt = `Recommend farming equipment for:
      - Farm Type: ${farmType}
      - Size: ${farmSize}
      - Budget: ${budget}
      - Requirements: ${requirements}
      
      Include cost-benefit analysis and alternatives.`;
      
      const cacheKey = `equipment_${farmType}_${farmSize}_${budget}`;
      return await apiManager.makeAIRequest(prompt, cacheKey);
    } catch (error) {
      console.error('Equipment advice error:', error);
      throw error;
    }
  }

  // Backward compatibility methods
  async getPestManagementPlan(pestName, cropType, severity = 'medium') {
    return await apiManager.getPestManagementPlan(pestName, cropType, severity);
  }

  async getQuickAdvice(issue, urgency = 'normal') {
    return await apiManager.getQuickAdvice(issue, urgency);
  }

  // Get quick farming tips
  async getQuickTips(topic = 'general farming') {
    try {
      const prompt = `Provide 3-4 quick, actionable farming tips for: ${topic}. 
      Make them concise and practical for farmers.`;
      
      const cacheKey = `quick_tips_${topic}`;
      return await apiManager.makeAIRequest(prompt, cacheKey);
    } catch (error) {
      console.error('Quick tips error:', error);
      return 'Keep your soil healthy, water regularly, and monitor for pests. Practice crop rotation for better yields.';
    }
  }

  // Translation service
  async translate(text, targetLanguage) {
    try {
      const prompt = `Translate the following text to ${targetLanguage}: "${text}"
      Provide only the translation, no additional text.`;
      
      const cacheKey = `translate_${text}_${targetLanguage}`;
      return await apiManager.makeAIRequest(prompt, cacheKey);
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  }

  // Get API usage statistics
  getApiStats() {
    return apiManager.getCacheStats();
  }

  // Clear API cache if needed
  clearCache() {
    apiManager.clearCache();
  }
}

export default new AIService();
const AIService = require('./services/aiService');
const MarketService = require('./services/marketService');

async function testAIContextBuilding() {
  console.log('🤖 Testing AI Context Building...\n');
  
  try {
    // Create mock farmer context
    const mockFarmerContext = {
      farmer: {
        id: 'test_farmer_123',
        name: 'Akshay Kumar',
        location: 'Delhi',
        state: 'Delhi',
        district: 'South Delhi',
        village: 'Lajpat Nagar',
        landSize: '5',
        soilType: 'Loamy',
        experience: '10',
        farmingMethod: 'Organic',
        irrigationType: 'Drip',
        waterSource: 'Borewell',
        soilPH: '6.8',
        mainCrops: 'Rice, Wheat, Vegetables',
        challenges: 'Pest control, Water management',
        goals: 'Increase yield, Reduce costs',
        preferredLanguage: 'English'
      },
      activeCrops: [
        {
          id: '1',
          name: 'Rice',
          variety: 'Basmati',
          area: '2',
          stage: 'Flowering',
          plantedDate: '2025-07-15',
          expectedHarvestDate: '2025-11-15',
          soilType: 'Loamy',
          irrigationMethod: 'Drip',
          notes: 'Organic farming method'
        },
        {
          id: '2',
          name: 'Wheat',
          variety: 'HD-2967',
          area: '2.5',
          stage: 'Vegetative',
          plantedDate: '2025-11-01',
          expectedHarvestDate: '2026-04-15',
          soilType: 'Clay loam',
          irrigationMethod: 'Sprinkler',
          notes: 'High yield variety'
        }
      ],
      recentHarvests: [
        {
          id: '1',
          name: 'Tomato',
          harvestedDate: '2025-08-20',
          yield: '2.5 tons',
          quality: 'Premium',
          marketPrice: '25'
        }
      ],
      landSections: [
        {
          id: '1',
          name: 'North Field',
          size: '2',
          soilType: 'Loamy',
          cropHistory: 'Rice, Wheat rotation',
          currentCrop: 'Rice'
        },
        {
          id: '2',
          name: 'South Field', 
          size: '3',
          soilType: 'Clay loam',
          cropHistory: 'Wheat, Vegetables',
          currentCrop: 'Wheat'
        }
      ]
    };
    
    console.log('👤 Mock farmer context created for:', mockFarmerContext.farmer.name);
    console.log('📍 Location:', `${mockFarmerContext.farmer.location}, ${mockFarmerContext.farmer.state}`);
    console.log('🌾 Active crops:', mockFarmerContext.activeCrops.length);
    
    // Test AI context building
    const aiService = new AIService();
    console.log('\n🔄 Building comprehensive AI context...');
    
    const context = await aiService.buildContext(mockFarmerContext, true);
    console.log('\n📋 Generated AI Context:');
    console.log('=' .repeat(80));
    console.log(context);
    console.log('=' .repeat(80));
    
    // Test AI chat with context
    console.log('\n🤖 Testing AI chat with context...');
    const testQuestion = "What should I do for my rice crop in the current weather?";
    console.log(`Question: ${testQuestion}`);
    
    const response = await aiService.chat(testQuestion, mockFarmerContext, true);
    console.log('\n🤖 AI Response:');
    console.log('-' .repeat(80));
    console.log(response);
    console.log('-' .repeat(80));
    
    console.log('\n🎉 AI context building test completed successfully!');
    
  } catch (error) {
    console.error('❌ AI context test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAIContextBuilding();
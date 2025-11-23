# 🌾 Harit - Smart Farming Assistant

<div align="center">

![Harit Logo](https://img.shields.io/badge/Harit-Farming%20Assistant-4CAF50?style=for-the-badge&logo=react&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81.4-blue?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-~54.0.7-black?style=for-the-badge&logo=expo&logoC.
olor=white)
![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange?style=for-the-badge&logo=firebase&logoColor=white)

**Empowering Farmers with AI-Driven Agricultural Solutions**

[📱 Download APK](#installation) • [🌐 Live Demo](#demo) • [📖 Documentation](#features) • [🤝 Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📱 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [📚 API Documentation](#-api-documentation)
- [🎨 Screenshots](#-screenshots)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👥 Team](#-team)
- [🙏 Acknowledgments](#-acknowledgments)

---

## 🌟 Overview

**Harit** is a comprehensive mobile application designed to revolutionize farming practices through cutting-edge technology. Built with React Native and powered by AI, Harit provides farmers with intelligent tools for crop management, pest detection, weather forecasting, market insights, and community collaboration.

### 🎯 Problem Statement

Traditional farming faces numerous challenges:
- Limited access to real-time market information
- Difficulty in pest identification and treatment
- Weather-dependent decision making
- Lack of community knowledge sharing
- Language barriers in agricultural education

### 💡 Solution

Harit bridges these gaps by providing:
- **AI-powered pest detection** using image recognition
- **Real-time market prices** from government databases
- **Weather forecasting** with farming-specific insights
- **Community-driven knowledge sharing**
- **Multi-language support** for accessibility
- **Offline-capable features** for rural areas

---

## ✨ Features

### 🌱 Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **🤖 AI Pest Detection** | Upload crop images for instant pest identification and treatment recommendations | ✅ Complete |
| **🌤️ Weather Advisory** | Location-based weather forecasts with farming-specific insights | ✅ Complete |
| **💰 Market Intelligence** | Real-time commodity prices from government databases | ✅ Complete |
| **🌍 Community Hub** | Farmer-to-farmer knowledge sharing with posts, comments, and sharing | ✅ Complete |
| **🌾 Crop Management** | Track crops, monitor growth, and get personalized recommendations | ✅ Complete |
| **🗣️ AI Chatbot** | 24/7 farming assistance with expert knowledge | ✅ Complete |

### 🎨 User Experience

- **🌐 Multi-Language Support**: Hindi, English, and regional languages
- **📱 Offline-First Design**: Core features work without internet
- **🎯 Intuitive UI/UX**: Designed specifically for farmers
- **📸 Image Upload**: Integrated with ImgBB for seamless photo sharing
- **📍 Location Services**: GPS-based personalized recommendations
- **🔒 Secure Authentication**: Firebase-powered user management

### 🔧 Technical Features

- **📡 Real-time Updates**: Live market prices and weather data
- **💾 Local Storage**: AsyncStorage for offline data persistence
- **🔗 Deep Linking**: Share posts and content across platforms
- **📊 Analytics**: Usage tracking for continuous improvement
- **🔄 Auto-sync**: Seamless data synchronization when online

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
```javascript
React Native 0.81.4          // Cross-platform mobile framework
Expo ~54.0.7                 // Development platform
React Navigation 7.x         // Navigation library
```

### Backend & Services
```javascript
Firebase 10.7.1              // Authentication & Database
Sonoma Sky Alpha API 0.24.1  // AI/ML services
Next.js                      // API server
Node.js                      // Runtime environment
```

### Key Dependencies
```json
{
  "@expo/vector-icons": "^15.0.2",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "expo-image-picker": "^17.0.8",
  "expo-linear-gradient": "^15.0.7",
  "expo-location": "~19.0.7",
  "expo-linking": "~8.0.8"
}
```

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **React Native Debugger**: Development debugging

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/your-username/harit-farming-assistant.git
cd harit-farming-assistant

# Install dependencies
npm install

# Start development server
npm start
```

---

## 📱 Installation

### For Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/harit-farming-assistant.git
   cd harit-farming-assistant/harit-fresh
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/emulator**
   ```bash
   # For Android
   npm run android

   # For iOS
   npm run ios

   # For Web
   npm run web
   ```

### For Production

1. **Build the app**
   ```bash
   expo build:android  # For Android APK
   expo build:ios     # For iOS IPA
   ```

2. **Deploy to stores**
   - Upload APK to Google Play Store
   - Upload IPA to Apple App Store

---

## 🔧 Configuration


### Firebase Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)
2. **Enable Authentication** with Email/Password and Google providers
3. **Set up Firestore Database** with the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Posts are publicly readable, writable by authenticated users
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.farmerId == request.auth.uid;
    }

    // Comments follow post permissions
    match /posts/{postId}/comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.farmerId == request.auth.uid;
    }
  }
}
```

---

## 📚 API Documentation

### Market API

The market API provides real-time commodity prices from government databases.

#### Endpoint: `GET /api/market`

**Parameters:**
- `commodity` (string, required): Name of the commodity
- `state` (string, required): State name
- `market` (string, required): Market/city name

**Example Request:**
```bash
curl "https://your-api.com/api/market?commodity=Potato&state=Karnataka&market=Bangalore"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "S.No": "1",
      "City": "Bangalore",
      "Commodity": "Potato",
      "Min Prize": "1500",
      "Max Prize": "1800",
      "Model Prize": "1600",
      "Date": "18 Sep 2025"
    }
  ]
}
```

### AI Services API

#### Pest Detection
```javascript
// Upload image for pest detection
const result = await aiService.detectPest(imageUri);
```

#### Chatbot
```javascript
// Get farming advice
const response = await aiService.getChatbotResponse(userQuery);
```

---

## 🎨 Screenshots

<div align="center">

### 📱 Mobile App Screenshots

| Onboarding | Home Screen | Pest Detection |
|------------|-------------|----------------|
| ![Onboarding](https://via.placeholder.com/200x400/4CAF50/white?text=Onboarding) | ![Home](https://via.placeholder.com/200x400/4CAF50/white?text=Home) | ![Pest Detection](https://via.placeholder.com/200x400/4CAF50/white?text=Pest+Detection) |

| Community | Market Prices | Weather |
|-----------|---------------|---------|
| ![Community](https://via.placeholder.com/200x400/4CAF50/white?text=Community) | ![Market](https://via.placeholder.com/200x400/4CAF50/white?text=Market) | ![Weather](https://via.placeholder.com/200x400/4CAF50/white?text=Weather) |

</div>

---

## 🤝 Contributing

We welcome contributions from developers, farmers, and agricultural experts!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

### Areas for Contribution

- 🌐 **Localization**: Add support for more regional languages
- 🤖 **AI Features**: Enhance pest detection accuracy
- 📊 **Analytics**: Improve market price predictions
- 🎨 **UI/UX**: Enhance user interface and experience
- 📱 **Performance**: Optimize app performance and loading times

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```text
MIT License

Copyright (c) 2025 Harit Farming Assistant

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👥 Team

### Core Team

- **👨‍💻 Lead Developer**: [Your Name]
- **🎨 UI/UX Designer**: [Designer Name]
- **🤖 AI Engineer**: [AI Specialist Name]
- **🌾 Agriculture Expert**: [Domain Expert Name]

### Advisors

- **Dr. Agriculture Expert**: Technical Advisor
- **Mr. Farmer Representative**: User Experience Advisor

### Contact

- **Email**: team@harit.app
- **Website**: https://harit.app
- **Twitter**: [@harit_app](https://twitter.com/harit_app)
- **LinkedIn**: [Harit Farming Assistant](https://linkedin.com/company/harit)

---

## 🙏 Acknowledgments

### Partners & Supporters

- **Ministry of Agriculture, India** - For providing market data APIs
- **Indian Council of Agricultural Research (ICAR)** - Technical guidance
- **Local Farmer Cooperatives** - User testing and feedback

### Open Source Libraries

Special thanks to the open-source community for these amazing libraries:
- React Native & Expo teams
- Firebase & Google AI teams
- All contributors to our dependencies

### Inspiration

This project was inspired by the real challenges faced by farmers in rural India and our vision to bridge the digital divide in agriculture through technology.

---

## 📊 Project Status

### Current Version: v1.0.0

- ✅ **Core Features**: All planned features implemented
- ✅ **Testing**: Unit tests and integration tests
- ✅ **Documentation**: Complete API and user documentation
- ✅ **Deployment**: Ready for production deployment

### Roadmap

#### Phase 2 (Q1 2026)
- [ ] Advanced AI crop disease prediction
- [ ] Integration with government subsidy programs
- [ ] Offline-first architecture improvements
- [ ] Multi-language voice commands

#### Phase 3 (Q2 2026)
- [ ] IoT sensor integration for smart farming
- [ ] Blockchain-based supply chain tracking
- [ ] AR-based crop identification
- [ ] Advanced analytics dashboard

---

<div align="center">

**Made with ❤️ for farmers, by developers who care about agriculture**

---

**[⬆️ Back to Top](#-harit---smart-farming-assistant)**

</div></content>
<parameter name="filePath">C:\Users\aksha\Desktop\AGROcure\harit-fresh\README.md
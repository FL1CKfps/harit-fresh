import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Clean modern green palette matching screenshot design
const lightTheme = {
  // Primary Colors
  primary: '#4CAF50', // Clean bright green
  primaryLight: '#81C784', // Light green
  primaryDark: '#388E3C', // Darker green
  
  // Accent Colors
  accent: '#4CAF50', // Main green accent
  accentLight: '#C8E6C9', // Very light green
  accentDark: '#2E7D32', // Dark green
  
  // Gradient Colors
  gradientPrimary: ['#4CAF50', '#66BB6A'],
  gradientSecondary: ['#E8F5E9', '#F1F8E9'],
  gradientAccent: ['#4CAF50', '#81C784'],
  
  // Background Colors
  background: '#FFFFFF', // Pure white background
  backgroundSecondary: '#F5F5F5', // Light grey
  surface: '#FFFFFF', // White cards
  surfaceVariant: '#F8F9FA', // Very light grey
  
  // Text Colors
  text: '#212121', // Dark grey text
  textSecondary: '#757575', // Medium grey
  textLight: '#9E9E9E', // Light grey
  textOnPrimary: '#FFFFFF', // White on green
  textOnSurface: '#212121', // Dark on white
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Border and Divider
  border: '#E0E0E0',
  divider: '#F5F5F5',
  
  // Card and Component Colors
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  pill: '#F8F9FA',
  pillActive: '#4CAF50',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
};

export const ThemeProvider = ({ children }) => {
  // Simple light theme only - no dark mode complexity
  const theme = lightTheme;

  const value = {
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
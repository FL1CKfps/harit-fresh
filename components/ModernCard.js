import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const ModernCard = ({ 
  children, 
  style, 
  gradient = false, 
  elevation = 3,
  padding = 20,
  margin = 12 
}) => {
  const { theme } = useTheme();

  const cardStyles = StyleSheet.create({
    container: {
      borderRadius: 20,
      marginHorizontal: margin,
      marginVertical: margin / 2,
      elevation: elevation,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.1,
      shadowRadius: elevation * 2,
      overflow: 'hidden',
    },
    content: {
      padding: padding,
      backgroundColor: gradient ? 'transparent' : theme.surface,
      borderRadius: 20,
    },
    gradient: {
      borderRadius: 20,
    }
  });

  if (gradient) {
    return (
      <View style={[cardStyles.container, style]}>
        <LinearGradient
          colors={theme.gradientSecondary}
          style={cardStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={cardStyles.content}>
            {children}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[cardStyles.container, style]}>
      <View style={cardStyles.content}>
        {children}
      </View>
    </View>
  );
};

export default ModernCard;
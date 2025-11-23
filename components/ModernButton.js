import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const ModernButton = ({ 
  title, 
  onPress, 
  icon, 
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'medium', // small, medium, large
  disabled = false,
  style,
  textStyle,
  fullWidth = false
}) => {
  const { theme } = useTheme();

  const getButtonStyles = () => {
    const baseStyle = {
      borderRadius: size === 'small' ? 12 : size === 'large' ? 20 : 16,
      paddingHorizontal: size === 'small' ? 12 : size === 'large' ? 24 : 18,
      paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.6 : 1,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.backgroundSecondary,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: theme.primary + '15',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyles = () => {
    const baseTextStyle = {
      fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14,
      fontWeight: '600',
      marginLeft: icon ? 6 : 0,
    };

    switch (variant) {
      case 'primary':
        return { ...baseTextStyle, color: theme.textOnPrimary };
      case 'outline':
        return { ...baseTextStyle, color: theme.primary };
      case 'ghost':
        return { ...baseTextStyle, color: theme.primary };
      default:
        return { ...baseTextStyle, color: theme.text };
    }
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryLight]}
          style={buttonStyles}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {icon && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 20 : 18} 
              color={theme.textOnPrimary} 
            />
          )}
          <Text style={[textStyles, textStyle]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[buttonStyles, style]}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={size === 'small' ? 16 : size === 'large' ? 20 : 18} 
          color={variant === 'outline' || variant === 'ghost' ? theme.primary : theme.text} 
        />
      )}
      <Text style={[textStyles, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default ModernButton;
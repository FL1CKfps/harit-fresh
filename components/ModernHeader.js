import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const ModernHeader = ({ 
  title, 
  subtitle, 
  showBack = false, 
  onBackPress, 
  rightIcon, 
  onRightPress,
  style 
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    header: {
      paddingTop: 50,
      paddingBottom: 30,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      overflow: 'hidden',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleContainer: {
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 2,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
    },
    headerButton: {
      padding: 4,
      width: 32,
      alignItems: 'center',
    },
    spacer: {
      width: 32,
    },
  });

  return (
    <LinearGradient
      colors={theme.gradientPrimary}
      style={[styles.header, style]}
    >
      <View style={styles.headerContent}>
        {showBack ? (
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={onBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          )}
        </View>
        
        {rightIcon ? (
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={onRightPress}
          >
            <Ionicons name={rightIcon} size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </LinearGradient>
  );
};

export default ModernHeader;
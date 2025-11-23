import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const ModernSearchBar = ({ 
  placeholder = 'Search...', 
  value, 
  onChangeText, 
  onSearch,
  style,
  showFilter = false,
  onFilterPress
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 20,
      marginVertical: 12,
      elevation: 2,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    searchIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      paddingVertical: 0,
    },
    filterButton: {
      marginLeft: 12,
      padding: 4,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Ionicons 
        name="search" 
        size={20} 
        color={theme.textSecondary} 
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        returnKeyType="search"
      />
      {showFilter && (
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={onFilterPress}
        >
          <Ionicons name="options" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ModernSearchBar;
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 75;

const CustomTabBar = ({ state, navigation }) => {
  const { theme } = useTheme();

  const getTabIcon = (routeName, focused) => {
    switch (routeName) {
      case 'Home':
        return { library: 'Ionicons', name: focused ? 'home' : 'home-outline' };
      case 'Weather':
        return { library: 'Ionicons', name: focused ? 'cloudy' : 'cloudy-outline' };
      case 'AIAnalytics':
        return { library: 'Ionicons', name: focused ? 'analytics' : 'analytics-outline' };
      case 'Community':
        return { library: 'Ionicons', name: focused ? 'people' : 'people-outline' };
      case 'Market':
        return { library: 'Ionicons', name: focused ? 'storefront' : 'storefront-outline' };
      case 'Chatbot':
        return { library: 'MaterialCommunityIcons', name: 'robot' };
      case 'Profile':
        return { library: 'Ionicons', name: focused ? 'person' : 'person-outline' };
      default:
        return { library: 'Ionicons', name: 'circle' };
    }
  };



  const renderTab = (route, index) => {
    const isFocused = state.index === index;
    const iconInfo = getTabIcon(route.name, isFocused);

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const IconComponent = iconInfo.library === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tab}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {isFocused ? (
          // Active tab with polished circular design
          <LinearGradient
            colors={[theme.primary, theme.primaryLight]}
            style={styles.activeTab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconComponent
              name={iconInfo.name}
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
        ) : (
          // Inactive tab with clean design
          <View style={styles.inactiveTab}>
            <IconComponent
              name={iconInfo.name}
              size={24}
              color={theme.textSecondary}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };



  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: TAB_BAR_HEIGHT,
      backgroundColor: '#F8F9FA',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      paddingBottom: 18,
      paddingTop: 16,
      borderTopWidth: 0.5,
      borderTopColor: '#E5E7EB',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    activeTab: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    inactiveTab: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(156, 163, 175, 0.08)',
    },
  });

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => renderTab(route, index))}
    </View>
  );
};

export default CustomTabBar;
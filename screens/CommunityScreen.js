import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Share,
  Dimensions,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import { useFocusEffect } from '@react-navigation/native';
import communityService from '../services/communityService';
import farmerProfileService from '../services/farmerProfileService';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernPostCard from '../components/ModernPostCard';

const { width } = Dimensions.get('window');

const CommunityScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { farmer } = useFarmer();
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]); // Store all posts for filtering
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFarmer, setCurrentFarmer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const styles = getStyles(theme);

  useFocusEffect(
    useCallback(() => {
      loadCurrentFarmer();
      loadPosts();
    }, [])
  );

  const loadCurrentFarmer = async () => {
    try {
      const localProfile = await farmerProfileService.getLocalProfile();
      if (localProfile) {
        // Ensure farmer has an ID
        if (!localProfile.id) {
          localProfile.id = `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await farmerProfileService.saveFarmerProfile(localProfile);
        }
        setCurrentFarmer(localProfile);
      }
    } catch (error) {
      console.error('Error loading farmer profile:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const postsData = await communityService.getPosts(20);
      
      // Enhance posts with proper author names and like status
      const enhancedPosts = postsData.map(post => ({
        ...post,
        author: {
          name: post.authorName || post.author?.name || 'Community Member',
          id: post.authorId || post.author?.id || 'anonymous'
        },
        authorName: post.authorName || post.author?.name || 'Community Member',
        likes: post.likes || 0,
        comments: post.comments || 0,
        isLiked: false
      }));
      
      // Check which posts are liked by current user
      if (currentFarmer && enhancedPosts.length > 0) {
        const postsWithLikeStatus = await Promise.all(
          enhancedPosts.map(async (post) => {
            try {
              const isLiked = await communityService.isPostLiked(post.id, currentFarmer.id);
              return { ...post, isLiked };
            } catch (error) {
              return { ...post, isLiked: false };
            }
          })
        );
        setAllPosts(postsWithLikeStatus);
        setPosts(postsWithLikeStatus);
      } else {
        setAllPosts(enhancedPosts);
        setPosts(enhancedPosts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  // Filter posts based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setPosts(allPosts);
    } else {
      const filteredPosts = allPosts.filter(post => {
        const query = searchQuery.toLowerCase();
        const titleMatch = post.title && post.title.toLowerCase().includes(query);
        const tagMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(query));
        return titleMatch || tagMatch;
      });
      setPosts(filteredPosts);
    }
  }, [searchQuery, allPosts]);

  const handleLike = async (postId) => {
    if (!currentFarmer) {
      Alert.alert('Error', 'Please complete your profile to like posts');
      return;
    }

    try {
      // Optimistically update UI
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1
              }
            : post
        )
      );

      // Update in Firestore
      await communityService.togglePostLike(postId, currentFarmer.id);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes + 1 : post.likes - 1
              }
            : post
        )
      );
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const handleShare = async (post) => {
    try {
      const shareMessage = `Check out this farming post: "${post.title}" by ${post.authorName}\n\n${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}\n\nOpen in AGROcure app: agrocure://post/${post.id}`;
      
      await Share.share({
        message: shareMessage,
        title: `${post.title} - AGROcure Community`,
        url: `agrocure://post/${post.id}`, // Deep link
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diff = now - postDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return postDate.toLocaleDateString();
  };

  const getCardTint = (post) => {
    // Generate consistent color tints based on post content
    const colors = [
      ['#E8F5E8', '#F0F8F0'], // Green tint
      ['#E8F0FF', '#F0F6FF'], // Blue tint
      ['#FFF4E6', '#FFF8F0'], // Orange tint
      ['#F0E8FF', '#F6F0FF'], // Purple tint
      ['#FFE8E8', '#FFF0F0'], // Pink tint
      ['#E8FFF4', '#F0FFF8'], // Mint tint
    ];
    
    // Use post ID to consistently assign colors
    const index = post.id ? post.id.length % colors.length : 0;
    return colors[index];
  };

  // Card for each post
  const PostCard = ({ post }) => (
    <TouchableOpacity
      style={styles.postCard}
      // Pass only postId to avoid non-serializable values warning
      onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getCardTint(post)}
        style={styles.postGradient}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <Text style={styles.timestamp}>{formatTime(post.timestamp)}</Text>
            </View>
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postText} numberOfLines={4}>
            {post.content}
          </Text>
          
          {/* Location and Tags */}
          {(post.location || (post.tags && post.tags.length > 0)) && (
            <View style={styles.postMeta}>
              {post.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={1}>{post.location}</Text>
                </View>
              )}
              {post.tags && post.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                  {post.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{post.tags.length - 3}</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Post Image */}
        {post.imageUrl && (
          <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
          </TouchableOpacity>
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={post.isLiked ? '#ff4757' : theme.textSecondary}
            />
            <Text style={[styles.actionText, post.isLiked && { color: '#ff4757' }]}>
              {post.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} />
            <Text style={styles.actionText}>{post.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(post)}
          >
            <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading community posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.gradientPrimary[0]} 
        translucent={false}
      />
      {/* Modern Header */}
      <LinearGradient colors={theme.gradientPrimary} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSubtitle}>Share & Learn Together</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or tags..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Posts Feed */}
      <ScrollView
        style={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to share something with the community!
            </Text>
            <TouchableOpacity
              style={styles.createFirstPostButton}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <LinearGradient
                colors={theme.gradientPrimary}
                style={styles.createFirstPostGradient}
              >
                <Text style={styles.createFirstPostText}>Create First Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => (
            <ModernPostCard 
              key={post.id} 
              post={post} 
              onLike={() => handleLike(post.id)}
              onComment={() => navigation.navigate('PostDetail', { postId: post.id })}
              onShare={() => handleShare(post)}
              onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
            />
          ))
        )}

        {/* Bottom padding for floating action button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <LinearGradient colors={theme.gradientPrimary} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: 95, // Adjusted padding for proper spacing
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textSecondary,
    },
    header: {
      paddingTop: 50,
      paddingBottom: 25,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
      overflow: 'hidden',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
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
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 4,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '600',
    },
    backButton: {
      padding: 4,
      width: 32,
      alignItems: 'center',
    },
    headerSpacer: {
      width: 32,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedContainer: {
      flex: 1,
      paddingTop: 10,
    },
    postCard: {
      marginVertical: 8,
      borderRadius: 16,
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      overflow: 'hidden',
    },
    postGradient: {
      padding: 16,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    authorName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    timestamp: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    postContent: {
      marginBottom: 12,
    },
    postTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    postText: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    postImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 12,
    },
    postActions: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 24,
    },
    actionText: {
      marginLeft: 4,
      fontSize: 14,
      color: theme.textSecondary,
    },
    postMeta: {
      marginTop: 12,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    locationText: {
      marginLeft: 4,
      fontSize: 12,
      color: theme.textSecondary,
      flex: 1,
    },
    tagsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    tagChip: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 6,
      marginBottom: 4,
    },
    tagText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '500',
    },
    moreTagsText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    createFirstPostButton: {
      borderRadius: 25,
      overflow: 'hidden',
    },
    createFirstPostGradient: {
      paddingHorizontal: 32,
      paddingVertical: 12,
      alignItems: 'center',
    },
    createFirstPostText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.textOnPrimary,
    },
    fab: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    fabGradient: {
      width: '100%',
      height: '100%',
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 50, // Pill shape
      paddingHorizontal: 20,
      paddingVertical: 14,
      elevation: 3,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: theme.border + '50',
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      paddingVertical: 0,
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    bottomPadding: {
      height: 100,
    },
  });

export default CommunityScreen;
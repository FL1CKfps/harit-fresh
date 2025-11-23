import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import ModernCard from './ModernCard';

const { width } = Dimensions.get('window');

const ModernPostCard = ({ post, onLike, onComment, onShare, onPress }) => {
  const { theme } = useTheme();
  const [needsReadMore, setNeedsReadMore] = useState(false);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return postDate.toLocaleDateString();
  };

  // Handle text layout to detect if content exceeds 3 lines
  const handleTextLayout = (event) => {
    const { lines } = event.nativeEvent;
    setNeedsReadMore(lines.length > 3);
  };

  const styles = StyleSheet.create({
    postCard: {
      marginHorizontal: 16,
      marginVertical: 10,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      elevation: 2,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 3,
    },
    postTime: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    locationText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginLeft: 4,
      fontStyle: 'italic',
    },
    postContent: {
      marginBottom: 18,
    },
    postTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 10,
      lineHeight: 24,
    },
    postText: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.text,
      marginBottom: 8,
    },
    readMoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 12,
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: theme.primary + '10',
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    readMoreText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '700',
      marginRight: 4,
    },
    imageContainer: {
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 14,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    postImage: {
      width: '100%',
      height: 200,
      backgroundColor: theme.backgroundSecondary,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
    },
    tag: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.primary + '30',
    },
    tagText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '700',
    },
    postActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border + '40',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 24,
      flex: 1,
      justifyContent: 'center',
      marginHorizontal: 4,
      backgroundColor: theme.surface,
    },
    likedButton: {
      backgroundColor: theme.primary + '20',
      borderWidth: 1,
      borderColor: theme.primary + '40',
    },
    actionText: {
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 8,
    },
    likedText: {
      color: theme.primary,
    },
    regularText: {
      color: theme.textSecondary,
    },
    actionLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
  });

  return (
    <ModernCard style={styles.postCard}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(post.authorName || post.author?.name || 'Community Member').charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {post.authorName || post.author?.name || 'Community Member'}
            </Text>
            <Text style={styles.postTime}>
              {formatTimeAgo(post.createdAt || post.timestamp)}
            </Text>
            {post.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={12} color={theme.textSecondary} />
                <Text style={styles.locationText}>{post.location}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Post Content - Outside TouchableOpacity to avoid interference */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        <View style={styles.postContent}>
          {post.title && (
            <Text style={styles.postTitle}>
              {post.title}
            </Text>
          )}
          
          <Text 
            style={styles.postText}
            numberOfLines={3}
            ellipsizeMode="tail"
            onTextLayout={handleTextLayout}
          >
            {post.content}
          </Text>
          
          {needsReadMore && (
            <TouchableOpacity onPress={onPress} style={styles.readMoreContainer}>
              <Text style={styles.readMoreText}>Read more</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
            </TouchableOpacity>
          )}
          
          {post.imageUrl && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: post.imageUrl }} 
                style={styles.postImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
              {post.tags.length > 3 && (
                <View style={[styles.tag, { backgroundColor: theme.textSecondary + '20' }]}>
                  <Text style={[styles.tagText, { color: theme.textSecondary }]}>
                    +{post.tags.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={[styles.actionButton, post.isLiked && styles.likedButton]}
          onPress={onLike}
        >
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={18} 
            color={post.isLiked ? theme.primary : theme.textSecondary} 
          />
          <Text style={[styles.actionLabel, post.isLiked ? styles.likedText : styles.regularText]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.actionLabel, styles.regularText]}>
            Comment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.actionLabel, styles.regularText]}>Share</Text>
        </TouchableOpacity>
      </View>
    </ModernCard>
  );
};

export default ModernPostCard;
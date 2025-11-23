import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import communityService from '../services/communityService';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params;
  const { theme } = useTheme();
  const { farmerProfile } = useFarmer();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await communityService.getPost(postId);
      if (postData) {
        setPost(postData);
        // Load comments for this post
        const commentsData = await communityService.getComments(postId);
        setComments(commentsData || []);
        setLiked(false); // For now, we'll start with false and update when user interacts
        setLikesCount(postData.likes || 0);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!farmerProfile) {
      Alert.alert('Error', 'Please complete your profile to like posts');
      return;
    }

    try {
      const isNowLiked = await communityService.togglePostLike(postId, farmerProfile.id);
      setLiked(isNowLiked);
      setLikesCount(prev => isNowLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    if (!farmerProfile) {
      Alert.alert('Error', 'Please complete your profile to comment');
      return;
    }

    try {
      setSubmittingComment(true);
      const commentData = {
        postId,
        content: commentText.trim(),
        authorId: farmerProfile.id,
        authorName: farmerProfile.name || farmerProfile.fullName || 'Anonymous'
      };
      const newCommentId = await communityService.addComment(commentData);
      const newComment = {
        id: newCommentId,
        ...commentData,
        createdAt: new Date(),
        authorAvatar: farmerProfile.avatar || null
      };
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatContent = (content) => {
    if (!content) return [];

    // Split content into paragraphs and handle formatting
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();

      // Handle headings (lines starting with #)
      if (trimmed.startsWith('# ')) {
        return {
          type: 'heading',
          content: trimmed.substring(2),
          key: `heading-${index}`
        };
      }

      // Handle lists (lines starting with - or *)
      if (trimmed.includes('\n- ') || trimmed.includes('\n* ')) {
        const listItems = trimmed.split('\n').filter(line =>
          line.trim().startsWith('- ') || line.trim().startsWith('* ')
        ).map(item => item.trim().substring(2));

        return {
          type: 'list',
          items: listItems,
          key: `list-${index}`
        };
      }

      // Regular paragraph
      return {
        type: 'paragraph',
        content: trimmed,
        key: `paragraph-${index}`
      };
    });
  };

  const renderContentItem = ({ item }) => {
    switch (item.type) {
      case 'heading':
        return (
          <Text style={[styles.heading, { color: theme.text }]}>
            {item.content}
          </Text>
        );
      case 'list':
        return (
          <View style={styles.listContainer}>
            {item.items.map((listItem, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
                <Text style={[styles.listText, { color: theme.text }]}>
                  {listItem}
                </Text>
              </View>
            ))}
          </View>
        );
      default:
        return (
          <Text style={[styles.paragraph, { color: theme.text }]}>
            {item.content}
          </Text>
        );
    }
  };

  const renderComment = ({ item }) => (
    <ModernCard style={styles.commentCard} padding={16}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAvatar}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.commentInfo}>
          <Text style={[styles.commentAuthor, { color: theme.text }]}>
            {item.authorName || 'Anonymous'}
          </Text>
          <Text style={[styles.commentTime, { color: theme.textSecondary }]}>
            {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={[styles.commentText, { color: theme.text }]}>
        {item.content}
      </Text>
    </ModernCard>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <LinearGradient colors={theme.gradientPrimary} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Post Details</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading post...
          </Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <LinearGradient colors={theme.gradientPrimary} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Post Details</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            Post not found
          </Text>
          <ModernButton
            title="Retry"
            onPress={loadPost}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  const contentItems = formatContent(post.content);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

        {/* Header */}
        <LinearGradient colors={theme.gradientPrimary} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Post Details</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content Area */}
        <View style={styles.contentArea}>
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            ListHeaderComponent={() => (
              <>
                {/* Hero Image Section */}
                {post.imageUrl && (
                  <View style={styles.heroContainer}>
                    <Image source={{ uri: post.imageUrl }} style={styles.heroImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.4)']}
                      style={styles.heroGradient}
                    />
                    <View style={styles.heroContent}>
                      <Text style={styles.heroTitle}>{post.title}</Text>
                    </View>
                  </View>
                )}

                {/* Post Content Card */}
                <ModernCard style={styles.contentCard}>
                  {!post.imageUrl && (
                    <Text style={[styles.postTitle, { color: theme.text }]}>
                      {post.title}
                    </Text>
                  )}

                  {/* Author Info */}
                  <View style={styles.authorRow}>
                    <View style={styles.authorAvatar}>
                      <Ionicons name="person" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.authorDetails}>
                      <Text style={[styles.authorName, { color: theme.text }]}>
                        {post.authorName || 'Anonymous'}
                      </Text>
                      <Text style={[styles.postTime, { color: theme.textSecondary }]}>
                        {new Date(post.createdAt?.toDate?.() || post.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Post Content */}
                  <FlatList
                    data={contentItems}
                    keyExtractor={(item) => item.key}
                    renderItem={renderContentItem}
                    scrollEnabled={false}
                    style={styles.contentList}
                  />

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {post.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={[styles.tagText, { color: theme.primary }]}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ModernCard>

                {/* Action Bar Card */}
                <ModernCard style={styles.actionCard}>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, liked && styles.likedButton]}
                      onPress={handleLike}
                    >
                      <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={24}
                        color={liked ? '#ff4757' : theme.textSecondary}
                      />
                      <Text style={[styles.actionText, { color: liked ? '#ff4757' : theme.textSecondary }]}>
                        {likesCount}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={24} color={theme.textSecondary} />
                      <Text style={[styles.actionText, { color: theme.textSecondary }]}>
                        {comments.length}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="share-outline" size={24} color={theme.textSecondary} />
                      <Text style={[styles.actionText, { color: theme.textSecondary }]}>
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ModernCard>

                {/* Comments Header */}
                <ModernCard style={styles.commentsHeaderCard}>
                  <Text style={[styles.commentsTitle, { color: theme.text }]}>
                    Comments ({comments.length})
                  </Text>
                </ModernCard>
              </>
            )}
            ListEmptyComponent={() => (
              <ModernCard style={styles.emptyCommentsCard}>
                <Ionicons name="chatbubble-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No comments yet. Be the first to comment!
                </Text>
              </ModernCard>
            )}
            contentContainerStyle={styles.flatListContent}
          />
        </View>

        {/* Comment Input - SafeArea so it appears above tab bar */}
        <SafeAreaView edges={["bottom"]} style={styles.commentInputSafeArea}>
          <View style={[styles.commentInputContainer, { backgroundColor: theme.surface }]}> 
            <View style={styles.commentInputWrapper}>
              <TextInput
                style={[styles.commentInput, { color: theme.text, backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                placeholder="Write a comment..."
                placeholderTextColor={theme.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: commentText.trim() ? theme.primary : theme.surfaceVariant }
                ]}
                onPress={handleComment}
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color={commentText.trim() ? "#FFFFFF" : theme.primary} />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={commentText.trim() ? "#FFFFFF" : theme.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Floating FAB to open comment modal (guaranteed visible) */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCommentModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Comment Modal (bottom sheet) */}
        <Modal
          visible={showCommentModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCommentModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}> 
              <Text style={{ fontWeight: '700', marginBottom: 8, color: theme.text }}>Write a comment</Text>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                multiline
                autoFocus
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <TouchableOpacity onPress={() => setShowCommentModal(false)} style={{ marginRight: 12 }}>
                  <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await handleComment();
                    setShowCommentModal(false);
                  }}
                  disabled={!commentText.trim() || submittingComment}
                  style={[styles.modalSend, { backgroundColor: commentText.trim() ? theme.primary : theme.surfaceVariant }]}
                >
                  {submittingComment ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={18} color={commentText.trim() ? '#fff' : theme.primary} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    paddingBottom: 80, // Space for the fixed comment input
    position: 'relative',
  },
  keyboardContainer: {
    flex: 1,
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
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backButton: {
    padding: 4,
    width: 32,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    color: '#212121',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
  },
  heroContainer: {
    position: 'relative',
    height: screenHeight * 0.35,
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contentCard: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 28,
    color: '#212121',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  postTime: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  contentList: {
    marginTop: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 26,
    color: '#212121',
    marginTop: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#212121',
  },
  listContainer: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  listText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    color: '#212121',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tag: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  actionCard: {
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  likedButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  commentsHeaderCard: {
    marginBottom: 12,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  flatListContent: {
    paddingBottom: 180,
  },
  commentCard: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  commentTime: {
    fontSize: 12,
    marginTop: 2,
    color: '#757575',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#212121',
  },
  emptyCommentsCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    color: '#757575',
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 50,
  },

  commentInputSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 90,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  modalSheet: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%'
  },
  modalInput: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    minHeight: 80,
  },
  modalSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#212121',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
};

export default PostDetailScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { useFarmer } from '../contexts/FarmerContext';
import communityService from '../services/communityService';
import farmerProfileService from '../services/farmerProfileService';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';

const { width } = Dimensions.get('window');

const CreatePostScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { farmer } = useFarmer();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [currentFarmer, setCurrentFarmer] = useState(null);
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const styles = getStyles(theme);

  useEffect(() => {
    loadCurrentFarmer();
  }, []);

  const loadCurrentFarmer = async () => {
    try {
      const localProfile = await farmerProfileService.getLocalProfile();
      if (localProfile) {
        setCurrentFarmer(localProfile);
      } else {
        Alert.alert(
          'Profile Required',
          'Please complete your farmer profile to create posts',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error loading farmer profile:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const validatePost = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your post');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('Content Required', 'Please enter some content for your post');
      return false;
    }
    if (title.length > 100) {
      Alert.alert('Title Too Long', 'Title should be less than 100 characters');
      return false;
    }
    if (content.length > 1000) {
      Alert.alert('Content Too Long', 'Content should be less than 1000 characters');
      return false;
    }
    return true;
  };

  const handlePost = async () => {
    if (!validatePost()) return;
    if (!currentFarmer) {
      Alert.alert('Error', 'Farmer profile not found. Please try again.');
      return;
    }

    try {
      setIsPosting(true);

      const postData = {
        title: title.trim(),
        content: content.trim(),
        image: selectedImage?.uri || null,
        authorId: currentFarmer?.id || 'anonymous',
        authorName: currentFarmer?.name || 'Anonymous Farmer',
        location: location.trim() || (currentFarmer?.village ? `${currentFarmer.village}, ${currentFarmer.district}` : null),
        tags: tags || []
      };

      await communityService.createPost(postData);

      Alert.alert(
        'Post Created!',
        'Your post has been shared with the community',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const resetForm = () => {
    Alert.alert(
      'Discard Post?',
      'Are you sure you want to discard this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setTitle('');
            setContent('');
            setSelectedImage(null);
            setLocation('');
            setTags([]);
            setTagInput('');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const fetchCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Please grant location permission to fetch your current location',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        let locationString = '';
        
        if (address.city && address.region) {
          locationString = `${address.city}, ${address.region}`;
        } else if (address.district && address.region) {
          locationString = `${address.district}, ${address.region}`;
        } else if (address.region) {
          locationString = address.region;
        } else {
          locationString = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        }
        
        setLocation(locationString);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to fetch your current location. Please try again or enter manually.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const addLocationPrompt = () => {
    Alert.alert(
      'Add Location',
      'Choose how you want to add location',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use Current Location', 
          onPress: fetchCurrentLocation
        },
        { 
          text: 'Enter Manually', 
          onPress: () => {
            Alert.prompt(
              'Add Location',
              'Where is this post from?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Add', 
                  onPress: (text) => {
                    if (text && text.trim()) {
                      setLocation(text.trim());
                    }
                  }
                },
              ],
              'plain-text',
              location,
              'default'
            );
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handleTagInput = (text) => {
    setTagInput(text);
    
    // Check if user typed a comma
    if (text.includes(',')) {
      const newTags = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const lastTag = newTags.pop(); // Get the text after the last comma
      
      // Add new tags to existing ones (avoid duplicates)
      const updatedTags = [...tags];
      newTags.forEach(tag => {
        if (!updatedTags.includes(tag) && tag.length > 0) {
          updatedTags.push(tag);
        }
      });
      
      setTags(updatedTags);
      setTagInput(lastTag || ''); // Keep the text after the last comma
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addCurrentTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient colors={theme.gradientPrimary} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={resetForm}>
          <Ionicons name="close" size={24} color={theme.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Author Info */}
        <View style={styles.authorSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color={theme.primary} />
          </View>
          <View>
            <Text style={styles.authorName}>{currentFarmer?.name || 'Farmer'}</Text>
            <Text style={styles.postingTo}>Posting to Community</Text>
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="What's your post about?"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            multiline={false}
          />
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>

        {/* Content Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Content</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Share your farming experience, tips, or ask questions..."
            placeholderTextColor={theme.textSecondary}
            value={content}
            onChangeText={setContent}
            maxLength={1000}
            multiline={true}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{content.length}/1000</Text>
        </View>

        {/* Image Section */}
        <View style={styles.imageSection}>
          <Text style={styles.inputLabel}>Image (Optional)</Text>
          {selectedImage ? (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <Ionicons name="close-circle" size={24} color="#ff4757" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
              <View style={styles.addImageContent}>
                <Ionicons name="camera" size={32} color={theme.textSecondary} />
                <Text style={styles.addImageText}>Add Photo</Text>
                <Text style={styles.addImageSubtext}>
                  Share a picture related to your post
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Location Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Location (Optional)</Text>
          <View style={styles.locationInputContainer}>
            <TextInput
              style={[styles.titleInput, { flex: 1 }]}
              placeholder="Where is this from? (e.g. My farm in Rajkot)"
              placeholderTextColor={theme.textSecondary}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={fetchCurrentLocation}
              disabled={fetchingLocation}
            >
              <Ionicons 
                name={fetchingLocation ? "hourglass-outline" : "location"} 
                size={20} 
                color={theme.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tags (Optional)</Text>
          
          {/* Existing Tags */}
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tagChip}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <Ionicons name="close" size={16} color={theme.textOnPrimary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Tag Input */}
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Type tags and press comma to add (e.g. rice, irrigation)"
              placeholderTextColor={theme.textSecondary}
              value={tagInput}
              onChangeText={handleTagInput}
              onSubmitEditing={addCurrentTag}
              returnKeyType="done"
            />
            {tagInput.trim().length > 0 && (
              <TouchableOpacity style={styles.addTagButton} onPress={addCurrentTag}>
                <Ionicons name="add" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Post Button */}
        <TouchableOpacity
          style={[
            styles.postButtonMain,
            (!title.trim() || !content.trim() || isPosting) && styles.postButtonMainDisabled
          ]}
          onPress={handlePost}
          disabled={!title.trim() || !content.trim() || isPosting}
        >
          <LinearGradient
            colors={(!title.trim() || !content.trim() || isPosting) ? ['#ccc', '#999'] : theme.gradientPrimary}
            style={styles.postButtonGradient}
          >
            {isPosting ? (
              <View style={styles.postButtonContent}>
                <Text style={styles.postButtonMainText}>Posting...</Text>
              </View>
            ) : (
              <View style={styles.postButtonContent}>
                <Ionicons name="send" size={20} color={theme.textOnPrimary} />
                <Text style={styles.postButtonMainText}>Share Post</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips for better posts:</Text>
          <Text style={styles.tipItem}>• Use clear, descriptive titles</Text>
          <Text style={styles.tipItem}>• Share specific details about your experience</Text>
          <Text style={styles.tipItem}>• Include photos to make your post more engaging</Text>
          <Text style={styles.tipItem}>• Ask questions to encourage discussion</Text>
          <Text style={styles.tipItem}>• Be respectful and helpful to other farmers</Text>
        </View>

        {/* Bottom padding for keyboard */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 20,
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textOnPrimary,
    },
    headerSpacer: {
      width: 40, // Same width as back button for centering
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    authorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
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
    postingTo: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    inputContainer: {
      marginTop: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    titleInput: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    contentInput: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 120,
    },
    characterCount: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    imageSection: {
      marginTop: 20,
    },
    selectedImageContainer: {
      position: 'relative',
      marginTop: 8,
    },
    selectedImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: theme.surface,
      borderRadius: 12,
    },
    addImageButton: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
      paddingVertical: 40,
      marginTop: 8,
    },
    addImageContent: {
      alignItems: 'center',
    },
    addImageText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginTop: 8,
    },
    addImageSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    tipsSection: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 12,
    },
    tipItem: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 6,
      lineHeight: 20,
    },
    // Tags styles
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      fontSize: 14,
      color: theme.textOnPrimary,
      marginRight: 4,
    },
    tagInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tagInput: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    addTagButton: {
      marginLeft: 8,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    locationInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationButton: {
      marginLeft: 8,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    // Post button styles
    postButtonMain: {
      marginTop: 24,
      marginBottom: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    postButtonMainDisabled: {
      opacity: 0.6,
    },
    postButtonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    postButtonMainText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textOnPrimary,
      marginLeft: 8,
    },
    bottomPadding: {
      height: 20,
    },
  });

export default CreatePostScreen;
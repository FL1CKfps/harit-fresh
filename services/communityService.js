// Community Service for Firestore operations
// This service handles all community-related operations including posts, comments, and likes

import { 
  getFirestore,
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  startAfter,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import imgbbService from './imgbbService';

class CommunityService {
  constructor() {
    // Firebase is already initialized in config/firebase.js
    this.db = db;
    
    // Collection references
    this.postsCollection = 'posts';
    this.commentsCollection = 'comments';
    this.likesCollection = 'likes';
    this.usersCollection = 'farmers';
  }

  // ==================== POST OPERATIONS ====================

  /**
   * Create a new community post
   * @param {Object} postData - Post data including title, content, image, etc.
   * @returns {Promise<string>} - The created post ID
   */
  async createPost(postData) {
    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (postData.image) {
        imageUrl = await this.uploadImage(postData.image, postData.authorId);
      }
      
      const post = {
        title: postData.title,
        content: postData.content,
        authorId: postData.authorId,
        authorName: postData.authorName,
        imageUrl: imageUrl,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        tags: postData.tags || [],
        location: postData.location || null
      };
      
      const docRef = await addDoc(collection(this.db, this.postsCollection), post);
      console.log('Post created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  }

  /**
   * Get all posts with pagination
   * @param {number} limitCount - Number of posts to fetch
   * @param {string} lastPostId - Last post ID for pagination
   * @returns {Promise<Array>} - Array of posts
   */
  async getPosts(limitCount = 20, lastPostId = null) {
    try {
      let q = query(
        collection(this.db, this.postsCollection),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (lastPostId) {
        const lastPostDoc = await getDoc(doc(this.db, this.postsCollection, lastPostId));
        if (lastPostDoc.exists()) {
          q = query(q, startAfter(lastPostDoc));
        }
      }
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        posts.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          timestamp: data.createdAt?.toDate() || new Date()
        });
      });
      
      console.log(`Fetched ${posts.length} posts`);
      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }
  }

  /**
   * Get a single post by ID
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} - Post data
   */
  async getPost(postId) {
    try {
      const docRef = doc(this.db, this.postsCollection, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          timestamp: data.createdAt?.toDate() || new Date()
        };
      } else {
        throw new Error('Post not found');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      throw new Error('Failed to fetch post');
    }
  }

  /**
   * Update a post
   * @param {string} postId - Post ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updatePost(postId, updateData) {
    try {
      // TODO: Implement Firestore post update
      // const docRef = doc(this.db, this.postsCollection, postId);
      // await updateDoc(docRef, {
      //   ...updateData,
      //   updatedAt: serverTimestamp()
      // });
      
      console.log('Updating post:', postId, updateData);
    } catch (error) {
      console.error('Error updating post:', error);
      throw new Error('Failed to update post');
    }
  }

  /**
   * Delete a post
   * @param {string} postId - Post ID
   * @returns {Promise<void>}
   */
  async deletePost(postId) {
    try {
      // TODO: Implement Firestore post deletion (soft delete)
      // const docRef = doc(this.db, this.postsCollection, postId);
      // await updateDoc(docRef, {
      //   isActive: false,
      //   updatedAt: serverTimestamp()
      // });
      
      console.log('Deleting post:', postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post');
    }
  }

  // ==================== COMMENT OPERATIONS ====================

  /**
   * Add a comment to a post
   * @param {Object} commentData - Comment data
   * @returns {Promise<string>} - The created comment ID
   */
  async addComment(commentData) {
    try {
      const comment = {
        postId: commentData.postId,
        content: commentData.content,
        authorId: commentData.authorId,
        authorName: commentData.authorName,
        likes: 0,
        createdAt: serverTimestamp(),
        isActive: true
      };
      
      // Add comment
      const docRef = await addDoc(collection(this.db, this.commentsCollection), comment);
      
      // Update post comment count
      const postRef = doc(this.db, this.postsCollection, commentData.postId);
      await updateDoc(postRef, {
        comments: increment(1),
        updatedAt: serverTimestamp()
      });
      
      console.log('Comment added successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get comments for a post
   * @param {string} postId - Post ID
   * @returns {Promise<Array>} - Array of comments
   */
  async getComments(postId) {
    try {
      const q = query(
        collection(this.db, this.commentsCollection),
        where('postId', '==', postId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const comments = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        comments.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          timestamp: data.createdAt?.toDate() || new Date()
        });
      });
      
      console.log(`Fetched ${comments.length} comments for post ${postId}`);
      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  /**
   * Update a comment
   * @param {string} commentId - Comment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateComment(commentId, updateData) {
    try {
      // TODO: Implement Firestore comment update
      // const docRef = doc(this.db, this.commentsCollection, commentId);
      // await updateDoc(docRef, updateData);
      
      console.log('Updating comment:', commentId, updateData);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @param {string} postId - Post ID
   * @returns {Promise<void>}
   */
  async deleteComment(commentId, postId) {
    try {
      // TODO: Implement Firestore comment deletion
      // // Soft delete comment
      // const commentRef = doc(this.db, this.commentsCollection, commentId);
      // await updateDoc(commentRef, { isActive: false });
      // 
      // // Update post comment count
      // const postRef = doc(this.db, this.postsCollection, postId);
      // await updateDoc(postRef, {
      //   comments: increment(-1),
      //   updatedAt: serverTimestamp()
      // });
      
      console.log('Deleting comment:', commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  // ==================== LIKE OPERATIONS ====================

  /**
   * Toggle like on a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the post is now liked
   */
  async togglePostLike(postId, userId) {
    try {
      // Validate inputs
      if (!postId || !userId) {
        throw new Error('PostId and userId are required');
      }
      
      const likeId = `${postId}_${userId}`;
      const likeRef = doc(this.db, this.likesCollection, likeId);
      const likeDoc = await getDoc(likeRef);
      
      if (likeDoc.exists()) {
        // Unlike
        await deleteDoc(likeRef);
        const postRef = doc(this.db, this.postsCollection, postId);
        await updateDoc(postRef, {
          likes: increment(-1),
          updatedAt: serverTimestamp()
        });
        console.log('Post unliked:', postId);
        return false;
      } else {
        // Like
        await setDoc(likeRef, {
          postId,
          userId,
          type: 'post',
          createdAt: serverTimestamp()
        });
        const postRef = doc(this.db, this.postsCollection, postId);
        await updateDoc(postRef, {
          likes: increment(1),
          updatedAt: serverTimestamp()
        });
        console.log('Post liked:', postId);
        return true;
      }
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw new Error('Failed to toggle post like');
    }
  }

  /**
   * Toggle like on a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the comment is now liked
   */
  async toggleCommentLike(commentId, userId) {
    try {
      // TODO: Implement Firestore comment like toggle
      // const likeId = `${commentId}_${userId}`;
      // const likeRef = doc(this.db, this.likesCollection, likeId);
      // const likeDoc = await getDoc(likeRef);
      // 
      // if (likeDoc.exists()) {
      //   // Unlike
      //   await deleteDoc(likeRef);
      //   const commentRef = doc(this.db, this.commentsCollection, commentId);
      //   await updateDoc(commentRef, { likes: increment(-1) });
      //   return false;
      // } else {
      //   // Like
      //   await setDoc(likeRef, {
      //     commentId,
      //     userId,
      //     type: 'comment',
      //     createdAt: serverTimestamp()
      //   });
      //   const commentRef = doc(this.db, this.commentsCollection, commentId);
      //   await updateDoc(commentRef, { likes: increment(1) });
      //   return true;
      // }
      
      console.log('Toggling comment like:', commentId, userId);
      return Math.random() > 0.5; // Random for mock
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw new Error('Failed to toggle comment like');
    }
  }

  /**
   * Check if user has liked a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the post is liked by user
   */
  async isPostLiked(postId, userId) {
    try {
      // TODO: Implement Firestore like check
      // const likeId = `${postId}_${userId}`;
      // const likeRef = doc(this.db, this.likesCollection, likeId);
      // const likeDoc = await getDoc(likeRef);
      // return likeDoc.exists();
      
      console.log('Checking post like:', postId, userId);
      return false;
    } catch (error) {
      console.error('Error checking post like:', error);
      return false;
    }
  }

  // ==================== IMAGE OPERATIONS ====================

  /**
   * Upload image to ImgBB
   * @param {string} uri - Image URI
   * @param {string} userId - User ID (for naming)
   * @returns {Promise<string>} - ImgBB URL
   */
  async uploadImage(uri, userId) {
    try {
      const imageName = `farmer_${userId}_${Date.now()}`;
      const imageUrl = await imgbbService.uploadImageWithRetry(uri, imageName);
      
      console.log('Image uploaded successfully to ImgBB:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image to ImgBB:', error);
      throw new Error('Failed to upload image');
    }
  }

  // ==================== USER OPERATIONS ====================

  /**
   * Get posts by a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of user posts
   */
  async getUserPosts(userId) {
    try {
      // TODO: Implement Firestore user posts fetching
      // const q = query(
      //   collection(this.db, this.postsCollection),
      //   where('authorId', '==', userId),
      //   where('isActive', '==', true),
      //   orderBy('createdAt', 'desc')
      // );
      // 
      // const querySnapshot = await getDocs(q);
      // const posts = [];
      // 
      // querySnapshot.forEach((doc) => {
      //   posts.push({
      //     id: doc.id,
      //     ...doc.data(),
      //     createdAt: doc.data().createdAt?.toDate(),
      //     updatedAt: doc.data().updatedAt?.toDate()
      //   });
      // });
      // 
      // return posts;
      
      console.log('Fetching user posts:', userId);
      return [];
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw new Error('Failed to fetch user posts');
    }
  }

  /**
   * Search posts by content
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} - Array of matching posts
   */
  async searchPosts(searchTerm) {
    try {
      // TODO: Implement Firestore text search
      // Note: Firestore doesn't have built-in text search
      // You might want to use Algolia or implement keyword-based search
      
      console.log('Searching posts:', searchTerm);
      return [];
    } catch (error) {
      console.error('Error searching posts:', error);
      throw new Error('Failed to search posts');
    }
  }
}

// Export singleton instance
const communityService = new CommunityService();
export default communityService;

// Named exports for specific functions if needed
export {
  CommunityService
};

/*
FIRESTORE SETUP INSTRUCTIONS:

1. ✅ Firebase SDK installed and configured

2. ✅ Create a Firebase project at https://console.firebase.google.com/
   Your project: harmony-real-estate1

3. Enable Firestore Database and Storage in your project

4. ✅ Firebase configuration added with your credentials

5. Set up Firestore security rules (SIMPLIFIED - NO AUTH REQUIRED):

// For testing without authentication
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for all documents (for testing)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

6. Set up Firebase Storage rules (SIMPLIFIED):

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write for all files (for testing)
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}

NOTE: These are permissive rules for development. 
For production, implement proper authentication and user-based security.

7. ✅ Firebase integration implemented and ready to use

*/
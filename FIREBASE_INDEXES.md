# Firebase Indexes Required

Based on the error logs, you need to create Firestore composite indexes for the community features.

## Required Indexes

### 1. Posts Index
**Collection:** `posts`

**Fields to index:**
1. `isActive` (Ascending)
2. `createdAt` (Descending) 
3. `__name__` (Ascending)

**Auto-create link:** 
https://console.firebase.google.com/v1/r/project/harmony-real-estate1/firestore/indexes?create_composite=ClJwcm9qZWN0cy9oYXJtb255LXJlYWwtZXN0YXRlMS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcG9zdHMvaW5kZXhlcy9fEAEaDAoIaXNBY3RpdmUQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC

### 2. Comments Index
**Collection:** `comments`

**Fields to index:**
1. `isActive` (Ascending)
2. `postId` (Ascending)
3. `createdAt` (Ascending)
4. `__name__` (Ascending)

**Auto-create link:**
https://console.firebase.google.com/v1/r/project/harmony-real-estate1/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oYXJtb255LXJlYWwtZXN0YXRlMS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvY29tbWVudHMvaW5kZXhlcy9fEAEaDAoIaXNBY3RpdmUQARoKCgZwb3N0SWQQARoNCgljcmVhdGVkQXQQARoMCghfX25hbWVfXxAB

## How to Create Indexes Manually

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `harmony-real-estate1`
3. Go to Firestore Database → Indexes
4. Click "Create Index" 
5. Follow the field configurations above

## Index Purpose

This index is needed for the query in CommunityService.js:
```javascript
query(
  collection(db, 'posts'),
  where('isActive', '==', true),
  orderBy('createdAt', 'desc'),
  limit(20)
)
```

## Time to Build

The index usually takes 1-2 minutes to build for a new collection.

## Updated Security Rules

If you haven't updated the security rules yet, here are the simplified ones:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write to all documents (for development only)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

And for Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write to all files (for development only)
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**Important:** These are permissive rules for development. In production, implement proper authentication and authorization.
/**
 * Firebase Functions - Supporting both v1 and v2 during migration
 * 
 * See: https://firebase.google.com/docs/functions/2nd-gen-upgrade
 */

// Initialize Firebase Admin SDK (will be used by all functions)
const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");

// Initialize the app only once
if (!admin.apps.length) {
  admin.initializeApp();
}

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// Import the functions from the modules
const dailyQuestionCount = require("./dailyQuestionCount");
const userMatching = require("./userMatching");

// User stats update function - improved for better accuracy
const updateUserStats = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    try {
      const statsRef = admin.firestore().doc('stats/public');
      
      // Check if this is a create or delete operation
      const before = change.before.exists;
      const after = change.after.exists;
      
      if (!before && after) {
        // User created - also verify total count for accuracy
        await admin.firestore().runTransaction(async (transaction) => {
          // Get actual user count for verification
          const usersSnapshot = await admin.firestore().collection('users').get();
          const actualCount = usersSnapshot.size;
          
          transaction.set(statsRef, { 
            userCount: actualCount,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
        console.log('User count updated after user creation - verified count');
      } else if (before && !after) {
        // User deleted - also verify total count for accuracy
        await admin.firestore().runTransaction(async (transaction) => {
          // Get actual user count for verification
          const usersSnapshot = await admin.firestore().collection('users').get();
          const actualCount = usersSnapshot.size;
          
          transaction.set(statsRef, { 
            userCount: actualCount,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
        console.log('User count updated after user deletion - verified count');
      }
      
      return null;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return null;
    }
  });

// Scheduled function to verify and correct user count every hour
const verifyUserCount = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      console.log('Starting scheduled user count verification...');
      
      const statsRef = admin.firestore().doc('stats/public');
      const usersSnapshot = await admin.firestore().collection('users').get();
      const actualCount = usersSnapshot.size;
      
      // Get current stored count
      const statsDoc = await statsRef.get();
      const storedCount = statsDoc.exists ? (statsDoc.data().userCount || 0) : 0;
      
      if (actualCount !== storedCount) {
        console.log(`Count mismatch detected: stored ${storedCount}, actual ${actualCount}. Correcting...`);
        
        await statsRef.set({
          userCount: actualCount,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          lastVerified: admin.firestore.FieldValue.serverTimestamp(),
          correctedFromCount: storedCount
        }, { merge: true });
        
        console.log(`User count corrected from ${storedCount} to ${actualCount}`);
      } else {
        // Update last verified timestamp
        await statsRef.set({
          lastVerified: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`User count verification passed: ${actualCount} users`);
      }
      
      return null;
    } catch (error) {
      console.error('Error in scheduled user count verification:', error);
      return null;
    }
  });

// One-time function to initialize stats collection with current user count
// This can be triggered manually via Firebase Console or removed after first run
const initializeUserStats = functions.https.onCall(async (data, context) => {
  try {
    // Only allow authenticated admin users to call this function
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is admin
    const userDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admin users can initialize stats');
    }

    // Count existing users
    const usersSnapshot = await admin.firestore().collection('users').get();
    const userCount = usersSnapshot.size;

    // Initialize stats document
    await admin.firestore().doc('stats/public').set({
      userCount: userCount,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      initialized: true
    });

    console.log(`Stats initialized with ${userCount} users`);
    return { success: true, userCount: userCount };
  } catch (error) {
    console.error('Error initializing user stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to initialize stats');
  }
});

// Export the v1 functions
exports.dailyQuestionCount = dailyQuestionCount.dailyQuestionReport;
exports.userMatchingOnUserUpdate = userMatching.onUserUpdate;
exports.userMatchingScheduled = userMatching.scheduledMatching;
exports.updateUserStats = updateUserStats;
exports.initializeUserStats = initializeUserStats;
exports.verifyUserCount = verifyUserCount;

// Export the v2 functions (new name)
exports.dailyQuestionCountV2 = require("./v2/dailyQuestionCount").dailyQuestionReport;
exports.userProfileUpdatedV2 = require("./v2/userMatching").onUserProfileUpdated;
exports.userMatchingScheduledV2 = require("./v2/userMatching").scheduledUserMatching;

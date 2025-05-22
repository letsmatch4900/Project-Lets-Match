// Core algorithm functionality
const userMatchingCore = {
  /**
   * Calculate one-way match score for a single question
   * @param {number} potentialPartnerSelf - Potential partner's self score
   * @param {number} prefersPartnerMin - Minimum preferred score
   * @param {number} prefersPartnerMax - Maximum preferred score
   * @param {number} strictness - How important this question is (0-10)
   * @return {number} - Score between 0 and 1
   */
  calculateOneWayQuestionScore: function(potentialPartnerSelf, prefersPartnerMin, prefersPartnerMax, strictness) {
    // If potential partner is within preferred range, score is 1
    if (potentialPartnerSelf >= prefersPartnerMin && potentialPartnerSelf <= prefersPartnerMax) {
      return 1;
    }

    // Calculate how far outside the range they are (normalized by 10)
    const distanceMin = Math.abs(potentialPartnerSelf - prefersPartnerMin);
    const distanceMax = Math.abs(potentialPartnerSelf - prefersPartnerMax);
    const minDistance = Math.min(distanceMin, distanceMax);

    // Calculate penalty based on distance and strictness
    return (1 - (minDistance / 10)) * ((10 - strictness) / 10);
  },

  /**
   * Calculate geometric mean of an array of numbers
   * @param {Array<number>} scores - Array of scores
   * @return {number} - Geometric mean
   */
  geometricMean: function(scores) {
    if (scores.length === 0) return 0;
    // If any score is 0, the geometric mean would be 0
    if (scores.includes(0)) return 0;

    const product = scores.reduce((acc, score) => acc * score, 1);
    return Math.pow(product, 1 / scores.length);
  },

  /**
   * Calculate one-way match score between two users
   * @param {Object} userA - First user's answers
   * @param {Object} userB - Second user's answers
   * @return {number} - One-way match score from A to B
   */
  calculateOneWayMatchScore: function(userA, userB) {
    const questionScores = [];

    // Calculate score for each question
    for (const [questionId, userAAnswers] of Object.entries(userA)) {
      // Skip if the other user hasn't answered this question
      if (!userB[questionId]) continue;

      const potentialPartnerSelf = userB[questionId].selfScore;
      const prefersPartnerMin = userAAnswers.prefMin;
      const prefersPartnerMax = userAAnswers.prefMax;
      const strictness = userAAnswers.strictness;

      const score = this.calculateOneWayQuestionScore(
        potentialPartnerSelf,
        prefersPartnerMin,
        prefersPartnerMax,
        strictness,
      );

      questionScores.push(score);
    }

    // Return geometric mean of all question scores
    return this.geometricMean(questionScores);
  },

  /**
   * Calculate two-way match score between users
   * @param {Object} userA - First user's answers
   * @param {Object} userB - Second user's answers
   * @return {number} - Two-way match score
   */
  calculateTwoWayMatchScore: function(userA, userB) {
    const aToB = this.calculateOneWayMatchScore(userA, userB);
    const bToA = this.calculateOneWayMatchScore(userB, userA);

    // Return geometric mean of both one-way scores
    return this.geometricMean([aToB, bToA]);
  },
};

// Import the Firebase Functions modules for v2
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Use the admin SDK initialized in index.js
const db = admin.firestore();

/**
 * Store match results for both users
 * @param {string} userIdA - First user ID
 * @param {string} userIdB - Second user ID
 * @param {number} score - Match score
 * @return {Promise} - Promise resolving when both updates are complete
 */
async function storeMatchResult(userIdA, userIdB, score) {
  const batch = db.batch();

  // Store score under first user
  const userAMatchRef = db.collection("users").doc(userIdA).collection("matches").doc(userIdB);
  batch.set(userAMatchRef, {score, updatedAt: admin.firestore.FieldValue.serverTimestamp()});

  // Store score under second user
  const userBMatchRef = db.collection("users").doc(userIdB).collection("matches").doc(userIdA);
  batch.set(userBMatchRef, {score, updatedAt: admin.firestore.FieldValue.serverTimestamp()});

  return batch.commit();
}

/**
 * Compute match scores between a user and all other users
 * @param {string} userId - User ID to compute matches for
 * @param {Object} userData - User profile data
 * @return {Promise} - Promise resolving when all match computations are complete
 */
async function computeUserMatches(userId, userData) {
  try {
    // Skip if user has no question answers
    if (!userData.questionAnswers || Object.keys(userData.questionAnswers).length === 0) {
      console.log(`User ${userId} has no question answers, skipping match`);
      return;
    }

    // Get all other users
    const usersSnapshot = await db.collection("users").get();
    const matchPromises = [];

    usersSnapshot.forEach((doc) => {
      const otherUserId = doc.id;
      const otherUserData = doc.data();

      // Skip if same user or no question answers
      if (otherUserId === userId || !otherUserData.questionAnswers || Object.keys(otherUserData.questionAnswers).length === 0) {
        return;
      }

      // Check if match already exists and is recent (within 1 day)
      const checkExistingMatch = async () => {
        const matchDoc = await db.collection("users").doc(userId).collection("matches").doc(otherUserId).get();
        if (matchDoc.exists) {
          const matchData = matchDoc.data();
          if (matchData.updatedAt && (new Date() - matchData.updatedAt.toDate()) < 24 * 60 * 60 * 1000) {
            return true; // Match is recent, skip recomputation
          }
        }
        return false;
      };

      matchPromises.push(
        checkExistingMatch().then((recentMatchExists) => {
          if (!recentMatchExists) {
            // Calculate match score using questionAnswers instead of questionnaire
            const score = userMatchingCore.calculateTwoWayMatchScore(userData.questionAnswers, otherUserData.questionAnswers);
            // Store result
            return storeMatchResult(userId, otherUserId, score);
          }
        }),
      );
    });

    await Promise.all(matchPromises);
    console.log(`Completed matching for user ${userId}`);
  } catch (error) {
    console.error(`Error computing matches for user ${userId}:`, error);
  }
}

/**
 * Background function triggered when a user profile is updated.
 * Computes matches between the updated user and all other users.
 */
exports.onUserProfileUpdated = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    console.log(`Profile updated for user ${userId}`);

    // Get the user data after the update
    const userData = event.data.after.data();

    // Only process if user data exists
    if (!userData) {
      console.log(`No data for user ${userId}, skipping match`);
      return null;
    }

    try {
      await computeUserMatches(userId, userData);
      console.log(`Successfully computed matches for user ${userId}`);
    } catch (error) {
      console.error(`Error computing matches for user ${userId}:`, error);
    }
  }
);

/**
 * Scheduled function that runs daily to update all user matches
 */
exports.scheduledUserMatching = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "UTC",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    console.log("Starting scheduled user matching");
    
    try {
      // Get all users (removed profileComplete requirement)
      const usersSnapshot = await db.collection("users").get();
      
      console.log(`Found ${usersSnapshot.size} users to process`);
      
      const matchPromises = [];
      
      usersSnapshot.forEach(doc => {
        const userId = doc.id;
        const userData = doc.data();
        
        // Only process users with questionAnswers
        if (userData.questionAnswers && Object.keys(userData.questionAnswers).length > 0) {
          matchPromises.push(computeUserMatches(userId, userData));
        } else {
          console.log(`User ${userId} has no question answers, skipping`);
        }
      });
      
      await Promise.all(matchPromises);
      console.log("Completed scheduled user matching");
    } catch (error) {
      console.error("Error in scheduled user matching:", error);
    }
  }
);

// Export the core algorithm for testing
exports.utils = userMatchingCore; 
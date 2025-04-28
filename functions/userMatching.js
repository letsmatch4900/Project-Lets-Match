// Core algorithm functionality
const userMatchingCore = {
  /**
   * Calculate one-way match score for a single question
   * @param {number} potentialPartnerSelf - Potential partner's self score
   * @param {number} prefersPartnerMin - Minimum preferred score
   * @param {number} prefersPartnerMax - Maximum preferred score
   * @param {number} strictness - How important this question is (0-10)
   * @returns {number} - Score between 0 and 1
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
   * @returns {number} - Geometric mean
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
   * @returns {number} - One-way match score from A to B
   */
  calculateOneWayMatchScore: function(userA, userB) {
    const questionScores = [];
    
    // Calculate score for each question
    for (const [questionId, userAAnswers] of Object.entries(userA)) {
      // Skip if the other user hasn't answered this question
      if (!userB[questionId]) continue;
      
      const potentialPartnerSelf = userB[questionId].self;
      const prefersPartnerMin = userAAnswers.prefRange[0];
      const prefersPartnerMax = userAAnswers.prefRange[1];
      const strictness = userAAnswers.strictness;
      
      const score = this.calculateOneWayQuestionScore(
        potentialPartnerSelf,
        prefersPartnerMin,
        prefersPartnerMax,
        strictness
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
   * @returns {number} - Two-way match score
   */
  calculateTwoWayMatchScore: function(userA, userB) {
    const aToB = this.calculateOneWayMatchScore(userA, userB);
    const bToA = this.calculateOneWayMatchScore(userB, userA);
    
    // Return geometric mean of both one-way scores
    return this.geometricMean([aToB, bToA]);
  }
};

// Only initialize Firebase-related functionality if we're in a Firebase environment
let firestoreFunctions = {};

try {
  const functions = require('firebase-functions');
  const admin = require('firebase-admin');

  // Initialize Firebase Admin if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const db = admin.firestore();

  /**
   * Store match results for both users
   * @param {string} userIdA - First user ID
   * @param {string} userIdB - Second user ID
   * @param {number} score - Match score
   * @returns {Promise} - Promise resolving when both updates are complete
   */
  async function storeMatchResult(userIdA, userIdB, score) {
    const batch = db.batch();
    
    // Store score under first user
    const userAMatchRef = db.collection('users').doc(userIdA).collection('matches').doc(userIdB);
    batch.set(userAMatchRef, { score, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    
    // Store score under second user
    const userBMatchRef = db.collection('users').doc(userIdB).collection('matches').doc(userIdA);
    batch.set(userBMatchRef, { score, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    
    return batch.commit();
  }

  /**
   * Compute match scores between a user and all other users
   * @param {string} userId - User ID to compute matches for
   * @returns {Promise} - Promise resolving when all matches are computed
   */
  async function computeMatchesForUser(userId) {
    try {
      // Get the user's answers
      const userSnapshot = await db.collection('users').doc(userId).get();
      const userData = userSnapshot.data();
      
      if (!userData || !userData.questionnaire) {
        console.log(`No questionnaire data found for user ${userId}`);
        return;
      }
      
      // Get all other users
      const usersSnapshot = await db.collection('users').get();
      const matchPromises = [];
      
      usersSnapshot.forEach(doc => {
        const otherUserId = doc.id;
        const otherUserData = doc.data();
        
        // Skip if same user or no questionnaire data
        if (otherUserId === userId || !otherUserData.questionnaire) {
          return;
        }
        
        // Check if match already exists and is recent (within 1 day)
        const checkExistingMatch = async () => {
          const matchDoc = await db.collection('users').doc(userId).collection('matches').doc(otherUserId).get();
          if (matchDoc.exists) {
            const matchData = matchDoc.data();
            if (matchData.updatedAt && (new Date() - matchData.updatedAt.toDate()) < 24 * 60 * 60 * 1000) {
              return true; // Match is recent, skip recomputation
            }
          }
          return false;
        };
        
        matchPromises.push(
          checkExistingMatch().then(recentMatchExists => {
            if (!recentMatchExists) {
              // Calculate match score
              const score = userMatchingCore.calculateTwoWayMatchScore(userData.questionnaire, otherUserData.questionnaire);
              // Store result
              return storeMatchResult(userId, otherUserId, score);
            }
          })
        );
      });
      
      await Promise.all(matchPromises);
      console.log(`Completed matching for user ${userId}`);
    } catch (error) {
      console.error(`Error computing matches for user ${userId}:`, error);
    }
  }

  // Define Cloud Functions
  firestoreFunctions = {
    /**
     * Cloud function triggered when a user updates their questionnaire
     */
    onUserUpdate: functions.firestore
      .document('users/{userId}')
      .onUpdate(async (change, context) => {
        const userId = context.params.userId;
        const newData = change.after.data();
        const oldData = change.before.data();
        
        // Check if questionnaire data was changed
        if (JSON.stringify(newData.questionnaire) !== JSON.stringify(oldData.questionnaire)) {
          console.log(`User ${userId} updated their questionnaire, computing matches`);
          await computeMatchesForUser(userId);
        }
      }),

    /**
     * Cloud function to batch compute matches twice daily
     */
    scheduledMatching: functions.pubsub
      .schedule('0 2,14 * * *') // Run at 2am and 2pm
      .timeZone('UTC')
      .onRun(async () => {
        try {
          console.log('Starting scheduled match computation');
          
          // Get users who updated their profile since the last run
          const lastRunTime = new Date();
          lastRunTime.setHours(lastRunTime.getHours() - 12); // 12 hours ago
          
          const usersSnapshot = await db.collection('users')
            .where('updatedAt', '>', lastRunTime)
            .get();
          
          const matchPromises = [];
          
          usersSnapshot.forEach(doc => {
            matchPromises.push(computeMatchesForUser(doc.id));
          });
          
          await Promise.all(matchPromises);
          console.log('Completed scheduled match computation');
          
          return null;
        } catch (error) {
          console.error('Error in scheduled matching:', error);
          return null;
        }
      })
  };
} catch (error) {
  console.log('Running in test environment without Firebase');
}

// Export the core algorithm for testing
module.exports = {
  ...firestoreFunctions,
  utils: userMatchingCore
};

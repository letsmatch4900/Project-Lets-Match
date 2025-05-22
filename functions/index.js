/**
 * Firebase Functions - Supporting both v1 and v2 during migration
 * 
 * See: https://firebase.google.com/docs/functions/2nd-gen-upgrade
 */

// Initialize Firebase Admin SDK (will be used by all functions)
const admin = require("firebase-admin");

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

// Export the v1 functions
exports.dailyQuestionCount = dailyQuestionCount.dailyQuestionReport;
exports.userMatchingOnUserUpdate = userMatching.onUserUpdate;
exports.userMatchingScheduled = userMatching.scheduledMatching;

// Export the v2 functions (new name)
exports.dailyQuestionCountV2 = require("./v2/dailyQuestionCount").dailyQuestionReport;
exports.userProfileUpdatedV2 = require("./v2/userMatching").onUserProfileUpdated;
exports.userMatchingScheduledV2 = require("./v2/userMatching").scheduledUserMatching;

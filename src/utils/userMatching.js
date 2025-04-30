// src/utils/userMatching.js

const userMatchingCore = {
  /**
   * Calculate one-way match score for a single question
   * @param {number} potentialPartnerSelf - The other user's score
   * @param {number} prefersPartnerMin - Your preferred min
   * @param {number} prefersPartnerMax - Your preferred max
   * @param {number} strictness - 0 (lenient) to 10 (strict)
   * @returns {number} - Match score between 0 and 1
   */
  calculateOneWayQuestionScore: function(potentialPartnerSelf, prefersPartnerMin, prefersPartnerMax, strictness) {
    if (potentialPartnerSelf >= prefersPartnerMin && potentialPartnerSelf <= prefersPartnerMax) {
      return 1;
    }

    const distanceMin = Math.abs(potentialPartnerSelf - prefersPartnerMin);
    const distanceMax = Math.abs(potentialPartnerSelf - prefersPartnerMax);
    const minDistance = Math.min(distanceMin, distanceMax);

    return (1 - (minDistance / 10)) * ((10 - strictness) / 10);
  },

  /**
   * Calculate geometric mean of scores
   * @param {number[]} scores - Array of scores
   * @returns {number}
   */
  geometricMean: function(scores) {
    if (scores.length === 0 || scores.includes(0)) return 0;
    const product = scores.reduce((acc, score) => acc * score, 1);
    return Math.pow(product, 1 / scores.length);
  },

  /**
   * Calculate how well userA matches userB's preferences
   * @param {Object} userA - { [questionId]: { self, prefRange, strictness } }
   * @param {Object} userB - Same as userA
   * @returns {number}
   */
  calculateOneWayMatchScore: function(userA, userB) {
    const questionScores = [];

    for (const [questionId, userAAnswers] of Object.entries(userA)) {
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

    return this.geometricMean(questionScores);
  },

  /**
   * Two-way match: both users are satisfied
   * @param {Object} userA
   * @param {Object} userB
   * @returns {number}
   */
  calculateTwoWayMatchScore: function(userA, userB) {
    const aToB = this.calculateOneWayMatchScore(userA, userB);
    const bToA = this.calculateOneWayMatchScore(userB, userA);
    return this.geometricMean([aToB, bToA]);
  }
};

export default userMatchingCore;

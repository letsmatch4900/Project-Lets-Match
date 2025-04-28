// Test script for userMatching.js with exact data

const { utils } = require('./userMatching');

const alex = {
  "cleanliness": {
    self: 8,
    prefRange: [7, 10],
    strictness: 9
  },
  "drivingConfidence": {
    self: 3,
    prefRange: [6, 8],
    strictness: 8
  },
  "enjoysRunning": {
    self: 4,
    prefRange: [7, 9],
    strictness: 8
  }
};

const taylor = {
  "cleanliness": {
    self: 7,
    prefRange: [5, 9],
    strictness: 4
  },
  "drivingConfidence": {
    self: 9,
    prefRange: [2, 7],
    strictness: 6
  },
  "enjoysRunning": {
    self: 8,
    prefRange: [5, 7],
    strictness: 9
  }
};

const jay = {
  "cleanliness": {
    self: 3,
    prefRange: [3, 4],
    strictness: 0
  },
  "drivingConfidence": {
    self: 5,
    prefRange: [1, 2],
    strictness: 0
  },
  "enjoysRunning": {
    self: 6,
    prefRange: [0, 1],
    strictness: 6
  }
};

// Function to show detailed calculation steps for a specific question
function calculateQuestionScore(person1, person2, questionId) {
  const person1Answers = person1.data[questionId];
  const potentialPartnerSelf = person2.data[questionId].self;
  const prefersPartnerMin = person1Answers.prefRange[0];
  const prefersPartnerMax = person1Answers.prefRange[1];
  const strictness = person1Answers.strictness;
  
  const score = utils.calculateOneWayQuestionScore(
    potentialPartnerSelf,
    prefersPartnerMin,
    prefersPartnerMax,
    strictness
  );
  
  console.log(`  ${questionId}: ${score.toFixed(2)}`);
  return score;
}

// Function to calculate one-way match between two people with detailed output
function calculateOneWayMatch(person1, person2) {
  console.log(`\nDoes ${person2.name} match ${person1.name}?`);
  
  const q1Score = calculateQuestionScore(person1, person2, "cleanliness");
  const q2Score = calculateQuestionScore(person1, person2, "drivingConfidence");
  const q3Score = calculateQuestionScore(person1, person2, "enjoysRunning");
  
  const scores = [q1Score, q2Score, q3Score];
  const finalScore = utils.geometricMean(scores);
  console.log(`  Final one-way score: ${finalScore.toFixed(2)}`);
  
  return finalScore;
}

// Function to calculate and display the two-way match
function calculateTwoWayMatch(person1, person2) {
  console.log(`\n======= ${person1.name} vs ${person2.name} =======`);
  
  const oneWayAtoB = calculateOneWayMatch(person1, person2);
  const oneWayBtoA = calculateOneWayMatch(person2, person1);
  
  const twoWayScore = utils.geometricMean([oneWayAtoB, oneWayBtoA]);
  console.log(`\nFINAL TWO-WAY MATCH SCORE: ${twoWayScore.toFixed(2)}`);
  
  return twoWayScore;
}

// Set up the people with names for better output
const people = [
  { name: "Alex", data: alex },
  { name: "Taylor", data: taylor },
  { name: "Jay", data: jay }
];

// Calculate all match combinations
console.log("===========================================");
console.log("   USER MATCHING ALGORITHM - EXACT DATA    ");
console.log("===========================================");

calculateTwoWayMatch(people[0], people[1]); // Alex vs Taylor
calculateTwoWayMatch(people[0], people[2]); // Alex vs Jay
calculateTwoWayMatch(people[1], people[2]); // Taylor vs Jay 
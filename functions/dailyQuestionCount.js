const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const moment = require("moment");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '../.env.local') });

// Use the admin SDK initialized in index.js
const db = admin.firestore();

// Email Transporter
const createTransporter = () => {
  // Get environment variables from .env.local
  const email = process.env.FIREBASE_EMAIL;
  const password = process.env.FIREBASE_PASS;
  
  if (!email || !password) {
    console.error("Email credentials not found in .env.local file");
    return null;
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });
};

exports.dailyQuestionReport = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const now = moment();
  const yesterday = moment().subtract(1, "days");

  try {
    // Log environment variables (redacted for security)
    console.log(`Email config available: ${process.env.FIREBASE_EMAIL ? 'Yes' : 'No'}`);
    
    const snapshot = await db.collection("questions")
        .where("createdAt", ">=", yesterday.toDate())
        .where("createdAt", "<=", now.toDate())
        .get();

    const questionCount = snapshot.size;
    console.log(`Found ${questionCount} questions created in the last 24 hours`);

    // Create transporter for this execution
    const transporter = createTransporter();
    if (!transporter) {
      console.error("Failed to create email transporter");
      return null;
    }

    const mailOptions = {
      from: process.env.FIREBASE_EMAIL,
      to: "matchsc4900@gmail.com",
      subject: "Daily Question Report",
      text: `Total questions added in the last 24 hours: ${questionCount}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email Sent Successfully");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Try to log detailed error information
      if (emailError.response) {
        console.error("SMTP Response:", emailError.response);
      }
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
  }
  
  return null;
});

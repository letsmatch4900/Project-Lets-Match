const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const moment = require("moment");
require("dotenv").config();

// Use the admin SDK initialized in index.js
const db = admin.firestore();

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.FIREBASE_EMAIL,
    pass: process.env.FIREBASE_PASS,
  },
});

exports.dailyQuestionReport = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "UTC",
    memory: "256MiB",
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 1,
    region: "us-central1", // Specify the region explicitly
  }, 
  async (event) => {
    const now = moment();
    const yesterday = moment().subtract(1, "days");

    try {
      const snapshot = await db.collection("questions")
          .where("createdAt", ">=", yesterday.toDate())
          .where("createdAt", "<=", now.toDate())
          .get();

      const questionCount = snapshot.size;

      const mailOptions = {
        from: "lmdqr11@gmail.com",
        to: "matchsc4900@gmail.com",
        subject: "Daily Question Report",
        text: `Total questions added in the last 24 hours: ${questionCount}`,
      };

      await transporter.sendMail(mailOptions);
      console.log("Email Sent:", mailOptions);
    } catch (error) {
      console.error("Error fetching questions or sending email:", error);
    }
  }
); 
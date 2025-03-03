const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const moment = require("moment");
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.FIREBASE_EMAIL,
    pass: process.env.FIREBASE_PASS,
  },
});

exports.dailyQuestionReport = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
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
});

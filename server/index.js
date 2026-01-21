import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- AI SETUP ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are SS Paw Pal, a professional AI assistant dedicated exclusively to pets and companion animals.

STRICT RULES:
1. Answer ONLY pet-related questions.
2. If NOT pet-related, reply exactly:
"I am a pet care assistant and can only answer questions related to pets."

HEALTH:
- Give general guidance only.
- Recommend a veterinarian for serious symptoms.`;

// --- FIREBASE ADMIN SETUP ---
// Only initialize if not already initialized
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin initialized");
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
    }
  } else {
    console.warn("Warning: FIREBASE_SERVICE_ACCOUNT not provided. Notification features may not work.");
  }
}

// --- ROUTES ---

// Health Check
app.get('/', (req, res) => {
  res.send('SS Paw Pal Backend is running');
});

/**
 * CHAT ENDPOINT
 * Handles AI conversation logic
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Use Gemini 3 Flash Preview as per best practices for text tasks
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history || []
    });

    const result = await chat.sendMessage({ message });
    const reply = result.text;

    res.status(200).json({ reply });
  } catch (error) {
    console.error("AI API Error:", error);
    res.status(500).json({
      reply: "I'm having trouble connecting to the network. Please try again.",
    });
  }
});

/**
 * REGISTER DEVICE ENDPOINT
 * Stores FCM Token for Push Notifications
 */
app.post('/api/register-device', async (req, res) => {
  const { token, uid } = req.body;

  if (!token || !uid) {
    return res.status(400).json({ error: "Missing token or uid" });
  }

  try {
    const db = admin.firestore();
    
    await db.collection("users").doc(uid).set({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
      lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Device registered for user ${uid}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * SEND NOTIFICATION ENDPOINT
 * Dispatches Push Notifications via FCM
 */
app.post('/api/send-notification', async (req, res) => {
  const { token, title, body, data } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {
        type: "pet-alert",
      },
    };

    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
    
    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 SS Paw Pal Backend running on http://localhost:${PORT}`);
});
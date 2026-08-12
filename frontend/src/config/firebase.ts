import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Read Firebase Web App Configuration strictly from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.warn(
    "[Firebase Config Warning] VITE_FIREBASE_API_KEY is missing from environment variables (.env). " +
      "Please add your Firebase Web App configuration to your .env file."
  );
}

// Initialize Firebase App safely without creating duplicate instances
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export single shared Firebase Auth instance connected to phone authentication
export const auth = getAuth(app);

// Apply browser/device default language preference for Firebase Phone Auth & reCAPTCHA
auth.useDeviceLanguage();

export default app;

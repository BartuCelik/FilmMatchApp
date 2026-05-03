import "react-native-get-random-values";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  initializeAuth, 
  getReactNativePersistence, 
  browserLocalPersistence, 
  getAuth 
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern ile app başlatma
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Platforma göre persistence seçimi
let auth;
if (Platform.OS === "web") {
  // Web için standart tarayıcı persistence'ı
  auth = getAuth(app); 
} else {
  // Mobil için AsyncStorage tabanlı persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export const db = getFirestore(app);
export { auth };
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAm5t_QenCUqJNpd3jFb5GfLD4xm5mf5u8",
  authDomain: "a-fairy-tale.firebaseapp.com",
  projectId: "a-fairy-tale",
  storageBucket: "a-fairy-tale.firebasestorage.app",
  messagingSenderId: "917238692074",
  appId: "1:917238692074:web:4a5450b54ea7b0a5647f93",
  measurementId: "G-BX6RRM6B2R"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };

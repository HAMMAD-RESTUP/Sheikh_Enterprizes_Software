import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgCwPZJAWQelHBNFQosuErcPINjcQsz8U",
  authDomain: "sheikh-enterprizes.firebaseapp.com",
  projectId: "sheikh-enterprizes",
  storageBucket: "sheikh-enterprizes.firebasestorage.app",
  messagingSenderId: "671796099172",
  appId: "1:671796099172:web:095c8cf4102ef77324c771",
  measurementId: "G-T81X5FK21G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
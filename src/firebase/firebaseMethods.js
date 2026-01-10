
import { auth } from "./firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";


export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    let errorMessage = "Invalid Email or Password!";
    
    // Firebase error codes handle karne ke liye
    if (error.code === 'auth/user-not-found') errorMessage = "Email not found!";
    if (error.code === 'auth/wrong-password') errorMessage = "Password Incorrect!";
    
    return { success: false, error: errorMessage };
  }
};


export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout Error:", error);
    return { success: false, error: error.message };
  }
};


export const checkAuthStatus = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// Function to generate next invoice ID
export const getNextInvoiceID = async (type) => {
  const prefix = type === 'purchase' ? 'PSK-' : 'SHK-';
  const q = query(collection(db, "transactions"), orderBy("invoiceNo", "desc"), limit(50)); // Check last few records
  
  const querySnapshot = await getDocs(q);
  let lastNumber = 0;

  querySnapshot.forEach((doc) => {
    const id = doc.data().invoiceNo;
    if (id && id.startsWith(prefix)) {
      const num = parseInt(id.split('-')[1]);
      if (num > lastNumber) lastNumber = num;
    }
  });

  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `${prefix}${nextNumber}`;
};
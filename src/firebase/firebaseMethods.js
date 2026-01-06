
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
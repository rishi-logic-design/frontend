import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCsVoHWwWJr_aWTHXgYsfXdWZJ3SqBbRu0",
  authDomain: "auditra-bcd8e.firebaseapp.com",
  projectId: "auditra-bcd8e",
  storageBucket: "auditra-bcd8e.firebasestorage.app",
  messagingSenderId: "1016605546026",
  appId: "1:1016605546026:web:15c3e221f7187328d39553",
  measurementId: "G-L0Q2131230",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBShw0obsUUf6j7bBLtxc0FaHy1ZMOwhDI",
  authDomain: "nexus-gpt-5f7cc.firebaseapp.com",
  projectId: "nexus-gpt-5f7cc",
  storageBucket: "nexus-gpt-5f7cc.firebasestorage.app",
  messagingSenderId: "138016645921",
  appId: "1:138016645921:web:bffff55b2eaa0c745bd460",
  measurementId: "G-KYKZ66YJ8Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
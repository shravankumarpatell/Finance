import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

    const firebaseConfig = {
      apiKey: "AIzaSyBSnoqA8q1BLtNJ0oMfMKNFoLFaYXm0SbA",
      authDomain: "fintrack-72385.firebaseapp.com",
      projectId: "fintrack-72385",
      storageBucket: "fintrack-72385.firebasestorage.app",
      messagingSenderId: "348183871916",
      appId: "1:348183871916:web:42feb8b8c6d666ee717a09",
      measurementId: "G-QMTVG790YZ"
    };

    const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);
    export const db = getFirestore(app);


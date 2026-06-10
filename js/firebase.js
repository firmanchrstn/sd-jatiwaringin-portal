// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCJ9svyRa6SdilveuOxikRZkVfRKkWaGgA",
    authDomain: "portal-sd-jtw1.firebaseapp.com",
    projectId: "portal-sd-jtw1",
    storageBucket: "portal-sd-jtw1.firebasestorage.app",
    messagingSenderId: "666787945691",
    appId: "1:666787945691:web:2e578c5e95c49708f2c0fe",
    measurementId: "G-2B4J333RKW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const dbCloud = getFirestore(app);
export { signInWithEmailAndPassword, signOut, doc, setDoc, getDoc };

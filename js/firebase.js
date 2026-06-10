// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAoZBjalA_pl8xYLCkZO31NgLyv2fOreKk",
    authDomain: "sd-jatiwaringin-1.firebaseapp.com",
    projectId: "sd-jatiwaringin-1",
    storageBucket: "sd-jatiwaringin-1.firebasestorage.app",
    messagingSenderId: "669367775735",
    appId: "1:669367775735:web:dbcb263d3f1864b2113ef2",
    measurementId: "G-XY2ES8SD33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
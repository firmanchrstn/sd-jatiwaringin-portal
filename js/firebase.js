// js/firebase.js

// 1. Impor dari URL CDN Google (Karena kita tidak menggunakan Node.js/Bundler)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Kunci Konfigurasi Rahasia Anda
const firebaseConfig = {
    apiKey: "AIzaSyAoZBjalA_pl8xYLCkZO31NgLyv2fOreKk",
    authDomain: "sd-jatiwaringin-1.firebaseapp.com",
    projectId: "sd-jatiwaringin-1",
    storageBucket: "sd-jatiwaringin-1.firebasestorage.app",
    messagingSenderId: "669367775735",
    appId: "1:669367775735:web:dbcb263d3f1864b2113ef2",
    measurementId: "G-XY2ES8SD33"
};

// 3. Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// 4. Aktifkan Layanan Auth & Database
export const auth = getAuth(app);
export const dbCloud = getFirestore(app);

// 5. Ekspor fungsi-fungsi agar bisa dipakai oleh auth.js dan database.js
export { signInWithEmailAndPassword, signOut, doc, setDoc, getDoc };
// ==========================================
// AUTENTIKASI & INITIAL CLOUD SYNC
// ==========================================
import { auth, signInWithEmailAndPassword, signOut, dbCloud, doc, getDoc } from './firebase.js';

export const Auth = {
    isLoggedIn: () => {
        return localStorage.getItem('auth_token') === 'firebase_token_aktif';
    },

    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // --- MENARIK DATA GURU DARI CLOUD FIREBASE ---
            // Menggunakan email sebagai ID brankas unik (Isolasi Data)
            const docRef = doc(dbCloud, "guru_data", user.email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Memindahkan data dari Cloud ke Laptop Lokal
                if (data.profil) localStorage.setItem('db_profil', JSON.stringify(data.profil));
                if (data.kaldik) localStorage.setItem('db_kaldik', JSON.stringify(data.kaldik));
                if (data.siswa) localStorage.setItem('db_siswa', JSON.stringify(data.siswa));
                if (data.kelas) localStorage.setItem('db_kelas', JSON.stringify(data.kelas));
                if (data.presensi) localStorage.setItem('db_presensi', JSON.stringify(data.presensi));
                if (data.nilai) localStorage.setItem('db_nilai', JSON.stringify(data.nilai));
            }
            // ---------------------------------------------

            localStorage.setItem('auth_token', 'firebase_token_aktif');
            localStorage.setItem('user_email', user.email);
            return true;
        } catch (error) {
            console.error("Firebase Login Error:", error.message);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
            // HAPUS SEMUA DATA LOKAL DEMI KEAMANAN GURU
            localStorage.clear();
            window.location.reload();
        } catch (error) {
            console.error("Firebase Logout Error:", error.message);
        }
    }
};
// ==========================================
// AUTENTIKASI (LOGIN SYSTEM)
// ==========================================

export const Auth = {
    // Mengecek apakah ada token aktif di browser
    isLoggedIn: () => {
        return localStorage.getItem('auth_token') === 'guru_aktif_123';
    },

    // Simulasi pengecekan ke database (Untuk mode demo)
    login: (email, password) => {
        // Kredensial Demo (Nanti ini diganti dengan Firebase Auth)
        const emailValid = 'guru@sdnjatiwaringin.id';
        const passValid = 'admin123';

        if (email === emailValid && password === passValid) {
            // Berikan token tanda masuk
            localStorage.setItem('auth_token', 'guru_aktif_123');
            return true;
        }
        return false;
    },

    // Menghapus sesi dan me-refresh halaman
    logout: () => {
        localStorage.removeItem('auth_token');
        window.location.reload();
    }
};
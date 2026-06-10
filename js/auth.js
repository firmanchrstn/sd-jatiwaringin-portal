// Logika Form Login
    const formLogin = document.getElementById('form-login');
    if(formLogin) {
        formLogin.addEventListener('submit', async (e) => { // <-- Perhatikan tambahan kata 'async'
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            
            const btnSubmit = formLogin.querySelector('button');
            btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memverifikasi Server...';
            btnSubmit.disabled = true; // Kunci tombol agar tidak diklik dua kali
            
            try {
                // Menunggu respons dari server Firebase
                await Auth.login(email, pass);
                tampilkanToast('Otorisasi Firebase Berhasil! Mengalihkan...', 'success');
                setTimeout(() => window.location.reload(), 1200);
            } catch (error) {
                // Jika password salah atau email tidak ada di Firebase
                tampilkanToast('Akses Ditolak! Kredensial tidak valid.', 'danger');
                btnSubmit.innerHTML = '<i class="ph ph-sign-in"></i> Masuk Sistem';
                btnSubmit.disabled = false;
            }
        });
    }
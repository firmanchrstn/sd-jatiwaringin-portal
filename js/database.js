// ==========================================
// DATA LAYER (HYBRID CLOUD-LOCAL MODEL)
// ==========================================
import { dbCloud, doc, setDoc } from './firebase.js';

const getUserEmail = () => localStorage.getItem('user_email') || 'default_user';

// Mengubah Ikon Sinkronisasi di UI
const setSyncStatus = (status) => {
    const icon = document.querySelector('#cloud-sync-status i');
    const container = document.getElementById('cloud-sync-status');
    if (!icon) return;

    if (status === 'syncing') {
        icon.className = 'ph ph-cloud-arrow-up';
        container.style.color = 'var(--color-warning)';
        icon.style.animation = 'pulse-sync 1s infinite';
        container.title = 'Sedang menyinkronkan ke Cloud...';
    } else if (status === 'success') {
        icon.className = 'ph ph-cloud-check';
        container.style.color = 'var(--color-success)';
        icon.style.animation = 'none';
        container.title = 'Database Tersinkronisasi';
    } else if (status === 'error') {
        icon.className = 'ph ph-cloud-warning';
        container.style.color = 'var(--color-danger)';
        icon.style.animation = 'none';
        container.title = 'Offline: Gagal sinkronisasi ke Cloud. Data tersimpan lokal.';
    }
};

const syncToCloud = async (kunci, data) => {
    const email = getUserEmail();
    if (email !== 'default_user') {
        setSyncStatus('syncing');
        try {
            await setDoc(doc(dbCloud, "guru_data", email), { [kunci]: data }, { merge: true });
            setTimeout(() => setSyncStatus('success'), 800);
        } catch (err) {
            console.error("Cloud Sync Error:", err);
            setSyncStatus('error');
        }
    }
};

const injeksiID = (arrayData) => {
    let diubah = false;
    const hasil = arrayData.map(item => {
        if (!item.id) { diubah = true; return { ...item, id: Math.random().toString(36).substr(2, 9) }; }
        return item;
    });
    return { hasil, diubah };
};

export const DB = {
    getProfil: () => JSON.parse(localStorage.getItem('db_profil')) || { nama: '', peran: '', wa: '', jk: '', tema_gelap: false, notif_wa: true, notif_browser: true, notif_email: true },
    setProfil: (data) => { localStorage.setItem('db_profil', JSON.stringify(data)); syncToCloud('profil', data); },

    getKaldik: () => {
        let data = JSON.parse(localStorage.getItem('db_kaldik'));
        if (!data || data.length === 0) {
            data = [{ id: 1, tanggal: '2026-07-14', kegiatan: 'Hari Pertama Masuk Sekolah', ket: 'MPLS dan Transisi PAUD SD' }];
            localStorage.setItem('db_kaldik', JSON.stringify(data));
        }
        return data;
    },
    setKaldik: (data) => { localStorage.setItem('db_kaldik', JSON.stringify(data)); syncToCloud('kaldik', data); },

    getSiswa: () => {
        let data = JSON.parse(localStorage.getItem('db_siswa')) || [];
        const { hasil, diubah } = injeksiID(data);
        if (diubah) localStorage.setItem('db_siswa', JSON.stringify(hasil));
        return hasil;
    },
    setSiswa: (data) => { localStorage.setItem('db_siswa', JSON.stringify(data)); syncToCloud('siswa', data); },

    getKelas: () => {
        let data = JSON.parse(localStorage.getItem('db_kelas')) || [];
        const { hasil, diubah } = injeksiID(data);
        if (diubah) localStorage.setItem('db_kelas', JSON.stringify(hasil));
        return hasil;
    },
    setKelas: (data) => { localStorage.setItem('db_kelas', JSON.stringify(data)); syncToCloud('kelas', data); },

    getPresensi: () => {
        let data = JSON.parse(localStorage.getItem('db_presensi')) || [];
        const { hasil, diubah } = injeksiID(data);
        if (diubah) localStorage.setItem('db_presensi', JSON.stringify(hasil));
        return hasil;
    },
    setPresensi: (data) => { localStorage.setItem('db_presensi', JSON.stringify(data)); syncToCloud('presensi', data); },

    getNilai: () => {
        let data = JSON.parse(localStorage.getItem('db_nilai')) || [];
        const { hasil, diubah } = injeksiID(data);
        if (diubah) localStorage.setItem('db_nilai', JSON.stringify(hasil));
        return hasil;
    },
    setNilai: (data) => { localStorage.setItem('db_nilai', JSON.stringify(data)); syncToCloud('nilai', data); },

    resetData: () => {
        if (confirm("PERINGATAN FATAL!\n\nHapus seluruh database sistem?")) {
            ['db_presensi', 'db_kelas', 'db_siswa', 'db_nilai', 'db_kaldik'].forEach(k => localStorage.removeItem(k));
            syncToCloud('presensi', []); syncToCloud('kelas', []); syncToCloud('siswa', []); syncToCloud('nilai', []); syncToCloud('kaldik', []);
            return true;
        }
        return false;
    }
};
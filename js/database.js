// ==========================================
// DATA LAYER (MODEL)
// Semua operasi simpan & ambil data dipusatkan di sini.
// ==========================================

// Fungsi internal penambah ID otomatis untuk keamanan hapus data
const injeksiID = (arrayData) => {
    let diubah = false;
    const hasil = arrayData.map(item => {
        if (!item.id) { diubah = true; return { ...item, id: Math.random().toString(36).substr(2, 9) }; }
        return item;
    });
    return { hasil, diubah };
};

export const DB = {
    getProfil: () => JSON.parse(localStorage.getItem('db_profil')) || { nama: 'Nama Guru', peran: 'Wali Kelas -', wa: '', jk: '', tema_gelap: false, notif_wa: true, notif_browser: true, notif_email: true },
    setProfil: (data) => localStorage.setItem('db_profil', JSON.stringify(data)),

    getKaldik: () => {
        let data = JSON.parse(localStorage.getItem('db_kaldik'));
        if (!data || data.length === 0) {
            data = [
                { id: 1, tanggal: '2026-07-14', kegiatan: 'Hari Pertama Masuk Sekolah', ket: 'MPLS dan Transisi PAUD SD' },
                { id: 2, tanggal: '2026-08-17', kegiatan: 'Libur Hari Proklamasi', ket: 'Kemerdekaan RI' }
            ];
            localStorage.setItem('db_kaldik', JSON.stringify(data));
        }
        return data;
    },
    setKaldik: (data) => localStorage.setItem('db_kaldik', JSON.stringify(data)),

    getSiswa: () => {
        let data = JSON.parse(localStorage.getItem('db_siswa')) || [];
        const { hasil, diubah } = injeksiID(data);
        if (diubah) localStorage.setItem('db_siswa', JSON.stringify(hasil));
        return hasil;
    },
    setSiswa: (data) => localStorage.setItem('db_siswa', JSON.stringify(data)),

    getKelas: () => {
        let data = JSON.parse(localStorage.getItem('db_kelas')) || [];
        const { hasil, diubah } = injeksiID(data);
        if (diubah) localStorage.setItem('db_kelas', JSON.stringify(hasil));
        return hasil;
    },
    setKelas: (data) => localStorage.setItem('db_kelas', JSON.stringify(data)),

    getPresensi: () => {
        let data = JSON.parse(localStorage.getItem('db_presensi')) || [];
        const { hasil, diubah } = injeksiID(data);
        if (diubah) localStorage.setItem('db_presensi', JSON.stringify(hasil));
        return hasil;
    },
    setPresensi: (data) => localStorage.setItem('db_presensi', JSON.stringify(data)),

    getNilai: () => {
        let data = JSON.parse(localStorage.getItem('db_nilai')) || [];
        const { hasil, diubah } = injeksiID(data);
        if (diubah) localStorage.setItem('db_nilai', JSON.stringify(hasil));
        return hasil;
    },
    setNilai: (data) => localStorage.setItem('db_nilai', JSON.stringify(data)),

    resetData: () => {
        if (confirm("PERINGATAN FATAL!\n\nHapus seluruh database sistem?")) {
            ['db_presensi', 'db_kelas', 'db_siswa', 'db_nilai', 'db_kaldik'].forEach(k => localStorage.removeItem(k));
            return true;
        }
        return false;
    }
};